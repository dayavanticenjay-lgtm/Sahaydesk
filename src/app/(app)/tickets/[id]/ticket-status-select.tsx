"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatStatus } from "@/lib/format";
import { updateTicketStatusAction } from "@/lib/actions/tickets";
import type { TicketStatus } from "@/generated/prisma/enums";

const STATUSES: TicketStatus[] = ["NEW", "PROCESSING", "OPEN", "RESOLVED", "CLOSED"];

export function TicketStatusSelect({ ticketId, status }: { ticketId: number; status: TicketStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          await updateTicketStatusAction(ticketId, value as TicketStatus);
          toast.success("Ticket status updated.");
        });
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {formatStatus(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
