"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@example.com" },
  { label: "Agent", email: "agent@example.com" },
];

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password");
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <div className="space-y-5">
      {googleEnabled ? (
        <>
          <GoogleSignInButton />
          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="relative bg-card px-2">or continue with email</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-border" />
          </div>
        </>
      ) : null}

      <form ref={formRef} action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="agent@example.com"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {state?.error ? (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-inset ring-destructive/20">
            <AlertCircle className="size-4 shrink-0" />
            {state.error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>

        <div className="relative py-1 text-center text-xs text-muted-foreground">
          <span className="relative bg-card px-2">or try a demo account</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => fillDemoAccount(account.email)}
            >
              Continue as {account.label}
            </Button>
          ))}
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
