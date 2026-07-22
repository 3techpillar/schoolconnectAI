"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, ROLE_LABEL, SIGNUP_ROLES, type Role } from "@/lib/auth";
import { appConfig } from "@/lib/config";
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  ShieldCheck,
} from "@/components/Icons";

type Step = "identifier" | "otp" | "profile";
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
  const { user, ready, sendOtp, verifyOtp, completeRegistration } = useAuth();

  const [channel, setChannel] = useState<Channel>("phone");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("identifier");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("parent");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [childName, setChildName] = useState("");

  useEffect(() => {
    if (ready && user) router.replace(redirectTo);
  }, [ready, user, router, redirectTo]);

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

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !school.trim()) {
      return setError("Name and school are required");
    }
    completeRegistration({
      identifier,
      identifierType: channel,
      name: name.trim(),
      role,
      school: school.trim(),
      className: className.trim() || undefined,
      childName: childName.trim() || undefined,
    });
    router.replace(redirectTo);
  };

  const needsClass =
    role === "class_teacher" || role === "student" || role === "parent";
  const needsChild = role === "parent";

  return (
    <div className="app-shell">
      <header className="header-primary safe-top page-x" style={{ paddingBottom: "1.5rem" }}>
        <div className="header-row">
          {step !== "identifier" && (
            <button
              onClick={() => {
                setStep(step === "profile" ? "otp" : "identifier");
                setError(null);
              }}
              className="icon-btn on-primary"
              aria-label="Back"
              style={{ width: 36, height: 36 }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="grow">
            <p className="header-sub">SchoolConnect AI</p>
            <h1 className="header-title">
              {step === "identifier"
                ? "Welcome"
                : step === "otp"
                  ? "Verify OTP"
                  : "Complete setup"}
            </h1>
          </div>
          <Sparkles size={20} style={{ opacity: 0.7 }} />
        </div>
      </header>

      <main className="page-x" style={{ paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
        <div className="max-md">
          {step === "identifier" && (
            <form onSubmit={submitIdentifier} className="space-y">
              <p className="text-sm muted">
                Sign in or create an account. One app for parents, teachers,
                staff and admins.
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

              <div className="demo-note">
                <ShieldCheck size={16} className="tone-primary" />
                Demo mode — use OTP{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  {appConfig.demoOtp}
                </strong>{" "}
                to sign in.
              </div>
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
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="auth-otp"
              />
              {error && <p className="error-text">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary"
              >
                {loading ? "Verifying…" : "Verify & continue"}
              </button>
              <p className="text-xs muted" style={{ textAlign: "center" }}>
                Demo OTP:{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  {appConfig.demoOtp}
                </strong>
              </p>
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
