import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TicketCategory, TicketStatus, SenderType } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Ava Admin",
      email: "admin@example.com",
      password,
      role: "ADMIN",
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      name: "Sam Agent",
      email: "agent@example.com",
      password,
      role: "AGENT",
    },
  });

  const aiAgent = await prisma.user.upsert({
    where: { email: "ai-agent@example.com" },
    update: {},
    create: {
      name: "AI Assistant",
      email: "ai-agent@example.com",
      password,
      role: "AGENT",
      isAiAgent: true,
    },
  });

  const now = Date.now();
  const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000);

  const tickets: {
    subject: string;
    body: string;
    status: TicketStatus;
    category: TicketCategory;
    senderName: string;
    senderEmail: string;
    assignedToId?: number;
    createdAt?: Date;
    replies?: { body: string; senderType: SenderType; userId?: number }[];
  }[] = [
    {
      subject: "Can't log into my account",
      body: "I keep getting an invalid password error even after resetting it twice.",
      status: "OPEN",
      category: "TECHNICAL_QUESTION",
      senderName: "Priya Shah",
      senderEmail: "priya.shah@example.com",
      assignedToId: agent.id,
      replies: [
        {
          body: "Thanks for reaching out, Priya — could you tell me which browser you're using?",
          senderType: "AGENT",
          userId: agent.id,
        },
      ],
    },
    {
      subject: "Refund for duplicate charge",
      body: "I was charged twice for my subscription this month, order #4821.",
      status: "RESOLVED",
      category: "REFUND_REQUEST",
      senderName: "Marcus Lee",
      senderEmail: "marcus.lee@example.com",
      assignedToId: aiAgent.id,
      createdAt: hoursAgo(3),
      replies: [
        {
          body: "I've confirmed the duplicate charge and issued a refund — you should see it in 3-5 business days.",
          senderType: "AGENT",
          userId: aiAgent.id,
        },
      ],
    },
    {
      subject: "How do I export my data?",
      body: "Is there a way to export all my tickets to CSV?",
      status: "CLOSED",
      category: "GENERAL_QUESTION",
      senderName: "Elena Petrova",
      senderEmail: "elena.petrova@example.com",
      assignedToId: agent.id,
      createdAt: hoursAgo(30),
      replies: [
        {
          body: "Yes! Go to Settings > Export and choose CSV — happy to walk you through it if needed.",
          senderType: "AGENT",
          userId: agent.id,
        },
      ],
    },
    {
      subject: "API returning 500 on webhook endpoint",
      body: "Our integration started failing this morning with a 500 from your inbound webhook.",
      status: "OPEN",
      category: "TECHNICAL_QUESTION",
      senderName: "Jordan Kim",
      senderEmail: "jordan.kim@example.com",
    },
    {
      subject: "Feature request: dark mode",
      body: "Would love a dark mode option for the dashboard.",
      status: "NEW",
      category: "GENERAL_QUESTION",
      senderName: "Sofia Rossi",
      senderEmail: "sofia.rossi@example.com",
    },
  ];

  for (const t of tickets) {
    const existing = await prisma.ticket.findFirst({ where: { senderEmail: t.senderEmail, subject: t.subject } });
    if (existing) continue;

    await prisma.ticket.create({
      data: {
        subject: t.subject,
        body: t.body,
        status: t.status,
        category: t.category,
        senderName: t.senderName,
        senderEmail: t.senderEmail,
        assignedToId: t.assignedToId,
        createdAt: t.createdAt,
        replies: t.replies
          ? { create: t.replies.map((r) => ({ body: r.body, senderType: r.senderType, userId: r.userId })) }
          : undefined,
      },
    });
  }

  console.log("Seeded users:", { admin: admin.email, agent: agent.email, aiAgent: aiAgent.email });
  console.log(`Login with password: "password"`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
