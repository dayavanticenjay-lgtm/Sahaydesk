import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null | undefined;

function getTransporter() {
  if (!process.env.MAIL_HOST) return null;

  if (transporter === undefined) {
    const port = Number(process.env.MAIL_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendTicketReplyEmail(input: { to: string; subject: string; body: string }) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`[mail] MAIL_HOST not configured — skipping send to ${input.to}: "${input.subject}"`);
    return;
  }

  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME;
  const fromName = process.env.MAIL_FROM_NAME || "Support";

  await transport.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: input.to,
    subject: input.subject,
    text: input.body,
  });
}
