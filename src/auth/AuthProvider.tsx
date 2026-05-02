import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "client" | "operator" | "auditor";

const MFA_KEY = "pb.mfa_verified";

export function setMfaVerified(userId: string) {
  try { sessionStorage.setItem(MFA_KEY, userId); } catch { /* ignore */ }
}
export function clearMfaVerified() {
  try { sessionStorage.removeItem(MFA_KEY); } catch { /* ignore */ }
}
export function isMfaVerified(userId: string | undefined): boolean {
  if (!userId) return false;
  try { return sessionStorage.getItem(MFA_KEY) === userId; } catch { return false; }
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  mfaVerified: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRoles(uid: string | undefined) {
    if (!uid) { setRoles([]); return; }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  }

  useEffect(() => {
    // Set up listener FIRST (per Supabase guidance)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (_event === "SIGNED_OUT") clearMfaVerified();
      // defer to avoid deadlock
      setTimeout(() => { void loadRoles(s?.user?.id); }, 0);
    });
    // Then read existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadRoles(data.session?.user?.id).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    session,
    user: session?.user ?? null,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isClient: roles.includes("client"),
    mfaVerified: isMfaVerified(session?.user?.id),
    refreshRoles: () => loadRoles(session?.user?.id),
    signOut: async () => { clearMfaVerified(); await supabase.auth.signOut(); },
  }), [session, roles, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}