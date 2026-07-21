"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeTicketAction } from "@/lib/actions/tickets";

export function SummarizePanel({ ticketId }: { ticketId: number }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await summarizeTicketAction(ticketId);
      if (result.error) {
        setError(result.error);
        setSummary(null);
      } else {
        setSummary(result.summary ?? "");
      }
    });
  }

  return (
    <Card className="gap-3 border-primary/20 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" />
          AI summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {summary ? (
          <p className="text-sm text-muted-foreground">{summary}</p>
        ) : !error ? (
          <p className="text-sm text-muted-foreground">Generate a quick recap of this conversation.</p>
        ) : null}
        <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending} className="w-full">
          {isPending ? "Summarizing…" : summary ? "Regenerate" : "Summarize"}
        </Button>
      </CardContent>
    </Card>
  );
}
