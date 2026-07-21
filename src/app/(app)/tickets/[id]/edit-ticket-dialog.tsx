"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTicketAction, type UpdateTicketState } from "@/lib/actions/tickets";
import type { TicketCategory } from "@/generated/prisma/enums";

export function EditTicketDialog({
  ticketId,
  subject,
  body,
  senderName,
  senderEmail,
  category,
}: {
  ticketId: number;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  category: TicketCategory | null;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateTicketAction.bind(null, ticketId);
  const [state, formAction, isPending] = useActionState<UpdateTicketState, FormData>(boundAction, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit ticket</DialogTitle>
          <DialogDescription>Update the ticket details.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-ticket-subject">Subject</Label>
            <Input id="edit-ticket-subject" name="subject" defaultValue={subject} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ticket-body">Description</Label>
            <Textarea id="edit-ticket-body" name="body" rows={4} defaultValue={body} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-ticket-sender-name">Requester name</Label>
              <Input id="edit-ticket-sender-name" name="senderName" defaultValue={senderName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ticket-sender-email">Requester email</Label>
              <Input
                id="edit-ticket-sender-email"
                name="senderEmail"
                type="email"
                defaultValue={senderEmail}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ticket-category">Category</Label>
            <Select name="category" defaultValue={category ?? "GENERAL_QUESTION"}>
              <SelectTrigger id="edit-ticket-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL_QUESTION">General question</SelectItem>
                <SelectItem value="TECHNICAL_QUESTION">Technical question</SelectItem>
                <SelectItem value="REFUND_REQUEST">Refund request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
