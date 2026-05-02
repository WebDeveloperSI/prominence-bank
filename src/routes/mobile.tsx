import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Pill } from "@/components/banking/Stat";
import { Home, ArrowLeftRight, Wallet, User, Fingerprint, Bell, ArrowUpRight, ArrowDownRight, Plus, Send, ScanLine, Coins } from "lucide-react";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/mobile")({ component: MobilePage });

function MobilePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/"><Logo /></Link>
          <Link to="/portal" className="text-sm text-muted-foreground hover:text-foreground">Back to platform →</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <Pill tone="gold">iOS · Android</Pill>
          <h1 className="mt-4 font-display text-4xl font-medium md:text-5xl">Banking, in your pocket.</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Face ID and OTP-secured. Same ledger, same instruments — designed for one-hand precision.</p>
        </div>

        <div className="mt-14 grid items-start gap-10 md:grid-cols-3">
          <Phone title="Sign in"><LoginScreen /></Phone>
          <Phone title="Dashboard"><DashScreen /></Phone>
          <Phone title="Transfer"><TransferScreen /></Phone>
        </div>
      </section>
    </div>
  );
}

function Phone({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-[oklch(0.45_0.15_250/0.25)] to-transparent blur-2xl" />
        <div className="relative h-[640px] w-[310px] rounded-[44px] border-[10px] border-[oklch(0.10_0.02_260)] bg-black shadow-[0_30px_80px_-20px_oklch(0.05_0_0/0.8)]">
          <div className="absolute left-1/2 top-2 h-6 w-28 -translate-x-1/2 rounded-full bg-[oklch(0.10_0.02_260)]" />
          <div className="h-full w-full overflow-hidden rounded-[34px] bg-background">
            <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-foreground/80">
              <span>9:41</span>
              <span>•••• 5G</span>
            </div>
            <div className="h-[calc(100%-1.5rem)] overflow-hidden">{children}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="flex h-full flex-col px-5 pt-6">
      <Logo />
      <div className="mt-10">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Welcome back</div>
        <div className="mt-2 font-display text-2xl">Alexander</div>
      </div>
      <div className="mt-8 grid place-items-center">
        <div className="grid h-32 w-32 place-items-center rounded-full border border-gold/40 bg-[image:var(--gradient-card)] shadow-[var(--shadow-gold)]">
          <Fingerprint className="h-14 w-14 text-gold" />
        </div>
        <div className="mt-5 text-sm text-muted-foreground">Touch to authenticate</div>
        <div className="mt-1 text-[11px] text-muted-foreground/80">or use 6-digit passcode</div>
      </div>
      <div className="mt-auto pb-6 text-center text-[11px] text-muted-foreground">
        <Pill tone="success">Secured · TLS 1.3</Pill>
      </div>
    </div>
  );
}

function DashScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Total</div>
            <div className="mt-1 font-mono-num text-2xl font-semibold">{fmtMoney(18_442_901.22)}</div>
            <div className="text-xs text-success">▲ 2.41% · 30d</div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/40"><Bell className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { i: <Send className="h-4 w-4" />, l: "Send" },
            { i: <ArrowDownRight className="h-4 w-4" />, l: "Receive" },
            { i: <ScanLine className="h-4 w-4" />, l: "Scan" },
            { i: <Coins className="h-4 w-4" />, l: "Crypto" },
          ].map(a => (
            <div key={a.l} className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-surface/40 py-2.5 text-[10px]">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.86_0.13_90)] to-[oklch(0.62_0.15_60)] text-[oklch(0.18_0.04_80)]">{a.i}</span>
              {a.l}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {[
            { n: "USD Operating", b: "$ 12,840,201", s: "Checking" },
            { n: "EUR Reserve",  b: "€ 3,214,882",  s: "Savings" },
            { n: "BTC Custody",  b: "₿ 41.2018",    s: "Crypto" },
          ].map(a => (
            <div key={a.n} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <div>
                <div className="text-xs font-medium">{a.n}</div>
                <div className="text-[10px] text-muted-foreground">{a.s}</div>
              </div>
              <div className="font-mono-num text-sm font-semibold">{a.b}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Recent</div>
        <div className="mt-1 space-y-1">
          {[
            ["ING wire OUT","−$240,000","danger"],
            ["Citibank inbound","+$1.82M","success"],
            ["FX EUR/USD","+€412,920","success"],
          ].map(([a,b,t],i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-border/40 bg-surface/30 px-2.5 py-1.5 text-[11px]">
              <span className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full ${t==="success"?"bg-success/15 text-success":"bg-destructive/15 text-destructive"}`}>{t==="success"?<ArrowDownRight className="h-3 w-3"/>:<ArrowUpRight className="h-3 w-3"/>}</span>{a}</span>
              <span className="font-mono-num">{b}</span>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="home" />
    </div>
  );
}

function TransferScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">New transfer</div>
        <div className="mt-1 font-display text-xl">Send to ING</div>
        <div className="mt-5 rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-4 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Amount</div>
          <div className="mt-1 font-mono-num text-3xl font-semibold">$ 240,000<span className="text-muted-foreground">.00</span></div>
          <div className="mt-1 text-[11px] text-muted-foreground">From USD Operating</div>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          {[
            ["Beneficiary","Trade Partners B.V."],
            ["IBAN","NL91 ABNA 0417 1643 00"],
            ["SWIFT","INGBNL2A"],
            ["Reference","Invoice 2026-0488"],
          ].map(([l,v]) => (
            <div key={l} className="flex justify-between rounded-md border border-border/40 bg-surface/30 px-2.5 py-2">
              <span className="text-muted-foreground">{l}</span><span className="font-mono-num text-foreground">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md border border-gold/30 bg-[oklch(0.82_0.13_86/0.06)] p-2.5 text-[11px] text-foreground">
          <span className="font-semibold text-gold">OTP required</span> — code sent to a.h••••••
        </div>
        <button className="mt-3 w-full rounded-xl bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] py-3 text-sm font-semibold text-[oklch(0.18_0.04_80)] shadow-[var(--shadow-gold)]">Confirm & send</button>
      </div>
      <TabBar active="transfer" />
    </div>
  );
}

function TabBar({ active }: { active: string }) {
  const items = [
    { k: "home", i: <Home className="h-4 w-4" />, l: "Home" },
    { k: "transfer", i: <ArrowLeftRight className="h-4 w-4" />, l: "Move" },
    { k: "card", i: <Plus className="h-5 w-5" />, l: "" },
    { k: "wallet", i: <Wallet className="h-4 w-4" />, l: "Wallet" },
    { k: "me", i: <User className="h-4 w-4" />, l: "Me" },
  ];
  return (
    <div className="mt-auto border-t border-border/60 bg-surface/60 px-5 pb-3 pt-2 backdrop-blur">
      <div className="flex items-center justify-between">
        {items.map(it => it.k === "card" ? (
          <button key={it.k} className="-mt-7 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.86_0.13_90)] to-[oklch(0.62_0.15_60)] text-[oklch(0.18_0.04_80)] shadow-[var(--shadow-gold)]">{it.i}</button>
        ) : (
          <div key={it.k} className={`flex flex-col items-center gap-0.5 text-[10px] ${active === it.k ? "text-gold" : "text-muted-foreground"}`}>{it.i}{it.l}</div>
        ))}
      </div>
    </div>
  );
}
