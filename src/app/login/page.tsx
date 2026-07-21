import { Info } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const { pending } = await searchParams;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account to continue">
      {pending ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300">
          <Info className="size-4 shrink-0" />
          Your account is pending admin approval. You&apos;ll be able to sign in once it&apos;s approved.
        </div>
      ) : null}
      <LoginForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
