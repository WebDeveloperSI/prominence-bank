import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { StatCard, Pill } from "@/components/banking/Stat";
import { Wallet, Lock, Plane, ArrowDownRight, ArrowUpRight, MoreHorizontal, Sparkles, Shield } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/portal/dashboard")({
  component: Dashboard,
});

const equity = Array.from({ length: 30 }, (_, i) => ({
  d: `D${i + 1}`,
  v: 12_400_000 + Math.sin(i / 3) * 220_000 + i * 48_000 + Math.random() * 60_000,
}));
const flows = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], inflow: 800 + Math.random() * 600, outflow: 500 + Math.random() * 500 }));

const accounts = [
  { name: "USD Operating", num: "1100-04827-001", ccy: "USD", bal: 12_840_201.22, kind: "Checking" },
  { name: "EUR Reserve",  num: "2200-04827-002", ccy: "EUR", bal:  3_214_882.10, kind: "Savings" },
  { name: "Numbered · Geneva", num: "9970-•••• ", ccy: "CHF", bal: 2_140_320.55, kind: "Numbered" },
  { name: "BTC Custody", num: "BC1Q-•••• 8F2A", ccy: "BTC", bal: 41.2018, kind: "Crypto" },
];

const txns = [
  { d: "Today · 14:22", desc: "MT103 · ING Bank N.V.", ref: "Wire OUT · ref WIRE-29841", amt: -240000, ccy: "USD", st: "Pending approval" },
  { d: "Today · 11:08", desc: "Inbound wire · Citibank N.A.", ref: "Confirmed · F2B-90213", amt: 1820400, ccy: "USD", st: "Confirmed" },
  { d: "Yesterday",     desc: "FX · EURUSD 1.0832",      ref: "Settled · spot",            amt: 412920, ccy: "EUR", st: "Settled" },
  { d: "Yesterday",     desc: "SBLC fee · INS-04412",     ref: "Auto-posted",              amt: -7500,  ccy: "USD", st: "Posted" },
  { d: "2 days ago",    desc: "Internal · to Numbered CHF", ref: "Own accounts",            amt: -120000, ccy: "USD", st: "Settled" },
];

function Dashboard() {
  return (
    <>
      <PageHead
        eyebrow="Tier I · Private client · A. Harrington"
        title="Good evening, Alexander."
        actions={
          <>
            <Link to="/portal/transfers" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:bg-surface-elevated"><ArrowUpRight className="h-4 w-4" /> New transfer</Link>
            <Link to="/portal/instruments" className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-3.5 py-2 text-sm font-medium text-[oklch(0.18_0.04_80)] shadow-[var(--shadow-gold)]"><Sparkles className="h-4 w-4" /> Apply for instrument</Link>
          </>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Aggregate position" value={fmtMoney(18_442_901.22)} sub={<span className="text-success">▲ 2.41% · 30d</span>} accent="gold" icon={<Wallet className="h-4 w-4" />} />
          <StatCard label="Available" value={fmtMoney(15_890_201.22)} sub="Across 4 accounts" accent="primary" />
          <StatCard label="In transit" value={fmtMoney(381_420)} sub="3 wires settling" icon={<Plane className="h-4 w-4" />} />
          <StatCard label="On hold" value={fmtMoney(92_000)} sub={<span className="text-warning">2 AML reviews</span>} icon={<Lock className="h-4 w-4" />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Total equity · USD</div>
                <div className="mt-1 font-mono-num text-2xl font-semibold">{fmtMoney(18_442_901.22)}</div>
              </div>
              <div className="flex gap-1 rounded-md border border-border/60 bg-surface/40 p-0.5 text-xs">
                {["1W","1M","3M","YTD","1Y","ALL"].map((p, i) => (
                  <button key={p} className={`rounded px-2.5 py-1 ${i === 1 ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equity} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.14 245)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="oklch(0.78 0.14 245)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1_000_000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="oklch(0.82 0.14 245)" strokeWidth={2.2} fill="url(#eg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Cash flow · trailing 12m</div>
              <Pill tone="success">+$3.42M net</Pill>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flows} barCategoryGap="22%">
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="inflow" fill="oklch(0.74 0.15 158)" radius={[3,3,0,0]} />
                  <Bar dataKey="outflow" fill="oklch(0.65 0.15 25 / 0.85)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h3 className="text-sm font-semibold">Accounts</h3>
              <Link to="/portal/transactions" className="text-xs text-primary hover:underline">View all transactions</Link>
            </div>
            <div className="divide-y divide-border/60">
              {accounts.map(a => (
                <div key={a.num} className="flex items-center justify-between px-5 py-4 hover:bg-surface/40">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-md border border-border/60 bg-surface text-xs font-mono-num text-gold">{a.ccy}</div>
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.kind} · {a.num}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-num text-base font-semibold">{a.ccy === "BTC" ? `₿ ${a.bal.toFixed(4)}` : fmtMoney(a.bal, a.ccy)}</div>
                    <div className="text-[11px] text-muted-foreground">Available</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h3 className="text-sm font-semibold">Compliance</h3>
              <Pill tone="success"><Shield className="h-3 w-3" /> Cleared</Pill>
            </div>
            <div className="space-y-3 p-5 text-sm">
              {[
                { l: "KYC tier", v: "Tier I (Enhanced)", t: "success" as const },
                { l: "AML status", v: "No flags · last review 12d", t: "success" as const },
                { l: "Daily transfer limit", v: fmtMoney(5_000_000), t: "muted" as const },
                { l: "Per-transaction limit", v: fmtMoney(2_500_000), t: "muted" as const },
              ].map(r => (
                <div key={r.l} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className="font-mono-num text-foreground">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
          <div className="divide-y divide-border/60">
            {txns.map((t, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 text-sm hover:bg-surface/40">
                <div className="col-span-2 text-xs text-muted-foreground">{t.d}</div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-full ${t.amt < 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                    {t.amt < 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium">{t.desc}</div>
                    <div className="text-xs text-muted-foreground">{t.ref}</div>
                  </div>
                </div>
                <div className="col-span-3"><Pill tone={t.st === "Confirmed" || t.st === "Settled" || t.st === "Posted" ? "success" : "warning"}>{t.st}</Pill></div>
                <div className={`col-span-2 text-right font-mono-num font-semibold ${t.amt < 0 ? "text-foreground" : "text-success"}`}>
                  {t.amt < 0 ? "−" : "+"}{fmtMoney(Math.abs(t.amt), t.ccy)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
