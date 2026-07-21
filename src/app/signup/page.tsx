import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "./signup-form";

export default function SignUpPage() {
  return (
    <AuthShell title="Create an account" subtitle="Sign up to request access to the helpdesk">
      <SignUpForm />
    </AuthShell>
  );
}
