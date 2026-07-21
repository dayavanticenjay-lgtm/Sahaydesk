import { HandHelping, Sparkles, Ticket, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  { icon: Sparkles, text: "AI-assisted summaries and reply polishing" },
  { icon: Ticket, text: "One queue for every channel, always in sync" },
  { icon: Activity, text: "Live dashboards on volume and resolution time" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 p-10 text-white lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <HandHelping className="size-4.5" />
          </div>
          <span className="font-bold tracking-tight">Sahaydesk</span>
        </div>

        <div className="relative space-y-8">
          <h1 className="max-w-sm text-4xl font-bold tracking-tight text-balance">Support, streamlined.</h1>
          <ul className="space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3 text-sm text-white/90">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <feature.icon className="size-4" />
                </div>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">Built for support teams who move fast.</p>
      </div>

      <div className="relative flex flex-col items-center justify-center overflow-hidden p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
              <HandHelping className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sahaydesk</h1>
          </div>

          <div className="hidden text-center lg:block">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <p className="text-center text-sm text-muted-foreground lg:hidden">{subtitle}</p>

          <Card>
            <CardContent className="pt-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
