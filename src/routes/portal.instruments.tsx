import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listInstruments, type BankInstrument } from "@/api/banking";
import { fmtCents } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, FileText, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/portal/instruments")({ component: InstrumentsPage });

function InstrumentsPage() {
  const [rows, setRows] = useState<BankInstrument[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await listInstruments()); }
    catch (e) { toast.error("Load failed", { description: (e as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  return (
    <>
      <PageHead eyebrow="Trade & finance" title="Bank instruments" actions={
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated"><RefreshCcw className="h-4 w-4" /> Refresh</button>
      } />
      <div className="p-8 space-y-4">
        <p className="max-w-3xl text-sm text-muted-foreground">Instruments issued in your name appear here as soon as operations executes them. Contact your relationship manager to request a new instrument.</p>
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground"><FileText className="mx-auto mb-2 h-6 w-6 opacity-60" /> No instruments yet.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map(r => (
              <div key={r.id} className="rounded-xl border border-gold/30 bg-[image:var(--gradient-card)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{r.reference}</div>
                    <div className="mt-1 font-display text-xl">{r.code}</div>
                    <div className="text-xs text-muted-foreground">In favour of {r.beneficiary}</div>
                  </div>
                  <Pill tone={r.status==="active"?"success":r.status==="pending"?"warning":"muted"}>{r.status}</Pill>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border border-border/60 bg-surface/40 p-2"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Face value</div><div className="font-mono-num">{fmtCents(r.face_value_cents, r.currency)}</div></div>
                  <div className="rounded-md border border-border/60 bg-surface/40 p-2"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Issued</div><div className="font-mono-num">{r.issue_date}</div></div>
                  <div className="rounded-md border border-border/60 bg-surface/40 p-2"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Expires</div><div className="font-mono-num">{r.expiry_date ?? "—"}</div></div>
                </div>
                {r.notes && <div className="mt-3 text-xs text-muted-foreground">{r.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
