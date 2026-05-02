import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/banking/PortalShell";
import { Pill } from "@/components/banking/Stat";
import { listTickets, listTicketMessages, submitSupportTicket, postSupportMessage, type SupportTicket, type SupportMessage } from "@/api/banking";
import { toast } from "sonner";
import { Loader2, Plus, Send, X, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/portal/support")({ component: SupportPage });

function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeId, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const t = await listTickets(); setTickets(t);
      if (!activeId && t[0]) { setActive(t[0].id); setMsgs(await listTicketMessages(t[0].id)); }
      else if (activeId) setMsgs(await listTicketMessages(activeId));
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

  const active = tickets.find(t => t.id === activeId);

  return (
    <>
      <PageHead eyebrow="Concierge" title="Support & tickets" actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-3.5 py-2 text-sm font-medium text-[oklch(0.18_0.04_80)] shadow-[var(--shadow-gold)]">
          <Plus className="h-4 w-4" /> New ticket
        </button>
      } />
      <div className="grid gap-4 p-8 lg:grid-cols-12">
        <div className="lg:col-span-4 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="border-b border-border/60 px-4 py-3 text-sm font-semibold">My tickets</div>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No tickets. Open one to talk to your relationship manager.</div>
          ) : (
            <div className="divide-y divide-border/60 max-h-[60vh] overflow-auto">
              {tickets.map(t => (
                <button key={t.id} onClick={() => pick(t.id)} className={`block w-full text-left px-4 py-3 hover:bg-surface/40 ${activeId===t.id?"bg-surface/60":""}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{t.subject}</div>
                    <Pill tone={t.status==="resolved"||t.status==="closed"?"success":t.status==="awaiting_client"?"primary":"warning"}>{t.status}</Pill>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{t.reference}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-8 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          {!active ? (
            <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground"><MessageSquare className="mr-2 inline h-4 w-4" /> Pick a ticket.</div>
          ) : (
            <>
              <div className="border-b border-border/60 px-5 py-3">
                <div className="text-sm font-semibold">{active.subject}</div>
                <div className="text-[11px] text-muted-foreground">{active.reference} · {active.status}</div>
              </div>
              <div className="flex-1 max-h-[55vh] overflow-auto p-5 space-y-3">
                {msgs.map(m => (
                  <div key={m.id} className={`max-w-[80%] rounded-lg border px-3 py-2 text-sm ${m.author_role==="client"?"ml-auto border-primary/40 bg-primary/5":"border-border/60 bg-surface/40"}`}>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.author_role} · {new Date(m.created_at).toLocaleString()}</div>
                    <div className="mt-1 whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-border/60 p-3">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button disabled={busy || !reply.trim()} onClick={send} className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {open && <NewTicketDialog onClose={() => setOpen(false)} onSaved={async () => { setOpen(false); await load(); }} />}
    </>
  );
}

function NewTicketDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { toast.error("Fill in subject and message"); return; }
    setBusy(true);
    try { await submitSupportTicket({ subject, body }); toast.success("Ticket opened"); onSaved(); }
    catch (e) { toast.error("Failed", { description: (e as Error).message }); }
    finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Open a ticket</h2>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm" />
          </label>
          <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border bg-surface px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.86_0.13_90)] to-[oklch(0.66_0.14_70)] px-4 py-2 text-sm font-medium text-[oklch(0.18_0.04_80)] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Open ticket
          </button>
        </div>
      </form>
    </div>
  );
}
