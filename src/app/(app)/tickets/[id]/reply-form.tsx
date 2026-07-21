"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReplyAction, polishReplyAction, type ReplyState } from "@/lib/actions/tickets";

export function ReplyForm({ ticketId }: { ticketId: number }) {
  const boundAction = createReplyAction.bind(null, ticketId);
  const [state, formAction, isSubmitting] = useActionState<ReplyState, FormData>(boundAction, undefined);
  const [body, setBody] = useState("");
  const [isPolishing, startPolishing] = useTransition();
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (wasSubmitting.current && !isSubmitting && !state?.error) {
      setBody("");
    }
    wasSubmitting.current = isSubmitting;
  }, [isSubmitting, state]);

  function handlePolish() {
    if (!body.trim()) {
      toast.error("Write a draft reply first.");
      return;
    }
    startPolishing(async () => {
      const result = await polishReplyAction(ticketId, body);
      if (result.error) {
        toast.error(result.error);
      } else if (result.body) {
        setBody(result.body);
      }
    });
  }

  return (
    <form action={formAction} className="space-y-3">
      <Textarea
        name="body"
        placeholder="Write a reply…"
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={handlePolish} disabled={isPolishing}>
          <Sparkles className="size-4" />
          {isPolishing ? "Polishing…" : "Polish with AI"}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </form>
  );
}
