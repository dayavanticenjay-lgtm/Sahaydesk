export function GradientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-40 size-[34rem] rounded-full bg-violet-400/35 blur-[110px] dark:bg-violet-600/25" />
      <div className="absolute top-1/4 -right-40 size-[30rem] rounded-full bg-fuchsia-400/30 blur-[110px] dark:bg-fuchsia-600/20" />
      <div className="absolute bottom-[-12rem] left-1/4 size-[32rem] rounded-full bg-cyan-300/30 blur-[110px] dark:bg-cyan-500/20" />
      <div className="absolute right-1/4 bottom-0 size-[24rem] rounded-full bg-amber-300/20 blur-[110px] dark:bg-amber-500/10" />
    </div>
  );
}
