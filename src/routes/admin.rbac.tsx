import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2, RefreshCcw, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/rbac")({ component: RbacPage });

type Row = { user_id: string; role: string; full_name: string | null; created_at: string };

function RbacPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set((roles ?? []).map(r => r.user_id)));
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        names = Object.fromEntries((profs ?? []).map(p => [p.id, p.full_name]));
      }
      setRows((roles ?? []).map(r => ({ ...r, full_name: names[r.user_id] ?? null })));
    } catch (e) {
      toast.error("Couldn't load roles", { description: e instanceof Error ? e.message : String(e) });
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const counts = rows.reduce<Record<string, number>>((acc, r) => { acc[r.role] = (acc[r.role] ?? 0) + 1; return acc; }, {});
  const matrix: { role: string; scope: string; checker: "Required" | "Optional" | "N/A"; tone: "gold" | "primary" | "muted" }[] = [
    { role: "admin",    scope: "All modules",                checker: "Required", tone: "gold" },
    { role: "operator", scope: "Transfers, instruments",     checker: "Required", tone: "gold" },
    { role: "auditor",  scope: "All modules · view only",    checker: "N/A",      tone: "muted" },
    { role: "client",   scope: "Own accounts & transfers",   checker: "Optional", tone: "primary" },
  ];

  return (
    <>
      <PageHead eyebrow="Access control" title="Roles & permissions" actions={
        <>
          <Pill tone="primary"><ShieldCheck className="h-3 w-3" /> RLS-backed</Pill>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </>
      } />
      <div className="space-y-6 p-8">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Roles are stored in <span className="font-mono-num text-foreground">public.user_roles</span> and enforced server-side by Row-Level Security
          plus the <span className="font-mono-num text-foreground">has_role()</span> security-definer function. Front-end role detection is purely a UI hint — the database is the source of truth.
        </p>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-5 py-3 text-sm font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4 text-gold" /> Role matrix</div>
          <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="col-span-3">Role</div><div className="col-span-2">Members</div><div className="col-span-5">Scope</div><div className="col-span-2">Maker-checker</div>
          </div>
          {matrix.map(m => (
            <div key={m.role} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 text-sm">
              <div className="col-span-3 capitalize font-medium">{m.role}</div>
              <div className="col-span-2 font-mono-num">{counts[m.role] ?? 0}</div>
              <div className="col-span-5 text-muted-foreground">{m.scope}</div>
              <div className="col-span-2"><Pill tone={m.tone}>{m.checker}</Pill></div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-5 py-3 text-sm font-semibold">Role assignments · live from database</div>
          {loading ? (
            <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No role assignments visible.</div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <div className="col-span-5">User</div><div className="col-span-3">Role</div><div className="col-span-4">User ID</div>
              </div>
              <div className="divide-y divide-border/60">
                {rows.map((r, i) => (
                  <div key={`${r.user_id}-${r.role}-${i}`} className="grid grid-cols-12 items-center gap-3 px-5 py-3 text-sm">
                    <div className="col-span-5">{r.full_name ?? "—"}</div>
                    <div className="col-span-3"><Pill tone={r.role === "admin" ? "gold" : "primary"}>{r.role}</Pill></div>
                    <div className="col-span-4 font-mono-num text-xs text-muted-foreground truncate">{r.user_id}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
