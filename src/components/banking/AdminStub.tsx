import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import type { ReactNode } from "react";

export function AdminStub({ eyebrow, title, intro, rows, columns }: {
  eyebrow: string; title: string; intro: string;
  columns: string[]; rows: (string | ReactNode)[][];
}) {
  return (
    <>
      <PageHead eyebrow={eyebrow} title={title} actions={<Pill tone="primary">Operations</Pill>} />
      <div className="p-8">
        <p className="mb-5 max-w-3xl text-sm text-muted-foreground">{intro}</p>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="grid gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
            {columns.map(c => <div key={c}>{c}</div>)}
          </div>
          <div className="divide-y divide-border/60">
            {rows.map((r, i) => (
              <div key={i} className="grid items-center gap-3 px-5 py-3.5 text-sm hover:bg-surface/40" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
                {r.map((c, j) => <div key={j}>{c}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
