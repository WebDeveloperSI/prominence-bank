import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listPendingApprovals, approveTransfer, rejectTransfer, type Transaction } from "@/api/banking";
import { fmtCents } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/approvals")({ component: ApprovalsPage });

function ApprovalsPage() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setRows(await listPendingApprovals()); }
    catch (e) { toast.error("Failed to load queue", { description: e instanceof Error ? e.message : String(e) }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function onApprove(id: string, ref: string) {
    setBusyId(id);
    try {
      await approveTransfer(id);
      toast.success(`${ref} approved`, { description: "Funds released and ledger posted." });
      await load();
    } catch (e) {
      toast.error("Approval failed", { description: e instanceof Error ? e.message : String(e) });
    } finally { setBusyId(null); }
  }

  async function onReject(id: string, ref: string) {
    const reason = window.prompt(`Reject ${ref} — reason (compliance log):`, "Insufficient documentation");
    if (!reason) return;
    setBusyId(id);
    try {
      await rejectTransfer(id, reason);
      toast.success(`${ref} rejected`, { description: "Hold released back to client." });
      await load();
    } catch (e) {
      toast.error("Rejection failed", { description: e instanceof Error ? e.message : String(e) });
    } finally { setBusyId(null); }
  }

  return (
    <>
      <PageHead eyebrow="Maker-checker" title="Approvals queue" actions={
        <>
          <Pill tone="primary"><ShieldCheck className="h-3 w-3" /> Dual-control enforced</Pill>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </>
      } />
      <div className="p-8">
        <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
          Every financial change is dual-controlled. Review, approve or reject — actions are immutably logged to the audit trail.
        </p>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="col-span-2">Reference</div>
            <div className="col-span-2">Kind</div>
            <div className="col-span-3">Memo</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Queue is clear. No pending approvals.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map((t) => {
                const isBusy = busyId === t.id;
                const awaitingOtp = t.status === "awaiting_otp";
                return (
                  <div key={t.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 text-sm hover:bg-surface/40">
                    <div className="col-span-2 font-mono-num text-xs">{t.reference}</div>
                    <div className="col-span-2 capitalize">{t.kind.replace(/_/g, " ")}</div>
                    <div className="col-span-3 text-muted-foreground">{t.memo ?? "—"}</div>
                    <div className="col-span-2 text-right font-mono-num font-semibold">{fmtCents(t.amount_cents, t.currency)}</div>
                    <div className="col-span-1">
                      <Pill tone={awaitingOtp ? "primary" : "warning"}>{awaitingOtp ? "OTP" : "Pending"}</Pill>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onReject(t.id, t.reference)}
                        disabled={isBusy || awaitingOtp}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => onApprove(t.id, t.reference)}
                        disabled={isBusy || awaitingOtp}
                        className="inline-flex items-center gap-1.5 rounded-md bg-success px-2.5 py-1.5 text-xs font-medium text-success-foreground hover:opacity-90 disabled:opacity-40"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
