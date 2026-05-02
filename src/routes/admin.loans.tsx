import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listAllLoans, adminDecideLoan, adminDisburseLoan, adminListProfiles, type LoanApplication } from "@/api/banking";
import { fmtCents } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, RefreshCcw, Banknote } from "lucide-react";

export const Route = createFileRoute("/admin/loans")({ component: LoansAdminPage });

function LoansAdminPage() {
  const [rows, setRows] = useState<LoanApplication[]>([]);
  const [names, setNames] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([listAllLoans(), adminListProfiles()]);
      setRows(l);
      setNames(Object.fromEntries(p.map((x: { id: string; full_name: string }) => [x.id, x.full_name])));
    } catch (e) { toast.error("Load failed", { description: (e as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function decide(id: string, ok: boolean) {
    const notes = ok ? undefined : window.prompt("Reason for rejection", "Insufficient documentation") ?? undefined;
    if (!ok && !notes) return;
    setBusy(id);
    try { await adminDecideLoan(id, ok, notes); toast.success(ok ? "Loan approved" : "Loan rejected"); await load(); }
    catch (e) { toast.error("Failed", { description: (e as Error).message }); }
    finally { setBusy(null); }
  }
  async function disburse(id: string) {
    setBusy(id);
    try { await adminDisburseLoan(id); toast.success("Loan disbursed", { description: "Funds credited to client account." }); await load(); }
    catch (e) { toast.error("Failed", { description: (e as Error).message }); }
    finally { setBusy(null); }
  }

  return (
    <>
      <PageHead eyebrow="Credit" title="Loan portfolio" actions={
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      } />
      <div className="p-8 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">No loan applications yet. Clients can submit one from the portal.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <div className="col-span-3">Applicant</div><div className="col-span-3">Purpose</div><div className="col-span-2 text-right">Amount</div><div className="col-span-1">Term</div><div className="col-span-1">Status</div><div className="col-span-2 text-right">Action</div>
            </div>
            <div className="divide-y divide-border/60">
              {rows.map(l => (
                <div key={l.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 text-sm">
                  <div className="col-span-3">{names[l.applicant_id] ?? "Client"}<div className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div></div>
                  <div className="col-span-3 text-muted-foreground">{l.purpose}</div>
                  <div className="col-span-2 text-right font-mono-num font-semibold">{fmtCents(l.amount_cents)}</div>
                  <div className="col-span-1 font-mono-num text-xs">{l.term_months}m</div>
                  <div className="col-span-1"><Pill tone={l.status==="approved"?"success":l.status==="rejected"?"danger":l.status==="disbursed"?"primary":"warning"}>{l.status}</Pill></div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {l.status === "pending" && (
                      <>
                        <button disabled={busy===l.id} onClick={() => decide(l.id,false)} className="rounded-md border border-border bg-surface p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40"><XCircle className="h-4 w-4" /></button>
                        <button disabled={busy===l.id} onClick={() => decide(l.id,true)} className="rounded-md bg-success p-1.5 text-success-foreground disabled:opacity-40">{busy===l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}</button>
                      </>
                    )}
                    {l.status === "approved" && (
                      <button disabled={busy===l.id} onClick={() => disburse(l.id)} className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-3 py-1.5 text-xs font-medium text-[oklch(0.18_0.04_80)]">
                        {busy===l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />} Disburse
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
