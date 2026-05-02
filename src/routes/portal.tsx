import { createFileRoute, redirect } from "@tanstack/react-router";
import { PortalShell } from "@/components/banking/PortalShell";
import { LayoutDashboard, ArrowLeftRight, Users, FileText, Banknote, Coins, LifeBuoy, UserCog, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isMfaVerified } from "@/auth/AuthProvider";

export const Route = createFileRoute("/portal")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid || !isMfaVerified(uid)) {
      throw redirect({ to: "/login", search: { role: "client", redirect: location.pathname } });
    }
    if (location.pathname === "/portal" || location.pathname === "/portal/") {
      throw redirect({ to: "/portal/dashboard" });
    }
  },
  component: PortalLayout,
});

function PortalLayout() {
  const nav = [
    { to: "/portal/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: "/portal/transactions", label: "Transactions", icon: <ArrowLeftRight className="h-4 w-4" /> },
    { to: "/portal/transfers", label: "Transfers & wires", icon: <Send className="h-4 w-4" /> },
    { to: "/portal/beneficiaries", label: "Beneficiaries", icon: <Users className="h-4 w-4" /> },
    { to: "/portal/instruments", label: "Instruments", icon: <FileText className="h-4 w-4" /> },
    { to: "/portal/loans", label: "Loans & credit", icon: <Banknote className="h-4 w-4" /> },
    { to: "/portal/crypto", label: "Crypto custody", icon: <Coins className="h-4 w-4" /> },
    { to: "/portal/support", label: "Concierge", icon: <LifeBuoy className="h-4 w-4" /> },
    { to: "/portal/settings", label: "Profile & security", icon: <UserCog className="h-4 w-4" /> },
  ];

  return (
    <PortalShell
      nav={nav}
      badge="Client console"
      footer={
        <div className="m-3 rounded-lg border border-border/60 bg-surface/40 p-3 text-xs">
          <div className="font-medium text-foreground">Relationship manager</div>
          <div className="mt-0.5 text-muted-foreground">Élise Vaucher · +41 22 707 11 ••</div>
          <button className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-[11px] font-medium hover:bg-surface-elevated">Request a call</button>
        </div>
      }
    />
  );
}
