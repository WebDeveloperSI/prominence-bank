import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { adminListAllAccounts, adminListProfiles, adminCreditAccount, adminPlaceHold, adminReleaseHold, type Account } from "@/api/banking";
import { fmtCents } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, Plus, Lock, Unlock, RefreshCcw, Banknote } from "lucide-react";

export const Route = createFileRoute("/admin/deposits")({ component: DepositsPage });

function DepositsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [memos, setMemos] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([adminListAllAccounts(), adminListProfiles()]);
      setAccounts(a);
      setNames(Object.fromEntries(p.map((x: { id: string; full_name: string }) => [x.id, x.full_name])));
    } catch (e) { toast.error("Load failed", { description: (e as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function act(id: string, kind: "credit"|"hold"|"release") {
    const cents = Math.round(parseFloat(amounts[id] || "0") * 100);
    if (!cents || cents <= 0) { toast.error("Enter a valid amount"); return; }
    setBusyId(id);
    try {
      const memo = memos[id] || `Admin ${kind}`;
      if (kind === "credit") await adminCreditAccount(id, cents, memo);
      if (kind === "hold") await adminPlaceHold(id, cents, memo);
      if (kind === "release") await adminReleaseHold(id, cents, memo);
      toast.success(`${kind} posted`);
      setAmounts({ ...amounts, [id]: "" });
      await load();
    } catch (e) { toast.error("Failed", { description: (e as Error).message }); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <PageHead eyebrow="Treasury" title="Deposits & holds" actions={
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      } />
      <div className="p-8 space-y-4">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Credit any client account, place compliance holds, or release them. Every action posts a ledger entry and an immutable audit log.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading accounts…</div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">No accounts in the system yet.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {accounts.map(a => (
              <div key={a.id} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{names[a.owner_id] ?? "Client"} · {a.nickname}</div>
                    <div className="font-mono-num text-xs text-muted-foreground">{a.account_number}</div>
                  </div>
                  <Pill tone={a.status === "active" ? "success" : "warning"}>{a.status}</Pill>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border/60 bg-surface/40 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Available</div>
                    <div className="font-mono-num text-lg font-semibold">{fmtCents(a.available_cents, a.currency)}</div>
                  </div>
                  <div className="rounded-md border border-border/60 bg-surface/40 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">On hold</div>
                    <div className="font-mono-num text-lg font-semibold">{fmtCents(a.held_cents, a.currency)}</div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input value={amounts[a.id] ?? ""} onChange={e => setAmounts({ ...amounts, [a.id]: e.target.value })}
                    placeholder="Amount" inputMode="decimal"
                    className="rounded-md border border-border bg-input px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input value={memos[a.id] ?? ""} onChange={e => setMemos({ ...memos, [a.id]: e.target.value })}
                    placeholder="Memo (optional)"
                    className="rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="mt-3 flex gap-2">
                  <button disabled={busyId===a.id} onClick={() => act(a.id, "credit")}
                    className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-success-foreground disabled:opacity-50">
                    {busyId===a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Credit
                  </button>
                  <button disabled={busyId===a.id} onClick={() => act(a.id, "hold")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning disabled:opacity-50">
                    <Lock className="h-3.5 w-3.5" /> Place hold
                  </button>
                  <button disabled={busyId===a.id} onClick={() => act(a.id, "release")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-elevated disabled:opacity-50">
                    <Unlock className="h-3.5 w-3.5" /> Release hold
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-xl border border-gold/30 bg-[image:var(--gradient-card)] p-4 text-xs text-muted-foreground">
          <Banknote className="mr-2 inline h-4 w-4 text-gold" />
          Credits create a settled deposit transaction visible to the client immediately. Holds reduce available balance without removing funds.
        </div>
      </div>
    </>
  );
}
