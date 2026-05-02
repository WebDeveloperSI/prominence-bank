import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Pill } from "@/components/banking/Stat";
import { ArrowRight, ShieldCheck, Lock, Globe2, Building2, Coins, FileText, Banknote, Wallet, Activity, LogOut, LayoutDashboard, Fingerprint } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth, isMfaVerified } from "@/auth/AuthProvider";
import { toast } from "sonner";

/** Single, role-aware destination for every "enter the bank" CTA on the landing page. */
function useEnterPortal() {
  const navigate = useNavigate();
  const { session, isAdmin } = useAuth();
  const uid = session?.user?.id;
  const authedAndVerified = !!uid && isMfaVerified(uid);
  const target = authedAndVerified
    ? (isAdmin ? "/admin/dashboard" : "/portal/dashboard")
    : "/login";
  const label = authedAndVerified ? "Open dashboard" : "Access banking portal";
  return { go: () => navigate({ to: target }), target, label, authedAndVerified, isAdmin };
}

export const Route = createFileRoute("/")({
  component: Landing,
});

const equity = Array.from({ length: 24 }, (_, i) => ({
  m: i,
  v: 100 + Math.sin(i / 2.5) * 8 + i * 2.4 + Math.random() * 3,
}));

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <Hero />
      <TrustBar />
      <Capabilities />
      <PlatformPreview />
      <Instruments />
      <Stewardship />
      <CTA />
      <Footer />
    </div>
  );
}

