import { requireUser } from "@/lib/dal";
import { AppSidebar } from "./app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex h-svh">
      <AppSidebar user={{ name: user.name ?? "", email: user.email ?? "", role: user.role }} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
