import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const aiAgent = await prisma.user.findFirst({ where: { isAiAgent: true }, select: { id: true } });

  const [totalTickets, openTickets, totalResolved, resolvedByAi, resolvedTickets] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    aiAgent
      ? prisma.ticket.count({ where: { status: "RESOLVED", assignedToId: aiAgent.id } })
      : Promise.resolve(0),
    prisma.ticket.findMany({
      where: { status: "RESOLVED" },
      select: { createdAt: true, updatedAt: true },
    }),
  ]);

  const totalResolutionSeconds = Math.round(
    resolvedTickets.reduce((sum, t) => sum + (t.updatedAt.getTime() - t.createdAt.getTime()) / 1000, 0),
  );

  const today = new Date();
  const todayUtcMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const thirtyDaysAgo = new Date(todayUtcMidnight - 29 * 86400 * 1000);

  const recentTickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const countsByDate = new Map<string, number>();
  for (const ticket of recentTickets) {
    const key = ticket.createdAt.toISOString().slice(0, 10);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  const dailyVolume = Array.from({ length: 30 }, (_, offset) => {
    const key = new Date(thirtyDaysAgo.getTime() + offset * 86400 * 1000).toISOString().slice(0, 10);
    return { date: key, tickets: countsByDate.get(key) ?? 0 };
  });

  return {
    stats: {
      totalTickets,
      openTickets,
      resolvedByAI: resolvedByAi,
      aiResolutionRate: totalResolved > 0 ? Math.round((resolvedByAi / totalResolved) * 1000) / 10 : 0,
      totalResolutionTime: totalResolutionSeconds,
    },
    dailyVolume,
  };
}
