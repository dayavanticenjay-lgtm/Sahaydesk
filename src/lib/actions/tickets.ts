"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { summarizeConversation, polishReply } from "@/lib/ai";
import { sendTicketReplyEmail } from "@/lib/mail";
import type { TicketStatus } from "@/generated/prisma/enums";

const createTicketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters."),
  body: z.string().trim().min(1, "Description is required."),
  senderName: z.string().trim().min(2, "Requester name must be at least 2 characters."),
  senderEmail: z.email("Enter a valid requester email address."),
  category: z.enum(["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"]).optional(),
});

export type CreateTicketState = { error?: string } | undefined;

export async function createTicketAction(_prevState: CreateTicketState, formData: FormData): Promise<CreateTicketState> {
  await requireUser();

  const parsed = createTicketSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    senderName: formData.get("senderName"),
    senderEmail: formData.get("senderEmail"),
    category: formData.get("category") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.ticket.create({
    data: {
      subject: parsed.data.subject,
      body: parsed.data.body,
      senderName: parsed.data.senderName,
      senderEmail: parsed.data.senderEmail,
      category: parsed.data.category,
      status: "OPEN",
    },
  });

  revalidatePath("/tickets");
  revalidatePath("/");
}

const updateTicketSchema = createTicketSchema;

export type UpdateTicketState = { error?: string } | undefined;

export async function updateTicketAction(
  ticketId: number,
  _prevState: UpdateTicketState,
  formData: FormData,
): Promise<UpdateTicketState> {
  await requireUser();

  const parsed = updateTicketSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    senderName: formData.get("senderName"),
    senderEmail: formData.get("senderEmail"),
    category: formData.get("category") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      subject: parsed.data.subject,
      body: parsed.data.body,
      senderName: parsed.data.senderName,
      senderEmail: parsed.data.senderEmail,
      category: parsed.data.category,
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/");
}

export async function deleteTicketAction(ticketId: number) {
  await requireUser();

  await prisma.ticket.delete({ where: { id: ticketId } });

  revalidatePath("/tickets");
  revalidatePath("/");
  redirect("/tickets");
}

export async function updateTicketStatusAction(ticketId: number, status: TicketStatus) {
  await requireUser();

  await prisma.ticket.update({ where: { id: ticketId }, data: { status } });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/");
}

export async function updateTicketAssigneeAction(ticketId: number, assignedToId: number | null) {
  await requireUser();

  await prisma.ticket.update({ where: { id: ticketId }, data: { assignedToId } });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/");
}

export type ReplyState = { error?: string } | undefined;

export async function createReplyAction(ticketId: number, _prevState: ReplyState, formData: FormData): Promise<ReplyState> {
  const user = await requireUser();

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) {
    return { error: "Reply cannot be empty." };
  }

  await prisma.ticketReply.create({
    data: {
      body,
      senderType: "AGENT",
      ticketId,
      userId: Number(user.id),
    },
  });

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { status: true, subject: true, senderEmail: true },
  });

  if (ticket && ticket.status !== "RESOLVED") {
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: "RESOLVED" } });
  }

  if (ticket) {
    try {
      await sendTicketReplyEmail({
        to: ticket.senderEmail,
        subject: `Re: ${ticket.subject}`,
        body,
      });
    } catch (error) {
      console.error("Failed to send reply email", error);
    }
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/");
}

export async function summarizeTicketAction(ticketId: number): Promise<{ summary?: string; error?: string }> {
  await requireUser();

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { replies: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return { error: "Ticket not found." };

  const conversation = ticket.replies
    .map((reply) => {
      const sender = reply.senderType === "AGENT" ? reply.user?.name ?? "Agent" : ticket.senderName;
      return `${sender}: ${reply.body}`;
    })
    .join("\n\n");

  try {
    const summary = await summarizeConversation({ subject: ticket.subject, body: ticket.body, conversation });
    return { summary };
  } catch (error) {
    console.error(error);
    return { error: "AI summary is temporarily unavailable. Please try again." };
  }
}

export async function polishReplyAction(ticketId: number, body: string): Promise<{ body?: string; error?: string }> {
  const user = await requireUser();

  if (!body.trim()) return { error: "Write a draft reply first." };

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { senderName: true } });
  if (!ticket) return { error: "Ticket not found." };

  try {
    const polished = await polishReply({
      body,
      agentName: user.name ?? "Agent",
      customerName: ticket.senderName.split(" ")[0],
    });
    return { body: polished };
  } catch (error) {
    console.error(error);
    return { error: "AI polish is temporarily unavailable. Please try again." };
  }
}
