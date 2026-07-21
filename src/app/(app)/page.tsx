import Link from "next/link";
import { Inbox, Sparkles, Ticket as TicketIcon, Timer, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardStats } from "@/lib/dashboard";
import { formatCategory, formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { TicketVolumeChart } from "./ticket-volume-chart";
import type { TicketWhereInput } from "@/generated/prisma/models/Ticket";

const FILTER_KEYS = ["total", "open", "resolved-ai", "total-resolution"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const FILTER_CONFIG: Record<FilterKey, { title: string; where: TicketWhereInput; viewAllHref: string }> = {
  total: {
    title: "All tickets",
    where: {},
    viewAllHref: "/tickets",
  },
  open: {
    title: "Open tickets",
    where: { status: "OPEN" },
    viewAllHref: "/tickets?status=OPEN",
  },
  "resolved-ai": {
    title: "Resolved by AI",
    where: { status: "RESOLVED", assignedTo: { isAiAgent: true } },
    viewAllHref: "/tickets?status=RESOLVED",
  },
  "total-resolution": {
    title: "Resolved tickets",
    where: { status: "RESOLVED" },
    viewAllHref: "/tickets?status=RESOLVED",
  },
};

function isFilterKey(value: string | undefined): value is FilterKey {
  return !!value && (FILTER_KEYS as readonly string[]).includes(value);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const activeFilter = isFilterKey(filter) ? filter : undefined;

  const { stats, dailyVolume } = await getDashboardStats();

  const filteredTickets = activeFilter
    ? await prisma.ticket.findMany({
        where: FILTER_CONFIG[activeFilter].where,
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : null;
  const filteredTotal = activeFilter ? await prisma.ticket.count({ where: FILTER_CONFIG[activeFilter].where }) : 0;

  const cards: {
    key: FilterKey;
    label: string;
    value: string;
    icon: typeof TicketIcon;
    tint: string;
  }[] = [
    {
      key: "total",
      label: "Total tickets",
      value: stats.totalTickets.toLocaleString(),
      icon: TicketIcon,
      tint: "bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/30",
    },
    {
      key: "open",
      label: "Open tickets",
      value: stats.openTickets.toLocaleString(),
      icon: Inbox,
      tint: "bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/30",
    },
    {
      key: "resolved-ai",
      label: "Resolved by AI",
      value: `${stats.resolvedByAI} · ${stats.aiResolutionRate}%`,
      icon: Sparkles,
      tint: "bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-fuchsia-500/30",
    },
    {
      key: "total-resolution",
      label: "Total resolution time",
      value: formatDuration(stats.totalResolutionTime),
      icon: Timer,
      tint: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An overview of your support activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const isActive = activeFilter === card.key;
          return (
            <Link key={card.key} href={isActive ? "/" : `/?filter=${card.key}`} className="block">
              <Card
                className={`gap-3 transition-shadow hover:shadow-xl ${
                  isActive ? "ring-2 ring-primary/60" : ""
                }`}
              >
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">{card.label}</CardTitle>
                  <div className={`flex size-8 items-center justify-center rounded-lg text-white shadow-md ${card.tint}`}>
                    <card.icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {activeFilter && filteredTickets ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{FILTER_CONFIG[activeFilter].title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredTotal} ticket{filteredTotal === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={FILTER_CONFIG[activeFilter].viewAllHref} className="text-sm text-primary hover:underline">
                View all in Tickets →
              </Link>
              <Link
                href="/"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear filter"
              >
                <X className="size-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredTickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No tickets match this filter.</p>
            ) : (
              filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-border hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{ticket.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ticket.senderName} · {ticket.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="hidden font-normal text-muted-foreground sm:inline-flex">
                      {formatCategory(ticket.category)}
                    </Badge>
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Ticket volume</CardTitle>
          <p className="text-sm text-muted-foreground">Tickets created over the last 30 days</p>
        </CardHeader>
        <CardContent>
          <TicketVolumeChart data={dailyVolume} />
        </CardContent>
      </Card>
    </div>
  );
}
