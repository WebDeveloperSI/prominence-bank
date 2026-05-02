import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHead } from "@/components/banking/PortalShell";
import { Eye, ShieldCheck } from "lucide-react";
export const Route = createFileRoute("/admin/impersonate")({ component: () => (
  <>
    <PageHead eyebrow="Support" title="View as client" />
    <div className="p-8">
      <div className="rounded-xl border border-gold/30 bg-[image:var(--gradient-card)] p-6 shadow-[var(--shadow-gold)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-gold"><ShieldCheck className="h-4 w-4" /> View-only impersonation</div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Open any client portal in read-only mode. Every impersonation session is OTP-confirmed and immutably logged.</p>
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-border/60 bg-surface/40 p-3">
          <input placeholder="Search by customer ID, name or email…" className="flex-1 bg-transparent px-2 text-sm focus:outline-none" defaultValue="A. Harrington · client-4827" />
          <Link to="/portal/dashboard" className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"><Eye className="h-4 w-4" /> Begin session</Link>
        </div>
      </div>
    </div>
  </>
)});
