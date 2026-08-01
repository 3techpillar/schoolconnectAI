"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth, ROLE_LABEL, SIGNUP_ROLES, type Role } from "@/lib/providers/auth";
import { appConfig } from "@/lib/shared/config";
import { needsEnrollmentApproval, useEnrollment } from "@/lib/providers/enrollment";
import type { TeacherInvite } from "@/lib/providers/enrollment";
import { WelcomeHints, WelcomeSketch } from "@/components/WelcomeSketch";
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  ShieldCheck,
} from "@/components/Icons";

type Step = "welcome" | "identifier" | "otp" | "profile";
type Channel = "email" | "phone";

const ROLES = SIGNUP_ROLES;

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="app-shell" />}>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const {
    user,
    ready,
    backend,
    sendOtp,
    verifyOtp,
    completeRegistration,
  } = useAuth();
  const {
    findInviteByCode,
    findInviteByIdentifier,
    acceptInvite,
    ensureStudentEnrollment,
    ready: enrollReady,
  } = useEnrollment();

  const [channel, setChannel] = useState<Channel>("phone");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("welcome");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("parent");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [childName, setChildName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showTourOnLoad, setShowTourOnLoad] = useState(true);

  useEffect(() => {
    if (ready && user) {
      router.replace(
        needsEnrollmentApproval(user) ? "/pending" : redirectTo,
      );
    }
  }, [ready, user, router, redirectTo]);

  useEffect(() => {
    try {
      if (localStorage.getItem("sc_skip_welcome_tour_v1") === "1") {
        setShowTourOnLoad(false);
        setStep("identifier");
      }
    } catch {
      /* noop */
    }
  }, []);

  const skipTour = () => {
    try {
      localStorage.setItem("sc_skip_welcome_tour_v1", "1");
    } catch {
      /* noop */
    }
    setShowTourOnLoad(false);
    setStep("identifier");
  };

  const startLogin = () => {
    setStep("identifier");
  };

  const submitIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      return setError(
        "Please enter your " + (channel === "email" ? "email" : "phone number"),
      );
    }
    setLoading(true);
    try {
      await sendOtp(identifier);
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(identifier, otp);
      if (res.existing) router.replace(redirectTo);
      else setStep("profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !school.trim()) {
      return setError("Name and school are required");
    }

    let resolvedRole = role;
    let resolvedSchool = school.trim();
    let resolvedClass = className.trim() || undefined;
    let code: string | undefined;

    setLoading(true);
    try {
      if (
        role === "class_teacher" ||
        role === "principal" ||
        role === "bus_attendant"
      ) {
        let invite: TeacherInvite | null = null;
        if (backend) {
          const q = inviteCode.trim()
            ? `code=${encodeURIComponent(inviteCode.trim())}`
            : `identifier=${encodeURIComponent(identifier)}`;
          const res = await apiFetch<{ invite: TeacherInvite | null }>(
            `/api/invites/lookup?${q}`,
          );
          invite = res.invite;
        } else {
          invite =
            (inviteCode.trim() && findInviteByCode(inviteCode)) ||
            findInviteByIdentifier(identifier);
        }
        if (!invite) {
          setError(
            "Teachers need a valid invite code from School Admin (or use the invited phone/email).",
          );
          return;
        }
        code = invite.code;
        resolvedRole = invite.role;
        resolvedSchool = invite.school;
        resolvedClass = invite.className || resolvedClass;
        setSchool(resolvedSchool);
        if (resolvedClass) setClassName(resolvedClass);
      }

      if (role === "student" && !className.trim()) {
        setError("Students must enter class & section (e.g. 6-B)");
        return;
      }

      const created = await completeRegistration({
        identifier,
        identifierType: channel,
        name: name.trim(),
        role: resolvedRole,
        school: resolvedSchool,
        className: resolvedClass,
        childName: childName.trim() || undefined,
        inviteCode: code,
        enrollmentStatus:
          role === "student"
            ? "pending"
            : code
              ? "approved"
              : undefined,
      });

      // Local-only enrollment bookkeeping (Mongo register handles this on backend)
      if (!backend) {
        if (code) acceptInvite(code, created);
        if (created.role === "student" && enrollReady) {
          ensureStudentEnrollment(created);
        }
      }

      router.replace(
        needsEnrollmentApproval(created) ? "/pending" : redirectTo,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const needsClass =
    role === "class_teacher" || role === "student" || role === "parent";
  const needsChild = role === "parent";

  const goBack = () => {
    setError(null);
    if (step === "profile") setStep("otp");
    else if (step === "otp") setStep("identifier");
    else if (step === "identifier" && showTourOnLoad) setStep("welcome");
  };

  const title =
    step === "welcome"
      ? "Welcome"
      : step === "identifier"
        ? "Sign in"
        : step === "otp"
          ? "Verify OTP"
          : "Complete setup";

  return (
    <div className="app-shell auth-shell">
      <header className="auth-hero safe-top page-x">
        <div className="auth-hero-glow" aria-hidden />
        <div className="header-row">
          {step !== "welcome" && (
            <button
              onClick={goBack}
              className="icon-btn on-primary"
              aria-label="Back"
              style={{ width: 36, height: 36 }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="grow">
            <div className="auth-brand">
              <span className="auth-logo-mark" aria-hidden>
                <GraduationCap size={16} />
              </span>
              <p className="header-sub" style={{ margin: 0, opacity: 0.9 }}>
                SchoolConnect
              </p>
            </div>
            <h1 className="header-title">{title}</h1>
          </div>
          <Sparkles size={20} style={{ opacity: 0.75 }} />
        </div>
        {step === "welcome" && (
          <p className="auth-lead">
            One tap for bus, attendance, fees &amp; school chat — built for
            parents, teachers and admins.
          </p>
        )}
      </header>

      <main className="page-x auth-main">
        <div className="max-md">
          {step === "welcome" && (
            <div className="space-y auth-welcome">
              <WelcomeSketch />
              <WelcomeHints />

              <div className="auth-cta-row">
                <button type="button" className="btn-primary" onClick={startLogin}>
                  Get started
                </button>
                <button type="button" className="btn-secondary" onClick={skipTour}>
                  Skip tutorial
                </button>
              </div>

              {appConfig.demoMode && (
              <div className="demo-note">
                <ShieldCheck size={16} className="tone-primary" />
                Interactive demo — OTP{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  {appConfig.demoOtp}
                </strong>{" "}
                works for any phone or email.
              </div>
              )}
            </div>
          )}

          {step === "identifier" && (
            <form onSubmit={submitIdentifier} className="space-y">
              <button
                type="button"
                className="auth-replay"
                onClick={() => setStep("welcome")}
              >
                ▶ Replay how it works
              </button>

              <p className="text-sm muted">
                Sign in or create an account. Your role is saved after first
                setup.
              </p>

              <div className="channel-toggle">
                {(["phone", "email"] as const).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`channel-btn ${channel === c ? "active" : ""}`}
                  >
                    {c === "phone" ? <Phone size={16} /> : <Mail size={16} />}
                    {c === "phone" ? "Phone" : "Email"}
                  </button>
                ))}
              </div>

              <label>
                <span className="text-xs font-medium muted">
                  {channel === "phone" ? "Mobile number" : "Email address"}
                </span>
                <input
                  type={channel === "phone" ? "tel" : "email"}
                  inputMode={channel === "phone" ? "tel" : "email"}
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    channel === "phone" ? "+91 98765 43210" : "you@example.com"
                  }
                  className="input"
                />
              </label>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Sending…" : "Send OTP"}
              </button>

              <WelcomeHints />

              {appConfig.demoMode && (
              <div className="demo-note">
                <ShieldCheck size={16} className="tone-primary" />
               Test mode — use OTP{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  {appConfig.demoOtp}
                </strong>{" "}
                to sign in.
              </div>
              )}
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={submitOtp} className="space-y">
              <p className="text-sm muted">
                We sent a 6-digit code to{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  {identifier}
                </strong>
                .
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                enterKeyHint="done"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="auth-otp"
                aria-label="One-time password"
              />
              {error && <p className="error-text">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary"
              >
                {loading ? "Verifying…" : "Verify & continue"}
              </button>
              {appConfig.demoMode && (
              <p className="text-xs muted" style={{ textAlign: "center" }}>
                Demo OTP:{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  {appConfig.demoOtp}
                </strong>
              </p>
              )}
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={submitProfile} className="space-y">
              <div className="row text-sm muted">
                <GraduationCap size={16} className="tone-primary" />
                Tell us a bit about you to set up your account.
              </div>

              <label>
                <span className="text-xs font-medium muted">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="input"
                />
              </label>

              <div>
                <span className="text-xs font-medium muted">I am a</span>
                <div className="role-grid">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`role-btn ${role === r ? "active" : ""}`}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
                <p className="text-11 muted mt-2">
                  This role is saved permanently for your phone/email. Next
                  login restores the same role automatically.
                </p>
              </div>

              <label>
                <span className="text-xs font-medium muted">School</span>
                <input
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Delhi Public School, Bengaluru"
                  className="input"
                />
              </label>

              {needsClass && (
                <label>
                  <span className="text-xs font-medium muted">
                    {role === "class_teacher"
                      ? "Class you teach"
                      : role === "student"
                        ? "Class & section (e.g. 6-B)"
                        : "Class / Grade"}
                  </span>
                  <input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="6-B"
                    className="input"
                  />
                </label>
              )}

              {(role === "class_teacher" ||
                role === "principal" ||
                role === "bus_attendant") && (
                <label>
                  <span className="text-xs font-medium muted">
                    Teacher invite code (from School Admin)
                  </span>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="SC-XXXX"
                    className="input"
                  />
                  <p className="text-11 muted mt-1">
                    Or register with the same phone/email the admin invited.
                  </p>
                </label>
              )}

              {role === "student" && (
                <p className="text-11 muted">
                  After signup your account stays limited until a class teacher
                  or school admin approves enrollment for your class &amp;
                  section.
                </p>
              )}

              {needsChild && (
                <label>
                  <span className="text-xs font-medium muted">
                    Child&apos;s name
                  </span>
                  <input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="input"
                  />
                </label>
              )}

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="btn-primary">
                Finish setup
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
