import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listAccounts, listMyLoans, submitLoanApplication, type Account, type LoanApplication } from "@/api/banking";
import { fmtCents } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Loader2, X, Banknote } from "lucide-react";

export const Route = createFileRoute("/portal/loans")({ component: LoansPage });

function LoansPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try { const [a, l] = await Promise.all([listAccounts(), listMyLoans()]); setAccounts(a); setLoans(l); }
    catch (e) { toast.error("Load failed", { description: (e as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  return (
    <>
      <PageHead eyebrow="Credit" title="Loans & credit" actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]">
          <Plus className="h-4 w-4" /> New loan request
        </button>
      } />
      <div className="p-8 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : loans.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">No loan applications yet. Submit one — operations will review it.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <div className="col-span-4">Purpose</div><div className="col-span-2 text-right">Amount</div><div className="col-span-1">Term</div><div className="col-span-2">Rate</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Notes</div>
            </div>
            <div className="divide-y divide-border/60">
              {loans.map(l => (
                <div key={l.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 text-sm">
                  <div className="col-span-4"><div className="font-medium">{l.purpose}</div><div className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div></div>
                  <div className="col-span-2 text-right font-mono-num font-semibold">{fmtCents(l.amount_cents)}</div>
                  <div className="col-span-1 font-mono-num text-xs">{l.term_months}m</div>
                  <div className="col-span-2 font-mono-num text-xs">{l.interest_rate}%</div>
                  <div className="col-span-2"><Pill tone={l.status==="approved"?"success":l.status==="rejected"?"danger":l.status==="disbursed"?"primary":"warning"}>{l.status}</Pill></div>
                  <div className="col-span-1 text-right text-[11px] text-muted-foreground truncate">{l.notes ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl border border-gold/30 bg-[image:var(--gradient-card)] p-4 text-xs text-muted-foreground">
          <Banknote className="mr-2 inline h-4 w-4 text-gold" /> Approved loans are disbursed by operations and credited to your selected account immediately.
        </div>
      </div>
      {open && <ApplyDialog accounts={accounts} onClose={() => setOpen(false)} onSaved={async () => { setOpen(false); await load(); }} />}
    </>
  );
}

function ApplyDialog({ accounts, onClose, onSaved }: { accounts: Account[]; onClose: () => void; onSaved: () => void }) {
  const [account, setAccount] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("250000");
  const [term, setTerm] = useState("36");
  const [purpose, setPurpose] = useState("Working capital");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await submitLoanApplication({
        accountId: account, amountCents: Math.round(parseFloat(amount || "0") * 100),
        termMonths: parseInt(term || "0", 10), purpose,
      });
      toast.success("Loan application submitted", { description: "Operations will review and decide." });
      onSaved();
    } catch (e) { toast.error("Failed", { description: (e as Error).message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Apply for a loan</h2>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Disburse to account</span>
            <select value={account} onChange={(e) => setAccount(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname} · {a.account_number}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Amount</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm font-mono-num" />
          </label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Term (months)</span>
            <input value={term} onChange={(e) => setTerm(e.target.value)} inputMode="numeric" className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm font-mono-num" />
          </label>
          <label className="block md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Purpose</span>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Submit
          </button>
        </div>
      </form>
    </div>
  );
}
