import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listInstruments, adminIssueInstrument, adminListProfiles, type BankInstrument } from "@/api/banking";
import { fmtCents } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCcw, X } from "lucide-react";

export const Route = createFileRoute("/admin/instruments")({ component: InstrumentsAdminPage });

const CODES = ["SBLC","BG","MT760","POF","SKR","CD","BF","KTT"];

function InstrumentsAdminPage() {
  const [rows, setRows] = useState<BankInstrument[]>([]);
  const [names, setNames] = useState<Record<string,string>>({});
  const [profiles, setProfiles] = useState<{id:string;full_name:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [i, p] = await Promise.all([listInstruments(), adminListProfiles()]);
      setRows(i);
      setProfiles(p as {id:string;full_name:string}[]);
      setNames(Object.fromEntries(p.map((x: { id: string; full_name: string }) => [x.id, x.full_name])));
    } catch (e) { toast.error("Load failed", { description: (e as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  return (
    <>
      <PageHead eyebrow="Trade & finance" title="Instruments management" actions={
        <>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated"><RefreshCcw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-3.5 py-2 text-sm font-medium text-[oklch(0.18_0.04_80)] shadow-[var(--shadow-gold)]">
            <Plus className="h-4 w-4" /> Issue instrument
          </button>
        </>
      } />
      <div className="p-8 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">No instruments issued yet. Issue one — it will appear in the client's portal immediately.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <div className="col-span-2">Reference</div><div className="col-span-1">Type</div><div className="col-span-3">Holder</div><div className="col-span-3">Beneficiary</div><div className="col-span-2 text-right">Face value</div><div className="col-span-1">Status</div>
            </div>
            <div className="divide-y divide-border/60">
              {rows.map(r => (
                <div key={r.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 text-sm">
                  <div className="col-span-2 font-mono-num text-xs">{r.reference}</div>
                  <div className="col-span-1"><Pill tone="gold">{r.code}</Pill></div>
                  <div className="col-span-3">{names[r.owner_id] ?? "Client"}</div>
                  <div className="col-span-3 text-muted-foreground">{r.beneficiary}</div>
                  <div className="col-span-2 text-right font-mono-num font-semibold">{fmtCents(r.face_value_cents, r.currency)}</div>
                  <div className="col-span-1"><Pill tone={r.status==="active"?"success":r.status==="pending"?"warning":"muted"}>{r.status}</Pill></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {open && <IssueDialog profiles={profiles} onClose={() => setOpen(false)} onSaved={async () => { setOpen(false); await load(); }} />}
    </>
  );
}

function IssueDialog({ profiles, onClose, onSaved }: { profiles: {id:string;full_name:string}[]; onClose: () => void; onSaved: () => void }) {
  const [owner, setOwner] = useState(profiles[0]?.id ?? "");
  const [code, setCode] = useState("SBLC");
  const [beneficiary, setBeneficiary] = useState("Trade Partners B.V.");
  const [faceValue, setFaceValue] = useState("5000000");
  const [currency, setCurrency] = useState("USD");
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!owner) { toast.error("Pick a holder"); return; }
    setBusy(true);
    try {
      await adminIssueInstrument({
        ownerId: owner, code, beneficiary,
        faceValueCents: Math.round(parseFloat(faceValue || "0") * 100),
        currency, expiry: expiry || null, notes: notes || null,
      });
      toast.success("Instrument issued");
      onSaved();
    } catch (e) { toast.error("Failed", { description: (e as Error).message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Issue banking instrument</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Holder</span>
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm">
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Type</span>
            <select value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm">
              {CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Currency</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0,3))} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm" />
          </label>
          <label className="block md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Beneficiary</span>
            <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm" />
          </label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Face value</span>
            <input value={faceValue} onChange={(e) => setFaceValue(e.target.value)} inputMode="decimal" className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm font-mono-num" />
          </label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Expiry (optional)</span>
            <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm" />
          </label>
          <label className="block md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-4 py-2 text-sm font-medium text-[oklch(0.18_0.04_80)] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Issue
          </button>
        </div>
      </form>
    </div>
  );
}
