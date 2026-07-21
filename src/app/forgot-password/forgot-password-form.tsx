"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction, type RequestResetState } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<RequestResetState, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MailCheck className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Check your email</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for that address, we&apos;ve sent a link to reset your password.
          </p>
        </div>
        {state.devResetUrl ? (
          <div className="space-y-1 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-left">
            <p className="text-xs font-semibold text-muted-foreground">
              Dev mode — no email service is configured, so here&apos;s the link directly:
            </p>
            <Link href={state.devResetUrl} className="block truncate text-xs text-primary hover:underline">
              {state.devResetUrl}
            </Link>
          </div>
        ) : null}
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input id="forgot-email" name="email" type="email" placeholder="agent@example.com" required autoFocus />
      </div>

      {state?.error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-inset ring-destructive/20">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
