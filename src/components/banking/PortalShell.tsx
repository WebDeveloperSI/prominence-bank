import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Bell, Search, Settings, Shield, ChevronDown, LogOut, UserCog, KeyRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function PortalShell({ nav, badge, footer }: { nav: { to: string; label: string; icon: ReactNode }[]; badge: string; footer?: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [fullName, setFullName] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) { setFullName(""); return; }
    supabase.from("profiles").select("full_name,tier").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setFullName(data.full_name); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const display = fullName || user?.email?.split("@")[0] || "Client";
  const initials = display.split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join("") || "PB";

  async function handleLogout() {
    try {
      await signOut();
      toast.success("Signed out", { description: "Your session has ended securely." });
      navigate({ to: "/login", search: { role: isAdmin ? "admin" : "client" } });
    } catch (e) {
      toast.error("Logout failed", { description: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-[260px_1fr] bg-background">
      <aside className="sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="px-3 pt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{badge}</div>
        <nav className="mt-2 flex-1 space-y-0.5 px-2">
          {nav.map(n => {
            const active = loc.pathname === n.to || (n.to !== "/portal" && n.to !== "/admin" && loc.pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent text-foreground shadow-[inset_2px_0_0_var(--gold)]" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}>
                <span className={cn("text-muted-foreground", active && "text-gold")}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        {footer}
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface/50 px-3 py-1.5">
              <Search className="h-4 w-4" />
              <input placeholder="Search accounts, transactions, beneficiaries…" className="w-80 bg-transparent text-sm focus:outline-none" />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <span className="hidden items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold md:inline-flex">
                <KeyRound className="h-3 w-3" /> ADMIN · RBAC active
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary md:inline-flex">
                <Shield className="h-3 w-3" /> CLIENT · Role verified
              </span>
            )}
            <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success lg:inline-flex">
              <Shield className="h-3 w-3" /> Secure session · MFA ✓
            </span>
            <button className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface/40 text-muted-foreground hover:text-foreground"><Bell className="h-4 w-4" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface/40 text-muted-foreground hover:text-foreground"><Settings className="h-4 w-4" /></button>
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-2 flex items-center gap-2 rounded-md border border-border bg-surface/40 px-2 py-1.5 outline-none hover:bg-surface-elevated">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.86_0.13_90)] to-[oklch(0.62_0.15_60)] text-[11px] font-semibold text-[oklch(0.18_0.04_80)]">{initials}</div>
                <div className="hidden text-left text-xs leading-tight md:block">
                  <div className="font-medium text-foreground">{display}</div>
                  <div className="text-muted-foreground">{isAdmin ? "Operations · Admin" : "Tier I · Private"}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{display}</span>
                  <span className="truncate text-[11px] font-normal text-muted-foreground">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isAdmin && (
                  <DropdownMenuItem onSelect={() => navigate({ to: "/portal/settings" })}>
                    <UserCog className="mr-2 h-4 w-4" /> Profile & security
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onSelect={() => navigate({ to: "/admin/rbac" })}>
                    <KeyRound className="mr-2 h-4 w-4" /> Roles & access
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1"><Outlet /></div>
      </main>
    </div>
  );
}

export function PageHead({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 bg-surface/30 px-8 py-6">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>}
        <h1 className="mt-1 font-display text-3xl font-medium md:text-[34px]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}
