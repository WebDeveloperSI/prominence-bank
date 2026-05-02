import { createFileRoute, redirect } from "@tanstack/react-router";
import { PortalShell } from "@/components/banking/PortalShell";
import { LayoutDashboard, Users, ShieldCheck, FileText, Banknote, ScrollText, KeyRound, Eye, Wallet, LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isMfaVerified } from "@/auth/AuthProvider";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid || !isMfaVerified(uid)) {
      throw redirect({ to: "/login", search: { role: "admin", redirect: location.pathname } });
    }
    // Verify admin role server-side via RLS-protected user_roles read
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/portal/dashboard" });
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: () => (
    <PortalShell badge="Operations console" nav={[
      { to: "/admin/dashboard",   label: "Operations",        icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/admin/customers",   label: "Customers & KYC",   icon: <Users className="h-4 w-4" /> },
      { to: "/admin/approvals",   label: "Approvals queue",   icon: <ShieldCheck className="h-4 w-4" /> },
      { to: "/admin/deposits",    label: "Deposits & holds",  icon: <Wallet className="h-4 w-4" /> },
      { to: "/admin/instruments", label: "Instruments",       icon: <FileText className="h-4 w-4" /> },
      { to: "/admin/loans",       label: "Loans",             icon: <Banknote className="h-4 w-4" /> },
      { to: "/admin/support",     label: "Support inbox",     icon: <LifeBuoy className="h-4 w-4" /> },
      { to: "/admin/audit",       label: "Audit & compliance",icon: <ScrollText className="h-4 w-4" /> },
      { to: "/admin/rbac",        label: "Roles & access",    icon: <KeyRound className="h-4 w-4" /> },
      { to: "/admin/impersonate", label: "View as client",    icon: <Eye className="h-4 w-4" /> },
    ]} />
  ),
});
