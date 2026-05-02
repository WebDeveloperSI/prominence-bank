import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { ArrowRight, Building2, Globe2, ShieldCheck, Repeat, Loader2, CheckCircle2 } from "lucide-react";
import { fmtCents } from "@/lib/format";
import { useEffect, useMemo, useState } from "react";
import {
  listAccounts, listBeneficiaries, listTransactions,
  submitTransfer, issueOtp, confirmTransferOtp, cancelTransfer,
  type Account, type Beneficiary, type Transaction,
} from "@/api/banking";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/transfers")({
  component: TransfersPage,
});

type Tab = "internal" | "wire";
type Step = 1 | 2 | 3 | 4;

function TransfersPage() {
  const [tab, setTab] = useState<Tab>("wire");
  const [step, setStep] = useState<Step>(1);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromId, setFromId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [beneficiaryId, setBeneficiaryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("240000.00");
  const [memo, setMemo] = useState<string>("Invoice 2026-0488 · trade settlement");

  const [submitting, setSubmitting] = useState(false);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpRevealed, setOtpRevealed] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");
  const [pendingTxn, setPendingTxn] = useState<Transaction | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [a, b, t] = await Promise.all([listAccounts(), listBeneficiaries(), listTransactions()]);
      setAccounts(a); setBeneficiaries(b); setRecent(t);
      if (!fromId && a[0]) setFromId(a[0].id);
      if (!toAccountId && a[1]) setToAccountId(a[1].id);
      if (!beneficiaryId && b[0]) setBeneficiaryId(b[0].id);
    } catch (e) {
      toast.error("Couldn't load accounts", { description: e instanceof Error ? e.message : String(e) });
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const fromAccount = useMemo(() => accounts.find(a => a.id === fromId), [accounts, fromId]);

  function reset() {
    setStep(1); setOtpId(null); setOtpRevealed(null); setOtpCode(""); setPendingTxn(null);
  }

  async function onSubmitTransfer() {
    if (!fromAccount) { toast.error("Pick a source account"); return; }
    const cents = Math.round(parseFloat(amount || "0") * 100);
    if (!cents || cents <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    try {
      const txn = await submitTransfer({
        fromAccountId: fromAccount.id,
        kind: tab === "internal" ? "internal_transfer" : "external_wire",
        amountCents: cents,
        toAccountId: tab === "internal" ? toAccountId : null,
        beneficiaryId: tab === "wire" ? beneficiaryId : null,
        memo: memo || null,
      });
      setPendingTxn(txn);
      toast.success(`Wire ${txn.reference} created`, { description: "Funds placed on hold. Verify with OTP to submit for approval." });
      const otp = await issueOtp("transfer", txn.id);
      setOtpId(otp.id);
      setOtpRevealed(otp.code); // demo-only reveal
      setStep(3);
      await refresh();
    } catch (e) {
      toast.error("Transfer failed", { description: e instanceof Error ? e.message : String(e) });
    } finally { setSubmitting(false); }
  }

  async function onConfirmOtp() {
    if (!pendingTxn || !otpId) return;
    if (otpCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setSubmitting(true);
    try {
      const txn = await confirmTransferOtp(pendingTxn.id, otpId, otpCode);
      setPendingTxn(txn);
      toast.success("OTP verified", { description: `${txn.reference} forwarded to maker-checker.` });
      setStep(4);
      await refresh();
    } catch (e) {
      toast.error("OTP rejected", { description: e instanceof Error ? e.message : String(e) });
    } finally { setSubmitting(false); }
  }

  return (
    <>
      <PageHead eyebrow="Move funds" title="Transfers & wires" />
      <div className="grid gap-6 p-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex items-center gap-1 border-b border-border/60 p-2">
              {[
                { id: "internal" as const, label: "Internal", icon: <Repeat className="h-4 w-4" /> },
                { id: "wire" as const, label: "External wire", icon: <Globe2 className="h-4 w-4" /> },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); reset(); }}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm transition-colors ${tab === t.id ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              <Stepper step={step} />

              {step === 1 && (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <SelectField label="From account" value={fromId} onChange={setFromId}
                    options={accounts.map(a => ({ value: a.id, label: `${a.nickname} · ${a.account_number} · ${fmtCents(a.available_cents, a.currency)}` }))}
                    placeholder={loading ? "Loading…" : "Select account"} />
                  <Field label="Currency" value={fromAccount?.currency ?? "—"} readOnly />

                  {tab === "wire" ? (
                    <SelectField label="Beneficiary" value={beneficiaryId} onChange={setBeneficiaryId}
                      options={beneficiaries.map(b => ({ value: b.id, label: `${b.name} — ${b.bank_name}` }))}
                      placeholder={beneficiaries.length === 0 ? "Add a beneficiary first" : "Select beneficiary"} />
                  ) : (
                    <SelectField label="To account" value={toAccountId} onChange={setToAccountId}
                      options={accounts.filter(a => a.id !== fromId).map(a => ({ value: a.id, label: `${a.nickname} · ${a.account_number}` }))}
                      placeholder="Select destination" />
                  )}

                  <Field label="Amount" value={amount} onChange={setAmount} big inputMode="decimal" />
                  <div className="md:col-span-2">
                    <Field label="Memo / reference" value={memo} onChange={setMemo} />
                  </div>

                  <div className="md:col-span-2 rounded-lg border border-border/60 bg-surface/40 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-gold" /> OTP confirmation required</div>
                    <p className="mt-1 text-xs text-muted-foreground">A 6-digit code will be issued upon submission. Codes are single-use and expire in 10 minutes.</p>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={loading || !fromAccount || (tab === "wire" ? !beneficiaryId : !toAccountId)}
                      className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50">
                      Continue to review <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && fromAccount && (
                <div className="mt-6 space-y-4">
                  <Review label="From" value={`${fromAccount.nickname} · ${fromAccount.account_number}`} />
                  {tab === "wire"
                    ? <Review label="Beneficiary" value={beneficiaries.find(b => b.id === beneficiaryId)?.name ?? "—"} />
                    : <Review label="To" value={accounts.find(a => a.id === toAccountId)?.nickname ?? "—"} />}
                  <Review label="Amount" value={fmtCents(Math.round(parseFloat(amount||"0")*100), fromAccount.currency)} big />
                  <Review label="Memo" value={memo || "—"} />
                  <div className="flex items-center justify-between pt-2">
                    <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Edit</button>
                    <button onClick={onSubmitTransfer} disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Submit & request OTP
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && pendingTxn && (
                <div className="mt-6 space-y-5">
                  <div>
                    <div className="text-sm text-muted-foreground">Enter the 6-digit OTP issued for <span className="font-mono-num text-foreground">{pendingTxn.reference}</span>.</div>
                    {otpRevealed && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs text-gold">
                        Demo OTP: <span className="font-mono-num text-base font-semibold tracking-[0.3em]">{otpRevealed}</span>
                      </div>
                    )}
                  </div>
                  <input
                    autoFocus inputMode="numeric" maxLength={6} value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-md border border-border bg-input px-4 py-3 text-center font-mono-num text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="• • • • • •"
                  />
                  <div className="flex items-center justify-between">
                    <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                    <button onClick={onConfirmOtp} disabled={submitting || otpCode.length !== 6}
                      className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Confirm & submit for approval
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && pendingTxn && (
                <div className="mt-6 rounded-lg border border-success/30 bg-success/5 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                  <h3 className="mt-3 text-lg font-semibold">{pendingTxn.reference} submitted</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Your wire is now in the maker-checker queue. You'll be notified when ops approves it.</p>
                  <button onClick={reset} className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm hover:bg-surface-elevated">
                    Start a new transfer
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h3 className="text-sm font-semibold">Recent transfers</h3>
              <Pill tone="primary">{recent.filter(r => r.status !== "settled" && r.status !== "rejected").length} in flight</Pill>
            </div>
            <div className="divide-y divide-border/60">
              {recent.length === 0 && <div className="p-6 text-sm text-muted-foreground">No transfers yet.</div>}
              {recent.slice(0, 8).map((w) => (
                <div key={w.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 text-sm">
                  <div className="col-span-3 font-mono-num text-xs text-muted-foreground">{w.reference}</div>
                  <div className="col-span-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {w.kind.replace(/_/g, " ")}</div>
                  <div className="col-span-2"><StatusPill status={w.status} /></div>
                  <div className="col-span-2 text-right font-mono-num font-semibold">{fmtCents(w.amount_cents, w.currency)}</div>
                  <div className="col-span-2 text-right">
                    {(w.status === "awaiting_otp" || w.status === "awaiting_approval") && (
                      <button
                        onClick={async () => {
                          try {
                            await cancelTransfer(w.id);
                            toast.success(`${w.reference} cancelled`, { description: "Held funds released." });
                            await refresh();
                          } catch (e) {
                            toast.error("Couldn't cancel", { description: e instanceof Error ? e.message : String(e) });
                          }
                        }}
                        className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs hover:bg-surface-elevated"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Selected account</div>
            {fromAccount ? (
              <>
                <div className="mt-3 font-mono-num text-2xl font-semibold">{fmtCents(fromAccount.available_cents, fromAccount.currency)}</div>
                <div className="text-xs text-muted-foreground">Available · {fromAccount.account_number}</div>
                <div className="mt-3 text-xs text-muted-foreground">On hold</div>
                <div className="font-mono-num text-base">{fmtCents(fromAccount.held_cents, fromAccount.currency)}</div>
              </>
            ) : <div className="mt-3 text-sm text-muted-foreground">No account selected.</div>}
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5 text-sm">
            <div className="font-semibold">Limits</div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li className="flex justify-between"><span>Per transaction</span><span className="font-mono-num text-foreground">{fmtCents(250_000_000)}</span></li>
              <li className="flex justify-between"><span>Daily cumulative</span><span className="font-mono-num text-foreground">{fmtCents(500_000_000)}</span></li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = ["Details", "Review", "OTP", "Submitted"];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${i + 1 === step ? "bg-gold text-gold-foreground" : i + 1 < step ? "bg-success text-success-foreground" : "border border-border bg-surface text-muted-foreground"}`}>{i + 1}</div>
          <span className={`text-xs ${i + 1 === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
          {i < steps.length - 1 && <span className="h-px w-10 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, big, readOnly, inputMode }: {
  label: string; value: string; onChange?: (v: string) => void;
  big?: boolean; readOnly?: boolean; inputMode?: "decimal" | "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input
        value={value} readOnly={readOnly} inputMode={inputMode}
        onChange={(e) => onChange?.(e.target.value)}
        className={`mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 ${big ? "font-mono-num text-lg font-semibold" : "text-sm"} ${readOnly ? "opacity-70" : ""}`}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
        {!value && <option value="">{placeholder ?? "Select…"}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Review({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className={big ? "font-mono-num text-xl font-semibold" : "text-sm"}>{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: Transaction["status"] }) {
  const map: Record<Transaction["status"], "warning" | "primary" | "success" | "danger" | "muted"> = {
    draft: "muted", awaiting_otp: "warning", awaiting_approval: "primary",
    approved: "primary", settled: "success", rejected: "danger", failed: "danger", cancelled: "muted",
  };
  return <Pill tone={map[status]}>{status.replace(/_/g, " ")}</Pill>;
}
