"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTicketAssigneeAction } from "@/lib/actions/tickets";

export function TicketAssigneeSelect({
  ticketId,
  assignedToId,
  agents,
}: {
  ticketId: number;
  assignedToId: number | null;
  agents: { id: number; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={assignedToId ? String(assignedToId) : "unassigned"}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          await updateTicketAssigneeAction(ticketId, value === "unassigned" ? null : Number(value));
          toast.success("Assignee updated.");
        });
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={String(agent.id)}>
            {agent.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
