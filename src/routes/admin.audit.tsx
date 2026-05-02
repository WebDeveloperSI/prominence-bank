import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listAuditLog, type AuditEntry } from "@/api/banking";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({ component: AuditPage });

function AuditPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await listAuditLog(200)); }
    catch (e) { toast.error("Load failed", { description: (e as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  return (
    <>
      <PageHead eyebrow="Compliance" title="Audit log" actions={
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated"><RefreshCcw className="h-4 w-4" /> Refresh</button>
      } />
      <div className="p-8">
        <p className="mb-5 max-w-3xl text-sm text-muted-foreground">Append-only, immutable record of every system action — searchable, exportable, regulator-ready.</p>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-surface/40 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="col-span-3">Timestamp</div><div className="col-span-2">Role</div><div className="col-span-3">Action</div><div className="col-span-2">Entity</div><div className="col-span-2">Target</div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No audit entries yet.</div>
          ) : (
            <div className="divide-y divide-border/60 max-h-[70vh] overflow-auto">
              {rows.map(r => (
                <div key={r.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3 text-sm">
                  <div className="col-span-3 font-mono-num text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  <div className="col-span-2"><Pill tone={r.actor_role==="admin"?"gold":"primary"}>{r.actor_role ?? "system"}</Pill></div>
                  <div className="col-span-3 font-mono-num text-xs">{r.action}</div>
                  <div className="col-span-2 text-muted-foreground">{r.entity}</div>
                  <div className="col-span-2 font-mono-num text-[11px] truncate text-muted-foreground">{r.entity_id ?? "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
