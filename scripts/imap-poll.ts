import "dotenv/config";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "../src/lib/prisma";
import { handleInboundEmail } from "../src/lib/inbound-email";

const POLL_INTERVAL_MS = Number(process.env.IMAP_POLL_INTERVAL_MS ?? 90_000);

// Only messages whose Subject contains this string become tickets. Everything else —
// including its read/unseen flag — is left completely untouched: the filter is applied
// as part of the IMAP SEARCH query itself, so non-matching messages are never fetched
// or flagged by this poller in the first place.
const SUBJECT_FILTER = process.env.IMAP_SUBJECT_FILTER ?? "ticket";

let polling = false;
let stopped = false;

async function pollInbox(): Promise<void> {
  if (polling) return; // skip this tick if the previous poll is still running
  polling = true;

  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: process.env.IMAP_SECURE !== "false",
    auth: {
      user: process.env.IMAP_USERNAME!,
      pass: process.env.IMAP_PASSWORD!,
    },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // IMAP SEARCH SUBJECT is a case-insensitive substring match performed server-side,
      // so this is the only set of messages this poller ever sees or touches.
      const uids = await client.search(
        { seen: false, subject: SUBJECT_FILTER },
        { uid: true }
      );
      if (!uids || uids.length === 0) return;

      for (const uid of uids) {
        try {
          const message = await client.fetchOne(uid, { source: true }, { uid: true });
          if (!message || !message.source) continue;

          const parsed = await simpleParser(message.source);
          const fromAddress = parsed.from?.value[0];

          if (!fromAddress?.address) {
            console.warn(`IMAP: skipping message ${uid} with no parseable From address`);
            await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
            continue;
          }

          const fromHeader = fromAddress.name
            ? `${fromAddress.name} <${fromAddress.address}>`
            : fromAddress.address;

          const { ticket, created } = await handleInboundEmail({
            from: fromHeader,
            subject: parsed.subject || "(no subject)",
            text: parsed.text || "(empty message)",
            html: typeof parsed.html === "string" ? parsed.html : undefined,
          });

          console.log(
            `IMAP: ${created ? "created ticket" : "appended reply to ticket"} #${ticket.id} from ${fromAddress.address}`
          );

          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
        } catch (error) {
          console.error(`IMAP: failed to process message ${uid}:`, error);
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("IMAP: poll failed:", error);
  } finally {
    await client.logout().catch(() => {});
    polling = false;
  }
}

async function main() {
  if (!process.env.IMAP_HOST || !process.env.IMAP_USERNAME || !process.env.IMAP_PASSWORD) {
    console.error("IMAP polling disabled: IMAP_HOST/IMAP_USERNAME/IMAP_PASSWORD not set");
    process.exit(1);
  }

  console.log(`IMAP polling started (every ${Math.round(POLL_INTERVAL_MS / 1000)}s, subject filter: "${SUBJECT_FILTER}")`);

  const shutdown = async () => {
    if (stopped) return;
    stopped = true;
    console.log("IMAP polling: shutting down...");
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  while (!stopped) {
    await pollInbox();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
