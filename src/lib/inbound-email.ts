import { prisma } from "@/lib/prisma";

export function parseFromField(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const name = match[1].trim();
    return { name: name !== "" ? name : match[2], email: match[2] };
  }
  return { name: from, email: from };
}

export function stripSubjectPrefixes(subject: string): string {
  return subject.replace(/^(Re:\s*|Fwd:\s*)+/gi, "").trim();
}

export async function handleInboundEmail(input: { from: string; subject?: string | null; text?: string | null; html?: string | null }) {
  const { email: senderEmail, name: senderName } = parseFromField(input.from);
  const subject = stripSubjectPrefixes(input.subject || "(no subject)");
  const body = input.text ?? "";

  const existingTicket = await prisma.ticket.findFirst({
    where: {
      senderEmail,
      status: { notIn: ["RESOLVED", "CLOSED"] },
      subject: { equals: subject, mode: "insensitive" },
    },
  });

  if (existingTicket) {
    await prisma.ticketReply.create({
      data: {
        body,
        bodyHtml: input.html,
        senderType: "CUSTOMER",
        ticketId: existingTicket.id,
      },
    });

    return { ticket: existingTicket, created: false };
  }

  const aiAgent = await prisma.user.findFirst({ where: { isAiAgent: true }, select: { id: true } });

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      body,
      bodyHtml: input.html,
      senderName,
      senderEmail,
      assignedToId: aiAgent?.id,
    },
  });

  return { ticket, created: true };
}
