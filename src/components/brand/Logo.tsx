import { cn } from "@/lib/utils";

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[oklch(0.86_0.13_90)] to-[oklch(0.62_0.15_60)] shadow-[0_4px_16px_-4px_oklch(0.82_0.13_86/0.5)]" />
        <div className="absolute inset-0 grid place-items-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[oklch(0.18_0.04_80)]" fill="currentColor">
            <path d="M3 10 12 4l9 6v1H3v-1Zm1.5 2h2v6h-2v-6Zm4 0h2v6h-2v-6Zm4 0h2v6h-2v-6Zm4 0h2v6h-2v-6ZM3 19h18v2H3v-2Z" />
          </svg>
        </div>
      </div>
      {withWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-base font-semibold tracking-tight text-foreground">Prominence</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Private Bank</span>
        </div>
      )}
    </div>
  );
}
