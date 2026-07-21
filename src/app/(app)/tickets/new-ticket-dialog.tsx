"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
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
import { createTicketAction, type CreateTicketState } from "@/lib/actions/tickets";

export function NewTicketDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<CreateTicketState, FormData>(createTicketAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      setOpen(false);
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a ticket</DialogTitle>
          <DialogDescription>Log a support request on behalf of a customer.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-ticket-subject">Subject</Label>
            <Input id="new-ticket-subject" name="subject" placeholder="Can't reset my password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-ticket-body">Description</Label>
            <Textarea id="new-ticket-body" name="body" rows={4} placeholder="What does the customer need help with?" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-ticket-sender-name">Requester name</Label>
              <Input id="new-ticket-sender-name" name="senderName" placeholder="Priya Shah" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-ticket-sender-email">Requester email</Label>
              <Input
                id="new-ticket-sender-email"
                name="senderEmail"
                type="email"
                placeholder="priya@example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-ticket-category">Category</Label>
            <Select name="category" defaultValue="GENERAL_QUESTION">
              <SelectTrigger id="new-ticket-category" className="w-full">
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
              {isPending ? "Creating…" : "Create ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
