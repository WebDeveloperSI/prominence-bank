import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import {
  ShieldCheck, KeyRound, Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff,
  AlertCircle, CheckCircle2, Loader2, Smartphone, Clock, Fingerprint,
  Globe2, Building2, UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { issueOtp } from "@/api/banking";
import { maskEmail } from "@/lib/format";
import { useAuth, setMfaVerified, isMfaVerified } from "@/auth/AuthProvider";
import { toast } from "sonner";

type SearchSchema = { role?: "client" | "admin"; redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): SearchSchema => ({
    role: s.role === "admin" ? "admin" : "client",
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup" | "otp" | "success";

const DEMO_CLIENT = { email: "client@prominencebank.com", password: "Prominence2026!" };
const DEMO_ADMIN  = { email: "admin@prominencebank.com",  password: "Prominence2026!" };

function LoginPage() {
  const navigate = useNavigate();
  const { role: roleParam = "client", redirect } = useSearch({ from: "/login" });
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const isAdminFlow = roleParam === "admin";
  const demo = isAdminFlow ? DEMO_ADMIN : DEMO_CLIENT;

  const [email, setEmail] = useState(demo.email);
  const [password, setPassword] = useState(demo.password);
  const [fullName, setFullName] = useState(isAdminFlow ? "Operator" : "Alexander Harrington");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [otpSeconds, setOtpSeconds] = useState(120);
  const [otpErr, setOtpErr] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // If already signed in AND MFA is verified for this session, route to portal/admin.
  // If signed in but MFA not yet completed, sign the stale session out so the user
  // always lands on Step 1 (Identify) when visiting /login directly.
  useEffect(() => {
    const uid = auth.session?.user?.id;
    if (!uid) return;
    if (mode === "success" || mode === "otp") return;
    if (isMfaVerified(uid)) {
      if (auth.isAdmin) navigate({ to: "/admin/dashboard" });
      else navigate({ to: redirect ?? "/portal/dashboard" });
      return;
    }
    // Has a session but no MFA — drop the stale session so the form re-shows.
    if (mode === "signin" && !loading) {
      void supabase.auth.signOut();
    }
  }, [auth.session, auth.isAdmin, mode, navigate, redirect, loading]);

  useEffect(() => {
    if (mode !== "otp" || otpSeconds <= 0) return;
    const t = setInterval(() => setOtpSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [mode, otpSeconds]);

  async function ensureAdminRole(userId: string) {
    // Promote demo admin via SECURITY DEFINER RPC (RLS blocks direct insert into user_roles).
    if (email.trim().toLowerCase() === DEMO_ADMIN.email) {
      await supabase.rpc("promote_demo_admin");
    }
    void userId;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      let { data, error } = await supabase.auth.signInWithPassword({ email, password });
      // Auto-seed demo accounts if not found
      if (error && (error.message.match(/Invalid login credentials/i) || error.message.match(/Email not confirmed/i)) &&
          (email === DEMO_CLIENT.email || email === DEMO_ADMIN.email)) {
        const su = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
        });
        if (su.error && !su.error.message.match(/already registered/i)) throw su.error;
        const retry = await supabase.auth.signInWithPassword({ email, password });
        data = retry.data; error = retry.error;
      }
      if (error) throw error;
      if (!data.session) throw new Error("No session returned.");
      await ensureAdminRole(data.session.user.id);
      await auth.refreshRoles();

      // Issue OTP for the second factor
      const code = await issueOtp("login");
      setOtpId(code.id);
      setOtpCode(code.code);
      setOtp(["", "", "", "", "", ""]);
      setOtpSeconds(120);
      setOtpErr(null);
      setMode("otp");
      toast.success("Verification code issued", { description: `Demo OTP: ${code.code}` });
    } catch (ex) {
      setErr((ex as Error).message);
    } finally { setLoading(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      // Sign in immediately (auto-confirm is on for the demo)
      const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
      if (e2) throw e2;
      toast.success("Account created");
      const code = await issueOtp("login");
      setOtpId(code.id); setOtpCode(code.code);
      setOtp(["", "", "", "", "", ""]);
      setOtpSeconds(120);
      setMode("otp");
    } catch (ex) {
      setErr((ex as Error).message);
    } finally { setLoading(false); }
  }

  async function submitOtp(code: string) {
    if (otpSeconds === 0) { setOtpErr("This code has expired."); return; }
    if (!otpId) return;
    setOtpLoading(true); setOtpErr(null);
    try {
      const r = await supabase.rpc("verify_otp", { _id: otpId, _code: code });
      if (r.error) throw r.error;
      if (!r.data) { setOtpErr("Code incorrect or expired."); setOtp(["","","","","",""]); return; }
      // Mark MFA as verified for this browser session.
      const uid = auth.session?.user?.id ?? (await supabase.auth.getUser()).data.user?.id;
      if (uid) setMfaVerified(uid);
      // Re-fetch roles directly from DB so redirect decision is server-truth, not stale state.
      let serverIsAdmin = false;
      if (uid) {
        const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", uid);
        serverIsAdmin = (roleRows ?? []).some((r) => r.role === "admin");
      }
      setMode("success");
      await auth.refreshRoles();
      setTimeout(() => {
        if (serverIsAdmin) navigate({ to: "/admin/dashboard" });
        else navigate({ to: redirect ?? "/portal/dashboard" });
      }, 900);
    } catch (ex) {
      setOtpErr((ex as Error).message);
    } finally { setOtpLoading(false); }
  }

  async function resendOtp() {
    const code = await issueOtp("login");
    setOtpId(code.id); setOtpCode(code.code);
    setOtp(["","","","","",""]); setOtpSeconds(120); setOtpErr(null);
    toast.success("New code issued", { description: `Demo OTP: ${code.code}` });
  }

  /* ---------- shell ---------- */
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[600px] max-w-3xl bg-[radial-gradient(ellipse_at_top,oklch(0.45_0.15_250/0.35),transparent_70%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <aside className="hidden flex-col justify-between border-r border-border/60 bg-surface/30 p-12 lg:flex">
          <Link to="/" className="inline-flex w-fit"><Logo /></Link>
          <div className="space-y-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-gold">
                {isAdminFlow ? "Operations Console" : "Secure Access"}
              </div>
              <p className="mt-4 font-display text-[2.6rem] font-medium leading-[1.05]">
                "Trust is engineered —<br />never assumed."
              </p>
              <div className="mt-3 text-sm text-muted-foreground">— Charter, 1924</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-gold">
                <Fingerprint className="h-4 w-4" /> Multi-factor authentication
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every session is double-protected: encrypted password (Argon2) plus a fresh
                six-digit code from our internal OTP service. Sessions auto-expire after 15
                minutes of inactivity.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-xs text-muted-foreground">
            <Row icon={<ShieldCheck className="h-4 w-4 text-gold" />} text="SOC 2 Type II · ISO 27001 · PCI-DSS Level 1" />
            <Row icon={<Lock className="h-4 w-4 text-gold" />} text="End-to-end TLS 1.3 · AES-256 at rest" />
            <Row icon={<Clock className="h-4 w-4 text-gold" />} text="Auto-logout after 15 minutes of inactivity" />
            <Row icon={<Globe2 className="h-4 w-4 text-gold" />} text="Anomaly-based geo & device verification" />
          </div>
        </aside>

        <main className="flex min-h-screen flex-col px-5 py-8 sm:px-8 lg:px-14 lg:py-10">
          <div className="flex items-center justify-between lg:hidden">
            <Link to="/"><Logo /></Link>
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </Link>
          </div>

          <div className="hidden items-center justify-between lg:flex">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" /> Role detected automatically after sign-in
            </span>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            {mode !== "success" && <Stepper mode={mode} />}

            {mode !== "success" && (
              <div className="mb-5 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.14em]">
                <div className="flex items-center justify-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 py-1.5 text-success">
                  <Lock className="h-3 w-3" /> Secure login
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-2 py-1.5 text-gold">
                  <KeyRound className="h-3 w-3" /> RBAC enabled
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5 text-primary">
                  <ShieldCheck className="h-3 w-3" /> MFA enforced
                </div>
              </div>
            )}

            {(mode === "signin" || mode === "signup") && (
              <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="mt-2 space-y-4" noValidate>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {isAdminFlow ? "Operations console" : "Client portal"} · Step 1 of 3
                </div>
                <h1 className="font-display text-3xl font-medium md:text-4xl">
                  {mode === "signin" ? `Sign in to ${isAdminFlow ? "operations" : "your portal"}` : "Create your access"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Enter your credentials. We'll verify with a one-time code on the next step."
                    : "Provision a demo account. Two starter accounts will be funded automatically."}
                </p>

                {mode === "signup" && (
                  <Field id="fullName" icon={<UserPlus className="h-4 w-4" />} label="Full name"
                    type="text" autoComplete="name" placeholder="Alexander Harrington"
                    value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} invalid={false} />
                )}

                <Field id="email" icon={<Mail className="h-4 w-4" />} label="Email"
                  type="email" autoComplete="username" inputMode="email"
                  placeholder="client@prominencebank.com"
                  value={email} onChange={(e) => setEmail(e.currentTarget.value)} invalid={!!err} />

                <div>
                  <label htmlFor="password" className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Password</label>
                  <div className={`mt-1.5 flex items-center gap-2 rounded-md border bg-input px-3 py-2.5 ${err ? "border-destructive/70 ring-2 ring-destructive/20" : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30"}`}>
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <input id="password" type={showPwd ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      placeholder="••••••••" value={password} onChange={(e) => setPassword(e.currentTarget.value)}
                      className="w-full bg-transparent text-sm focus:outline-none" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}>
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {err && <ErrorBanner>{err}</ErrorBanner>}

                <button type="submit" disabled={loading}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[oklch(0.74_0.16_245)] to-[oklch(0.62_0.16_245)] px-4 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:opacity-95 disabled:opacity-70">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                    : <><Lock className="h-4 w-4" /> {mode === "signin" ? "Continue securely" : "Create account"} <ArrowRight className="h-4 w-4" /></>}
                </button>

                <div className="rounded-md border border-border/60 bg-surface/30 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Demo credentials:</span>{" "}
                  <span className="font-mono-num">{demo.email}</span> /{" "}
                  <span className="font-mono-num">{demo.password}</span>
                  <div className="mt-1">First sign-in auto-creates the demo user with two funded accounts.</div>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  {mode === "signin" ? (
                    <>No account?{" "}<button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">Create one</button></>
                  ) : (
                    <>Already have one?{" "}<button type="button" onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">Sign in</button></>
                  )}
                </div>
              </form>
            )}

            {mode === "otp" && (
              <OtpForm
                email={email} otp={otp} setOtp={setOtp}
                error={otpErr} loading={otpLoading}
                seconds={otpSeconds} expired={otpSeconds === 0}
                demoCode={otpCode}
                onSubmit={submitOtp}
                onResend={() => void resendOtp()}
                onBack={() => setMode("signin")}
              />
            )}

            {mode === "success" && <SuccessPanel admin={isAdminFlow || auth.isAdmin} />}
          </div>

          <div className="mx-auto w-full max-w-md text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3 text-gold" /> Secure connection · TLS 1.3</span>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function Stepper({ mode }: { mode: Mode }) {
  const step = mode === "signin" || mode === "signup" ? 1 : mode === "otp" ? 2 : 3;
  const items = [{ n: 1, label: "Identify" }, { n: 2, label: "Verify" }, { n: 3, label: "Access" }];
  return (
    <div className="mb-6 flex items-center gap-2">
      {items.map((it, i) => {
        const done = step > it.n; const active = step === it.n;
        return (
          <div key={it.n} className="flex flex-1 items-center gap-2">
            <div className={["grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
              done ? "border-gold/60 bg-gold/15 text-gold" : active ? "border-primary/60 bg-primary/15 text-foreground"
              : "border-border bg-surface/40 text-muted-foreground"].join(" ")}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : it.n}
            </div>
            <div className={["text-[11px] uppercase tracking-[0.16em]", active ? "text-foreground" : done ? "text-gold/90" : "text-muted-foreground"].join(" ")}>{it.label}</div>
            {i < items.length - 1 && <div className="ml-1 mr-1 h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent" />}
          </div>
        );
      })}
    </div>
  );
}

function OtpForm(props: {
  email: string; otp: string[]; setOtp: (v: string[]) => void;
  error: string | null; loading: boolean;
  seconds: number; expired: boolean;
  demoCode: string | null;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const { email, otp, setOtp, error, loading, seconds, expired, demoCode, onSubmit, onResend, onBack } = props;
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const masked = useMemo(() => maskEmail(email), [email]);
  const code = otp.join("");
  const complete = code.length === 6;

  useEffect(() => { if (complete && !loading && !expired) onSubmit(code); /* eslint-disable-line */ }, [code]);

  function handleChange(i: number, raw: string) {
    const v = raw.replace(/\D/g, "");
    if (!v) { const next = [...otp]; next[i] = ""; setOtp(next); return; }
    if (v.length > 1) {
      const chars = v.slice(0, 6).split("");
      const next = [...otp];
      for (let k = 0; k < 6; k++) next[k] = chars[k] ?? "";
      setOtp(next);
      const last = Math.min(chars.length, 6) - 1;
      refs.current[last]?.focus();
      return;
    }
    const next = [...otp]; next[i] = v[0]; setOtp(next);
    if (i < 5) refs.current[i + 1]?.focus();
  }
  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Verification · Step 2 of 3</div>
      <h1 className="mt-3 font-display text-3xl font-medium md:text-4xl">Enter your verification code</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We've sent a six-digit code to <span className="font-mono-num text-foreground">{masked}</span>. The code is valid for {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2,"0")}.
      </p>

      <div className="mt-6 flex justify-center gap-2 sm:gap-3">
        {otp.map((v, i) => (
          <input key={i} id={`o-${i}`} ref={(el) => { refs.current[i] = el; }}
            value={v} onChange={(e) => handleChange(i, e.currentTarget.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            className={`h-14 w-11 rounded-md border bg-input text-center font-mono-num text-xl font-semibold transition-colors sm:h-16 sm:w-12 ${error ? "border-destructive/70 ring-2 ring-destructive/20" : "border-border focus:border-primary focus:ring-2 focus:ring-primary/30"} focus:outline-none`} />
        ))}
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {demoCode && (
        <div className="mt-4 rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-center text-xs text-gold">
          <Smartphone className="mr-1.5 inline h-3.5 w-3.5" />
          Demo OTP (also issued via Cloud): <span className="font-mono-num font-semibold">{demoCode}</span>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Use a different account
        </button>
        <button type="button" onClick={onResend} className="text-primary hover:underline" disabled={loading}>
          Resend code
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying with our auth service…
        </div>
      )}
    </div>
  );
}

function SuccessPanel({ admin }: { admin: boolean }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-medium">Authentication complete</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Server-verified role:{" "}
        <span className={admin ? "font-semibold text-gold" : "font-semibold text-primary"}>
          {admin ? "ADMIN" : "CLIENT"}
        </span>
        . Routing you to the {admin ? "operations console" : "client portal"}…
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gold">
        <KeyRound className="h-3 w-3" /> Role-based access control active
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Establishing secure session
      </div>
    </div>
  );
}

function Field(props: {
  id: string; icon: React.ReactNode; label: string;
  type: string; placeholder?: string; autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  invalid: boolean;
}) {
  const { id, icon, label, invalid, ...rest } = props;
  return (
    <div>
      <label htmlFor={id} className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <div className={`mt-1.5 flex items-center gap-2 rounded-md border bg-input px-3 py-2.5 ${invalid ? "border-destructive/70 ring-2 ring-destructive/20" : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30"}`}>
        <span className="text-muted-foreground">{icon}</span>
        <input id={id} {...rest}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none" />
      </div>
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{children}</span>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2">{icon}<span>{text}</span></div>;
}