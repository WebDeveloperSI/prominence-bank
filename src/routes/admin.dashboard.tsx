import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { StatCard, Pill } from "@/components/banking/Stat";
import { Users, ShieldCheck, AlertTriangle, Activity, Eye, ChevronRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Bar, BarChart } from "recharts";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

const vol = Array.from({ length: 24 }, (_, i) => ({ h: `${i}:00`, v: 200 + Math.sin(i / 2) * 80 + Math.random() * 60 }));
const types = [
  { k: "Wires", v: 412 }, { k: "Internal", v: 1240 }, { k: "FX", v: 184 }, { k: "Crypto", v: 92 }, { k: "Fees", v: 612 },
];
const queue = [
  { id: "WIRE-29841", who: "A. Harrington", k: "Wire OUT", to: "ING Bank N.V.", amt: 240000, risk: "Medium", maker: "ops-mira", t: "warning" },
  { id: "INS-04413", who: "Aurora Capital", k: "MT760 issuance", to: "BNP Paribas", amt: 8_500_000, risk: "High", maker: "ops-jens", t: "danger" },
  { id: "LN-1051",  who: "Helvetia Maison",k: "Loan disburse", to: "Own account", amt: 1_200_000, risk: "Low", maker: "ops-leo", t: "success" },
  { id: "WIRE-29836", who: "Sterling & Crowe", k: "Wire OUT", to: "BNP Paribas", amt: 640000, risk: "Medium", maker: "ops-mira", t: "warning" },
];
const flags = [
  { c: "Pacific Bullion Pte", r: "Velocity threshold", s: "Open" },
  { c: "Aurora Capital LLC",  r: "Sanctions list match (low)", s: "Reviewing" },
  { c: "Trade Partners B.V.", r: "Beneficiary new · 14d", s: "Cleared" },
];

function AdminDashboard() {
  return (
    <>
      <PageHead eyebrow="Operations · Live" title="Back office command" actions={
        <>
          <Pill tone="success"><ShieldCheck className="h-3 w-3" /> All systems operational</Pill>
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:bg-surface-elevated"><Eye className="h-4 w-4" /> View as client</button>
        </>
      } />
      <div className="space-y-6 p-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Customers" value="12,482" sub={<span className="text-success">+184 this month</span>} icon={<Users className="h-4 w-4" />} accent="primary" />
          <StatCard label="Pending approvals" value="38" sub="Maker-checker queue" icon={<ShieldCheck className="h-4 w-4" />} accent="gold" />
          <StatCard label="AML flags · open" value="7" sub={<span className="text-warning">2 high risk</span>} icon={<AlertTriangle className="h-4 w-4" />} />
          <StatCard label="Today’s volume" value={fmtMoney(218_402_500)} sub="2,540 transactions" icon={<Activity className="h-4 w-4" />} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Throughput · last 24h</div>
              <Pill tone="primary">Live</Pill>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <AreaChart data={vol}>
                  <defs><linearGradient id="ad1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.78 0.14 245)" stopOpacity={0.55} /><stop offset="100%" stopColor="oklch(0.78 0.14 245)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="h" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Area dataKey="v" stroke="oklch(0.82 0.14 245)" strokeWidth={2.2} fill="url(#ad1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Mix by type · today</div>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <BarChart data={types}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="k" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="v" fill="oklch(0.82 0.13 86)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h3 className="text-sm font-semibold">Maker-checker queue</h3>
              <span className="text-xs text-muted-foreground">{queue.length} awaiting</span>
            </div>
            <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <div className="col-span-2">Reference</div><div className="col-span-3">Customer</div><div className="col-span-2">Action</div><div className="col-span-2 text-right">Amount</div><div className="col-span-2">Risk</div><div className="col-span-1 text-right">—</div>
            </div>
            <div className="divide-y divide-border/60">
              {queue.map(q => (
                <div key={q.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 text-sm hover:bg-surface/40">
                  <div className="col-span-2 font-mono-num text-xs">{q.id}</div>
                  <div className="col-span-3">{q.who}<div className="text-[11px] text-muted-foreground">maker · {q.maker}</div></div>
                  <div className="col-span-2"><div>{q.k}</div><div className="text-[11px] text-muted-foreground">to {q.to}</div></div>
                  <div className="col-span-2 text-right font-mono-num font-semibold">{fmtMoney(q.amt)}</div>
                  <div className="col-span-2"><Pill tone={q.t as "warning" | "danger" | "success"}>{q.risk}</Pill></div>
                  <div className="col-span-1 text-right"><button className="rounded-md border border-border bg-surface p-1.5 hover:bg-surface-elevated"><ChevronRight className="h-4 w-4" /></button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-5 py-4 text-sm font-semibold">AML flags</div>
            <div className="divide-y divide-border/60">
              {flags.map(f => (
                <div key={f.c} className="px-5 py-3.5 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{f.c}</div>
                    <Pill tone={f.s === "Cleared" ? "success" : f.s === "Reviewing" ? "primary" : "warning"}>{f.s}</Pill>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{f.r}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
