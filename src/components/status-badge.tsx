import { formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/generated/prisma/enums";

const STATUS_STYLE: Record<TicketStatus, string> = {
  NEW: "bg-cyan-500/12 text-cyan-700 ring-1 ring-inset ring-cyan-500/25 dark:text-cyan-300",
  PROCESSING: "bg-amber-500/12 text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300",
  OPEN: "bg-violet-500/12 text-violet-700 ring-1 ring-inset ring-violet-500/25 dark:text-violet-300",
  RESOLVED: "bg-emerald-500/12 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-300",
  CLOSED: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

const STATUS_DOT: Record<TicketStatus, string> = {
  NEW: "bg-cyan-500",
  PROCESSING: "bg-amber-500",
  OPEN: "bg-violet-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-muted-foreground/50",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLE[status],
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])} />
      {formatStatus(status)}
    </span>
  );
}
