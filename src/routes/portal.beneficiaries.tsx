import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { Plus, Search, MoreHorizontal, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { addBeneficiary, deleteBeneficiary, listBeneficiaries, type Beneficiary } from "@/api/banking";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/beneficiaries")({
  component: BeneficiariesPage,
});

function BeneficiariesPage() {
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try { setRows(await listBeneficiaries()); }
    catch (e) { toast.error("Couldn't load beneficiaries", { description: e instanceof Error ? e.message : String(e) }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = rows.filter(b => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [b.name, b.bank_name, b.iban, b.swift, b.country].some(v => v?.toLowerCase().includes(s));
  });

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Remove ${name}?`)) return;
    try { await deleteBeneficiary(id); toast.success("Beneficiary removed"); await load(); }
    catch (e) { toast.error("Could not remove", { description: e instanceof Error ? e.message : String(e) }); }
  }

  return (
    <>
      <PageHead eyebrow="Counterparties" title="Beneficiaries" actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-3.5 py-2 text-sm font-medium text-[oklch(0.18_0.04_80)] shadow-[var(--shadow-gold)]">
          <Plus className="h-4 w-4" /> Add beneficiary
        </button>
      } />
      <div className="space-y-4 p-8">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/30 p-3">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search beneficiaries by name, bank, IBAN…" className="w-full bg-transparent text-sm focus:outline-none" />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} of {rows.length}</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading beneficiaries…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No beneficiaries yet. Add one to start sending wires." : "No matches."}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(b => (
              <div key={b.id} className="group rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md border border-border/60 bg-surface text-xs font-semibold text-gold">
                      {b.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{b.bank_name} · {b.country}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onDelete(b.id, b.name)} className="text-muted-foreground hover:text-destructive" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border/40 bg-surface/40 p-3 text-xs">
                  <div><div className="text-muted-foreground">IBAN</div><div className="font-mono-num truncate">{b.iban}</div></div>
                  <div><div className="text-muted-foreground">SWIFT</div><div className="font-mono-num">{b.swift}</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Pill tone="success">Verified</Pill>
                  <Link to="/portal/transfers" className="text-xs text-primary hover:underline">Send wire →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && <AddBeneficiaryDialog onClose={() => setOpen(false)} onSaved={async () => { setOpen(false); await load(); }} />}
    </>
  );
}

function AddBeneficiaryDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [country, setCountry] = useState("NL");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !bank || !iban || !swift) { toast.error("Fill in all fields"); return; }
    setBusy(true);
    try {
      await addBeneficiary({ name, bank_name: bank, iban: iban.replace(/\s+/g, ""), swift, country });
      toast.success("Beneficiary added", { description: `${name} is ready for wires.` });
      onSaved();
    } catch (e) {
      toast.error("Could not add beneficiary", { description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add beneficiary</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Stored against your account with row-level security. Visible only to you and authorised operations staff.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Beneficiary name" value={name} onChange={setName} placeholder="Trade Partners B.V." />
          <Field label="Bank" value={bank} onChange={setBank} placeholder="ING Bank N.V." />
          <div className="md:col-span-2"><Field label="IBAN / Account number" value={iban} onChange={setIban} placeholder="NL91 ABNA 0417 1643 00" mono /></div>
          <Field label="SWIFT / BIC" value={swift} onChange={setSwift} placeholder="INGBNL2A" mono />
          <Field label="Country (ISO)" value={country} onChange={(v) => setCountry(v.toUpperCase().slice(0, 2))} placeholder="NL" />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-elevated">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-4 py-2 text-sm font-medium text-[oklch(0.18_0.04_80)] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save beneficiary
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${mono ? "font-mono-num" : ""}`} />
    </label>
  );
}
