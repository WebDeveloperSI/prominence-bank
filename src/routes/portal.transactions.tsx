import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { Download, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/portal/transactions")({
  component: TransactionsPage,
});

const rows = [
  ["2026-04-30", "MT103 · ING Bank N.V.", "Wire OUT · WIRE-29841", "USD Operating", -240000, "USD", "Pending"],
  ["2026-04-30", "Inbound · Citibank N.A.", "F2B-90213", "USD Operating", 1820400, "USD", "Confirmed"],
  ["2026-04-29", "FX EUR/USD 1.0832", "Spot settlement", "EUR Reserve", 412920, "EUR", "Settled"],
  ["2026-04-29", "SBLC fee · INS-04412", "Auto-posted", "USD Operating", -7500, "USD", "Posted"],
  ["2026-04-28", "Internal · to Numbered CHF", "Own accounts", "USD Operating", -120000, "USD", "Settled"],
  ["2026-04-27", "BTC inbound · TXID 0x9af…12c", "2 confirmations", "BTC Custody", 1.2042, "BTC", "Confirmed"],
  ["2026-04-26", "Custody annual fee", "Auto-posted", "Numbered · Geneva", -1200, "CHF", "Posted"],
  ["2026-04-26", "Loan disbursement · LN-1042", "Credit", "USD Operating", 750000, "USD", "Settled"],
  ["2026-04-25", "Standing order · Salary", "Recurring", "USD Operating", -85000, "USD", "Settled"],
  ["2026-04-24", "Wire OUT · BNP Paribas", "WIRE-29812", "EUR Reserve", -640000, "EUR", "Settled"],
  ["2026-04-23", "Hold released · review cleared", "AML cleared", "USD Operating", 92000, "USD", "Released"],
  ["2026-04-22", "POF issuance fee · INS-04401", "Auto-posted", "USD Operating", -2500, "USD", "Posted"],
] as const;

function TransactionsPage() {
  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Transactions"
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:bg-surface-elevated"><Filter className="h-4 w-4" /> Filters</button>
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:bg-surface-elevated"><Download className="h-4 w-4" /> Export PDF · CSV</button>
          </>
        }
      />
      <div className="space-y-4 p-8">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface/30 p-3">
          {["All accounts", "USD Operating", "EUR Reserve", "Numbered · Geneva", "BTC Custody"].map((c, i) => (
            <button key={c} className={`rounded-md border px-3 py-1.5 text-xs ${i === 0 ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{c}</button>
          ))}
          <span className="mx-2 h-5 w-px bg-border" />
          {["7d","30d","90d","YTD","Custom"].map((c, i) => (
            <button key={c} className={`rounded-md border px-3 py-1.5 text-xs ${i === 1 ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{c}</button>
          ))}
          <span className="mx-2 h-5 w-px bg-border" />
          {["Inflows","Outflows","Pending","Held"].map(c => (
            <button key={c} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">{c}</button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="grid grid-cols-12 gap-4 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Account</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          <div className="divide-y divide-border/60">
            {rows.map((r, i) => {
              const [d, desc, ref, acct, amt, ccy, st] = r;
              const isOut = (amt as number) < 0;
              const tone = st === "Confirmed" || st === "Settled" || st === "Posted" || st === "Released" ? "success" : st === "Pending" ? "warning" : "muted";
              return (
                <div key={i} className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 text-sm hover:bg-surface/40">
                  <div className="col-span-2 font-mono-num text-xs text-muted-foreground">{d}</div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`grid h-7 w-7 place-items-center rounded-full ${isOut ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                      {isOut ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <div className="font-medium">{desc}</div>
                      <div className="text-[11px] text-muted-foreground">{ref}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">{acct}</div>
                  <div className="col-span-2"><Pill tone={tone as "success" | "warning" | "muted"}>{st}</Pill></div>
                  <div className="col-span-2 text-right font-mono-num font-semibold">
                    {isOut ? "−" : "+"}{ccy === "BTC" ? `₿ ${Math.abs(amt as number).toFixed(4)}` : fmtMoney(Math.abs(amt as number), ccy as string)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-border/60 bg-surface/30 px-5 py-3 text-xs text-muted-foreground">
            <span>Showing 12 of 1,284 transactions</span>
            <div className="flex gap-2">
              <button className="rounded-md border border-border bg-card px-2.5 py-1">Previous</button>
              <button className="rounded-md border border-border bg-card px-2.5 py-1">Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
