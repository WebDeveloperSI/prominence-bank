import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { Copy, ArrowDownToLine, ArrowUpFromLine, ShieldCheck } from "lucide-react";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/portal/crypto")({
  component: CryptoPage,
});

const assets = [
  { s: "BTC", n: "Bitcoin", b: 41.2018, usd: 2_896_540, ch: "+1.84%", up: true, addr: "bc1q9ahf28as7s8d2v3lz0e8xj42lpgkfzu0fk2y" },
  { s: "ETH", n: "Ether",   b: 482.221, usd: 1_452_120, ch: "−0.62%", up: false, addr: "0xA1B2C3D4E5F6789012345678901234567890abCD" },
  { s: "USDC",n: "USD Coin",b: 850_000, usd:   850_000, ch: "+0.00%", up: true,  addr: "0xUSDC1234567890abcdef1234567890abcdef00" },
];

function CryptoPage() {
  return (
    <>
      <PageHead eyebrow="Digital assets" title="Crypto custody" actions={
        <>
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:bg-surface-elevated"><ArrowDownToLine className="h-4 w-4" /> Receive</button>
          <button className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)]"><ArrowUpFromLine className="h-4 w-4" /> Withdraw</button>
        </>
      } />

      <div className="grid gap-6 p-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {assets.map(a => (
            <div key={a.s} className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.86_0.13_90)] to-[oklch(0.62_0.15_60)] font-mono-num text-xs font-semibold text-[oklch(0.18_0.04_80)]">{a.s}</div>
                  <div>
                    <div className="text-base font-semibold">{a.n}</div>
                    <div className="text-xs text-muted-foreground">Confirmed · Custody-held</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-num text-lg font-semibold">{a.s === "USDC" ? a.b.toLocaleString() : a.b.toFixed(4)} <span className="text-xs text-muted-foreground">{a.s}</span></div>
                  <div className="text-xs"><span className="text-muted-foreground">{fmtMoney(a.usd)}</span> · <span className={a.up ? "text-success" : "text-destructive"}>{a.ch}</span></div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border/40 bg-surface/40 p-3">
                <div className="text-xs">
                  <div className="text-muted-foreground">Deposit address ({a.s} · mainnet)</div>
                  <div className="font-mono-num mt-0.5 break-all text-foreground">{a.addr}</div>
                </div>
                <button className="ml-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px]"><Copy className="h-3.5 w-3.5" /> Copy</button>
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-gold/30 bg-[image:var(--gradient-card)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-gold" /> Custody assurance</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">All client digital assets are held in segregated, multi-signature cold storage. On-chain TXIDs are recorded for every withdrawal and reconciled daily.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-border/60 bg-surface/40 p-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Insurance</div>
                <div className="mt-0.5 font-mono-num">$ 250M</div>
              </div>
              <div className="rounded-md border border-border/60 bg-surface/40 p-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cold/Hot</div>
                <div className="mt-0.5 font-mono-num">98% / 2%</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="text-sm font-semibold">Recent on-chain activity</div>
            <ul className="mt-3 space-y-3 text-xs">
              {[
                ["+1.2042 BTC", "Inbound · 2 confirmations", "TXID 0x9af…12c", "success"],
                ["−4.5000 ETH", "Withdrawal executed",       "TXID 0x21b…998", "success"],
                ["+50,000 USDC","Inbound · pending",         "0 confirmations", "warning"],
              ].map(([a, b, c, t], i) => (
                <li key={i} className="flex items-center justify-between border-b border-border/40 pb-2.5 last:border-0">
                  <div>
                    <div className="font-mono-num">{a}</div>
                    <div className="text-[11px] text-muted-foreground">{b} · {c}</div>
                  </div>
                  <Pill tone={t as "success" | "warning"}>{t === "success" ? "Confirmed" : "Pending"}</Pill>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
