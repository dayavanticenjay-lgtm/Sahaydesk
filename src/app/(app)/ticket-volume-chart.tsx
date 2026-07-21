"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function TicketVolumeChart({ data }: { data: { date: string; tickets: number }[] }) {
  const maxTickets = Math.max(...data.map((d) => d.tickets), 1);
  const yStep = Math.max(1, Math.ceil(maxTickets / 4));
  const yMax = yStep * Math.ceil(maxTickets / yStep);
  const yTicks = Array.from({ length: yMax / yStep + 1 }, (_, i) => i * yStep);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="ticketVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ticketVolumeStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-chart-1)" />
            <stop offset="100%" stopColor="var(--color-chart-2)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 12 }}
          interval={4}
          className="fill-muted-foreground"
        />
        <YAxis
          allowDecimals={false}
          domain={[0, yMax]}
          ticks={yTicks}
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          width={32}
        />
        <Tooltip
          labelFormatter={(value) => formatDateLabel(String(value))}
          formatter={(value) => [`${value} ticket${value === 1 ? "" : "s"}`, ""]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            background: "var(--popover)",
            borderColor: "var(--border)",
            backdropFilter: "blur(16px)",
          }}
        />
        <Area type="monotone" dataKey="tickets" stroke="url(#ticketVolumeStroke)" fill="url(#ticketVolume)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
