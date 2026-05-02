import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { ShieldCheck, Smartphone, Key, Mail, Fingerprint, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/portal/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <>
      <PageHead eyebrow="Account" title="Profile & security" />
      <div className="grid gap-6 p-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h3 className="text-sm font-semibold">Personal details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                ["Full name", "Alexander J. Harrington"],
                ["Email", "a.harrington@example.com"],
                ["Phone", "+44 20 7946 ••••"],
                ["Residency", "United Kingdom"],
                ["Tax ID", "GB-•••• 8821"],
                ["Tier", "Tier I — Private (Enhanced KYC)"],
              ].map(([l, v]) => (
                <div key={l}><div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{l}</div><div className="mt-1 rounded-md border border-border bg-input px-3 py-2.5 text-sm">{v}</div></div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Security</h3>
              <Pill tone="success"><ShieldCheck className="h-3 w-3" /> All clear</Pill>
            </div>
            <div className="mt-4 divide-y divide-border/60">
              {[
                { i: <Key className="h-4 w-4" />, t: "Password", d: "Last changed 42 days ago", a: "Update" },
                { i: <Mail className="h-4 w-4" />, t: "Email OTP", d: "Required for sensitive actions", a: "Manage" },
                { i: <Smartphone className="h-4 w-4" />, t: "Trusted devices", d: "2 active sessions", a: "Review" },
                { i: <Fingerprint className="h-4 w-4" />, t: "Biometric (mobile)", d: "Face ID enabled", a: "Disable" },
              ].map(r => (
                <div key={r.t} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-gold">{r.i}</span><div><div className="text-sm font-medium">{r.t}</div><div className="text-xs text-muted-foreground">{r.d}</div></div></div>
                  <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-elevated">{r.a}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-warning/30 bg-[oklch(0.80_0.16_70/0.06)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-warning"><AlertTriangle className="h-4 w-4" /> Sensitive actions</div>
            <p className="mt-2 text-xs text-muted-foreground">Closing accounts, rotating credentials and disabling MFA require OTP and a 24-hour cooling period.</p>
            <button className="mt-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs">Begin secure rotation</button>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5 text-xs">
            <div className="text-sm font-semibold text-foreground">Recent sign-in activity</div>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex justify-between"><span>London, GB · Safari</span><span>Today 09:14</span></li>
              <li className="flex justify-between"><span>Geneva, CH · iOS</span><span>2d ago</span></li>
              <li className="flex justify-between"><span>Singapore · Chrome</span><span>5d ago</span></li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
