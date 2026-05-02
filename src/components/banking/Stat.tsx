import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label, value, sub, accent, icon, className,
}: { label: string; value: ReactNode; sub?: ReactNode; accent?: "gold" | "primary" | "success" | "warning"; icon?: ReactNode; className?: string }) {
  const ring = accent === "gold" ? "shadow-[var(--shadow-gold)]" : accent === "primary" ? "shadow-[var(--shadow-glow)]" : "";
  return (
    <div className={cn("relative rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5 backdrop-blur-sm", ring, className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-3 font-mono-num text-xl font-semibold leading-tight text-foreground sm:text-2xl xl:text-[26px] break-words [overflow-wrap:anywhere]">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

export function Pill({ tone = "muted", children }: { tone?: "muted" | "success" | "warning" | "danger" | "primary" | "gold"; children: ReactNode }) {
  const map: Record<string, string> = {
    muted: "bg-muted text-muted-foreground border-border/60",
    success: "bg-[oklch(0.74_0.15_158/0.12)] text-success border-[oklch(0.74_0.15_158/0.3)]",
    warning: "bg-[oklch(0.80_0.16_70/0.12)] text-warning border-[oklch(0.80_0.16_70/0.3)]",
    danger: "bg-[oklch(0.65_0.22_25/0.12)] text-destructive border-[oklch(0.65_0.22_25/0.3)]",
    primary: "bg-[oklch(0.68_0.16_245/0.12)] text-primary border-[oklch(0.68_0.16_245/0.3)]",
    gold: "bg-[oklch(0.82_0.13_86/0.12)] text-gold border-[oklch(0.82_0.13_86/0.3)]",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider", map[tone])}>{children}</span>;
}
