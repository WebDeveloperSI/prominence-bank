import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listTickets, listTicketMessages, postSupportMessage, adminUpdateTicketStatus, adminListProfiles, type SupportTicket, type SupportMessage, type TicketStatus } from "@/api/banking";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Send, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin/support")({ component: SupportAdminPage });

function SupportAdminPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [names, setNames] = useState<Record<string,string>>({});
  const [activeId, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([listTickets(), adminListProfiles()]);
      setTickets(t); setNames(Object.fromEntries(p.map((x: { id: string; full_name: string }) => [x.id, x.full_name])));
      if (!activeId && t[0]) { setActive(t[0].id); setMsgs(await listTicketMessages(t[0].id)); }
    } catch (e) { toast.error("Load failed", { description: (e as Error).message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function pick(id: string) { setActive(id); setMsgs(await listTicketMessages(id)); }
  async function send() {
    if (!activeId || !reply.trim()) return;
    setBusy(true);
    try { await postSupportMessage(activeId, reply.trim()); setReply(""); setMsgs(await listTicketMessages(activeId)); await load(); }
    catch (e) { toast.error("Send failed", { description: (e as Error).message }); }
    finally { setBusy(false); }
  }
  async function changeStatus(s: TicketStatus) {
    if (!activeId) return;
    try { await adminUpdateTicketStatus(activeId, s); toast.success(`Status: ${s}`); await load(); }
    catch (e) { toast.error("Failed", { description: (e as Error).message }); }
  }

  const active = tickets.find(t => t.id === activeId);

  return (
    <>
      <PageHead eyebrow="Concierge" title="Support inbox" actions={
        <button onClick={load} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      } />
      <div className="grid gap-4 p-8 lg:grid-cols-12">
        <div className="lg:col-span-4 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="border-b border-border/60 px-4 py-3 text-sm font-semibold">Tickets ({tickets.length})</div>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No tickets yet.</div>
          ) : (
            <div className="divide-y divide-border/60 max-h-[60vh] overflow-auto">
              {tickets.map(t => (
                <button key={t.id} onClick={() => pick(t.id)} className={`block w-full text-left px-4 py-3 hover:bg-surface/40 ${activeId===t.id?"bg-surface/60":""}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{t.subject}</div>
                    <Pill tone={t.status==="resolved"||t.status==="closed"?"success":t.status==="awaiting_client"?"primary":"warning"}>{t.status}</Pill>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{names[t.owner_id] ?? "Client"} · {t.reference}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-8 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          {!active ? (
            <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground"><MessageSquare className="mr-2 inline h-4 w-4" /> Pick a ticket to view the conversation.</div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
                <div>
                  <div className="text-sm font-semibold">{active.subject}</div>
                  <div className="text-[11px] text-muted-foreground">{active.reference} · {names[active.owner_id]}</div>
                </div>
                <select value={active.status} onChange={(e) => changeStatus(e.target.value as TicketStatus)} className="rounded-md border border-border bg-input px-2 py-1 text-xs">
                  {(["open","in_progress","awaiting_client","resolved","closed"] as TicketStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1 max-h-[55vh] overflow-auto p-5 space-y-3">
                {msgs.map(m => (
                  <div key={m.id} className={`max-w-[80%] rounded-lg border px-3 py-2 text-sm ${m.author_role==="admin"?"ml-auto border-primary/40 bg-primary/5":"border-border/60 bg-surface/40"}`}>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.author_role} · {new Date(m.created_at).toLocaleString()}</div>
                    <div className="mt-1 whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-border/60 p-3">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button disabled={busy || !reply.trim()} onClick={send} className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