function SiteNav() {
  const { authedAndVerified, label, go } = useEnterPortal();
  const { signOut, session } = useAuth();
  async function handleSignOut() {
    await signOut();
    toast.success("Signed out", { description: "Your session has ended securely." });
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#capabilities" className="hover:text-foreground">Private Banking</a>
          <a href="#instruments" className="hover:text-foreground">Instruments</a>
          <a href="#platform" className="hover:text-foreground">Platform</a>
          <a href="#stewardship" className="hover:text-foreground">Stewardship</a>
        </nav>
        <div className="flex items-center gap-2">
          {authedAndVerified && session?.user?.email && (
            <span className="hidden text-xs text-muted-foreground md:inline-flex">
              {session.user.email}
            </span>
          )}
          {authedAndVerified && (
            <button
              onClick={() => void handleSignOut()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/40 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          )}
          <button
            onClick={go}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
          >
            {authedAndVerified ? <LayoutDashboard className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {label}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[600px] max-w-5xl bg-[radial-gradient(ellipse_at_center,oklch(0.45_0.15_250/0.35),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Pill tone="gold">Est. 1924 — Geneva · Singapore · New York</Pill>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] text-foreground md:text-7xl">
              Private banking,<br />
              <span className="bg-gradient-to-r from-[oklch(0.86_0.13_90)] to-[oklch(0.70_0.14_70)] bg-clip-text text-transparent">engineered with discretion.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              A bank-grade digital platform for private wealth, corporate treasury and institutional instruments.
              ISO 27001, SOC 2 Type II and double-entry ledger architecture — by design.
            </p>
            <HeroCtas />
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> SOC 2 · ISO 27001 · PCI-DSS</span>
              <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-gold" /> AES-256 · OTP · Maker-checker</span>
              <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-gold" /> Multi-currency · 142 corridors</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-[oklch(0.45_0.15_250/0.25)] to-transparent blur-2xl" />
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-[var(--shadow-elegant)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Aggregate position</div>
            <div className="mt-2 font-mono-num text-3xl font-semibold">$ 18,442,901.<span className="text-muted-foreground">22</span></div>
            <div className="mt-1 text-xs text-success">▲ 2.41% · trailing 30d</div>
          </div>
          <Pill tone="gold">Tier I · Private</Pill>
        </div>
        <div className="mt-4 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equity} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.82 0.13 86)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="oklch(0.82 0.13 86)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "var(--muted-foreground)" }} />
              <Area type="monotone" dataKey="v" stroke="oklch(0.86 0.13 86)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border/50 rounded-lg border border-border/60 bg-surface/40">
          {[
            { l: "USD Operating", v: "12.84M" },
            { l: "EUR Reserve", v: "3.21M" },
            { l: "BTC Custody", v: "₿ 41.20" },
          ].map(x => (
            <div key={x.l} className="px-3 py-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{x.l}</div>
              <div className="mt-1 font-mono-num text-sm font-semibold">{x.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  const items = ["SWIFT gpi", "ISO 20022", "Fedwire", "SEPA Instant", "SOC 2 Type II", "ISO 27001", "Basel III", "FATF-compliant"];
  return (
    <div className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {items.map(i => <span key={i}>{i}</span>)}
        </div>
      </div>
    </div>
  );
}

function Capabilities() {
  const items = [
    { i: Wallet, t: "Multi-currency accounts", d: "Personal, business, numbered, savings and custody — fiat + digital, in one ledger." },
    { i: Banknote, t: "Internal & wire transfers", d: "Maker-checker workflows, scheduled and recurring orders, SWIFT MT103 manual execution." },
    { i: FileText, t: "Bank instruments", d: "SBLC, BG, SKR, KTT, CD and POF — issued and tracked end-to-end with audit trail." },
    { i: Coins, t: "Crypto custody", d: "Admin-managed wallet addresses, pending vs confirmed balances, on-chain TXID storage." },
    { i: Building2, t: "Loans & credit", d: "Flat or reducing interest, full amortization, automated deductions and penalty handling." },
    { i: Activity, t: "Compliance & risk", d: "KYC tiers, AML flags, velocity limits, immutable append-only audit logs." },
  ];
  return (
    <section id="capabilities" className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Pill>Capabilities</Pill>
          <h2 className="mt-4 font-display text-4xl font-medium md:text-5xl">An institutional core, in one platform.</h2>
        </div>
        <p className="hidden max-w-md text-sm text-muted-foreground md:block">
          Every module described in our master specification — delivered, not deferred. No phases, no missing pieces.
        </p>
      </div>
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ i: Icon, t, d }) => (
          <div key={t} className="bg-card/80 p-7 transition-colors hover:bg-surface-elevated">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-border/60 bg-surface text-gold">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformPreview() {
  return (
    <section id="platform" className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Pill tone="primary">Platform</Pill>
          <h2 className="mt-4 font-display text-4xl font-medium md:text-5xl">Two consoles. One source of truth.</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Clients experience an effortless, secure portal. Operators command a full back-office — approvals,
            instruments, audit, RBAC and impersonation — backed by a deterministic double-entry ledger.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {["OTP-protected sensitive actions", "Maker-checker for every financial change", "Append-only audit logs", "View-as-client impersonation"].map(x => (
              <li key={x} className="flex items-center gap-3 text-foreground/90">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gold/20 text-gold">✓</span>{x}
              </li>
            ))}
          </ul>
          <PlatformCta />
        </div>
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-[oklch(0.45_0.15_250/0.25)] via-transparent to-[oklch(0.82_0.13_86/0.15)] blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-border/70 shadow-[var(--shadow-elegant)]">
            <MockDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  const data = Array.from({ length: 30 }, (_, i) => ({ x: i, a: 60 + Math.sin(i / 3) * 8 + i * 0.6, b: 40 + Math.cos(i / 4) * 6 + i * 0.3 }));
  return (
    <div className="bg-[image:var(--gradient-card)] p-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted-foreground">portal.prominencebank.com / treasury</span>
        </div>
        <Pill tone="success">Live</Pill>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { l: "Available", v: "$12,840,201" },
          { l: "In transit", v: "$381,420" },
          { l: "On hold", v: "$92,000" },
        ].map(s => (
          <div key={s.l} className="rounded-lg border border-border/60 bg-surface/60 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="mt-1 font-mono-num text-base font-semibold">{s.v}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-44 rounded-lg border border-border/60 bg-surface/40 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.68 0.16 245)" stopOpacity={0.55} /><stop offset="100%" stopColor="oklch(0.68 0.16 245)" stopOpacity={0} /></linearGradient>
              <linearGradient id="gb" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.82 0.13 86)" stopOpacity={0.45} /><stop offset="100%" stopColor="oklch(0.82 0.13 86)" stopOpacity={0} /></linearGradient>
            </defs>
            <Area dataKey="a" stroke="oklch(0.78 0.14 245)" strokeWidth={2} fill="url(#ga)" />
            <Area dataKey="b" stroke="oklch(0.82 0.13 86)" strokeWidth={2} fill="url(#gb)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1.5">
        {[
          ["MT103 · ING Bank N.V.", "−$ 240,000.00", "Wire out"],
          ["Inbound · Citibank N.A.", "+$ 1,820,400.00", "Confirmed"],
          ["FX · EURUSD 1.0832", "+€ 412,920.00", "Settled"],
        ].map(([a, b, c]) => (
          <div key={a} className="flex items-center justify-between rounded-md border border-border/40 bg-surface/30 px-3 py-2 text-xs">
            <span className="text-foreground/90">{a}</span>
            <span className="font-mono-num text-foreground">{b}</span>
            <span className="text-muted-foreground">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Instruments() {
  const list = ["Standby Letter of Credit (SBLC)","Bank Guarantee","Key Tested Telex (KTT)","SWIFT MT760","Safe Keeping Receipt (SKR)","Bank Draft","Certificate of Deposit","Block Funds (BF)","Proof of Funds (POF)"];
  return (
    <section id="instruments" className="border-y border-border/60 bg-surface/30">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Pill tone="gold">Bank instruments</Pill>
          <h2 className="mt-4 font-display text-4xl font-medium md:text-5xl">Instruments, issued and stewarded.</h2>
          <p className="mt-4 text-muted-foreground">From SBLCs to SKRs — clients apply online, operators approve, fees post automatically and every step is auditable.</p>
        </div>
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2">
            {list.map((i, idx) => (
              <div key={i} className="flex items-center justify-between bg-card/80 px-5 py-4 hover:bg-surface-elevated">
                <span className="text-sm">{i}</span>
                <span className="font-mono-num text-[10px] uppercase tracking-widest text-muted-foreground">INS-{String(idx + 1).padStart(2,"0")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stewardship() {
  return (
    <section id="stewardship" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-10 md:grid-cols-3">
        {[
          { t: "Discretion", d: "Numbered accounts, masked displays and named relationship managers — every interaction private by default." },
          { t: "Continuity", d: "A century of stewardship. Geneva-rooted governance. Daily backups, defined RPO/RTO and disaster recovery." },
          { t: "Access", d: "Twenty-four-hour concierge banking across web, iOS and Android. One identity, one ledger, three time zones." },
        ].map((b, i) => (
          <div key={b.t} className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-7">
            <div className="font-display text-5xl font-medium text-gold">0{i + 1}</div>
            <h3 className="mt-6 text-lg font-semibold">{b.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[oklch(0.22_0.05_260)] via-[oklch(0.20_0.04_260)] to-[oklch(0.18_0.03_260)] p-10 md:p-14">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-3xl font-medium md:text-4xl">A relationship begins with a conversation.</h3>
            <p className="mt-3 max-w-md text-muted-foreground">Speak with a private banker. We onboard new relationships by introduction and KYC.</p>
          </div>
          <FinalCta />
        </div>
      </div>
    </section>
  );
}

function HeroCtas() {
  const { go, label, authedAndVerified } = useEnterPortal();
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <button
        onClick={go}
        className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
      >
        {authedAndVerified ? <LayoutDashboard className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        {label} <ArrowRight className="h-4 w-4" />
      </button>
      <a
        href="#capabilities"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/40 px-5 py-3 text-sm text-foreground hover:bg-surface"
      >
        Discover the platform
      </a>
      {!authedAndVerified && (
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Fingerprint className="h-3.5 w-3.5 text-gold" /> Multi-factor authentication enforced
        </span>
      )}
    </div>
  );
}

function PlatformCta() {
  const { go, label } = useEnterPortal();
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        onClick={go}
        className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
      >
        {label} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function FinalCta() {
  const { go, label } = useEnterPortal();
  return (
    <div className="flex flex-wrap gap-3 md:justify-end">
      <button
        onClick={go}
        className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-6 py-3 text-sm font-medium text-[oklch(0.18_0.04_80)] shadow-[var(--shadow-gold)]"
      >
        {label} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Prominence Bank, Ltd. — Authorised and regulated. Member, deposit insurance scheme. © 2026.
          </p>
        </div>
        {[
          { h: "Banking", l: ["Private", "Corporate", "Custody", "Crypto"] },
          { h: "Platform", l: ["Client portal", "Operations", "Mobile apps", "API"] },
          { h: "Trust", l: ["Security", "Compliance", "Audit", "Disclosures"] },
        ].map(c => (
          <div key={c.h}>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{c.h}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {c.l.map(x => <li key={x}><a className="text-foreground/85 hover:text-foreground" href="#">{x}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-4 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Geneva · London · Singapore · New York
      </div>
    </footer>
  );
}
