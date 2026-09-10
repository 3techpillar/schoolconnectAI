"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/shared/api-client";
import { useAuth, ROLE_LABEL, SIGNUP_ROLES, type Role } from "@/lib/providers/auth";
import { appConfig } from "@/lib/shared/config";
import { DEMO_ADMIN_ACCOUNTS, DEMO_FAMILY_ACCOUNTS } from "@schoolconnect/shared";
import { needsEnrollmentApproval, needsSchoolAssignment, useEnrollment } from "@/lib/providers/enrollment";
import type { TeacherInvite } from "@/lib/providers/enrollment";
import { WelcomeHints, WelcomeSketch } from "@/components/shell/WelcomeSketch";
import { LoadingBlock } from "@/components/shell/StatusUI";
import { SchoolSearchSelect } from "@/components/shell/SchoolSearchSelect";
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Bus,
  School,
  CheckCircle2,
} from "@/components/shell/Icons";

type Step = "welcome" | "identifier" | "otp" | "profile";
type Channel = "email" | "phone";

const ROLES = SIGNUP_ROLES;

const QUICK_DEMO_USERS = [
  { role: "super_admin", label: "Super Admin", sub: "Platform owner", email: "super@schoolconnect.demo", badge: "👑 Platform" },
  { role: "admin", label: "Radoms Admin", sub: "Full ERP mode", email: "admin@radoms.demo", badge: "🏢 ERP" },
  { role: "class_teacher", label: "Ms. Mehta", sub: "Class 6-B teacher", email: "teacher@radoms.demo", badge: "👩‍🏫 Teacher" },
  { role: "parent", label: "RIS Parent", sub: "Ishaan's parent", email: "parent@radoms.demo", badge: "👨‍👩‍👦 Parent" },
  { role: "student", label: "Ishaan Gupta", sub: "Student (6-B)", email: "student@radoms.demo", badge: "🎓 Student" },
  { role: "bus_attendant", label: "Bus Attendant", sub: "Route-12 Driver", email: "bus@radoms.demo", badge: "🚌 Bus" },
  { role: "admin", label: "Noida Admin", sub: "Radmos Group", email: "admin.noida@radmos.demo", badge: "📍 Noida" },
  { role: "admin", label: "Lucknow Admin", sub: "Transfers desk", email: "admin.lucknow@radmos.demo", badge: "📍 Lucknow" },
];

const ROLE_INFO: Record<string, { label: string; desc: string; icon: typeof GraduationCap }> = {
  parent: {
    label: "Parent / Guardian",
    desc: "View attendance, pay school fees & live bus alerts",
    icon: ShieldCheck,
  },
  student: {
    label: "Student",
    desc: "Access daily homework, timetables & Learning Zone XP",
    icon: GraduationCap,
  },
  class_teacher: {
    label: "Class Teacher",
    desc: "Take roll call attendance, assign homework & chat",
    icon: BookOpen,
  },
  bus_attendant: {
    label: "Bus Attendant",
    desc: "Live route tracking & parent arrival alerts",
    icon: Bus,
  },
  principal: {
    label: "Principal / Leadership",
    desc: "School leadership & administrative approvals",
    icon: School,
  },
};

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <LoadingBlock label="Starting…" splash />
        </div>
      }
    >
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
  const [schoolId, setSchoolId] = useState("");
  const [className, setClassName] = useState("");
  const [childName, setChildName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showTourOnLoad, setShowTourOnLoad] = useState(true);

  useEffect(() => {
    if (ready && user) {
      const limited =
        needsSchoolAssignment(user, backend) ||
        needsEnrollmentApproval(user);
      router.replace(limited ? "/pending" : redirectTo);
    }
  }, [ready, user, backend, router, redirectTo]);

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
      if (res.existing && res.user) {
        const limited =
          needsSchoolAssignment(res.user, backend) ||
          needsEnrollmentApproval(res.user);
        router.replace(limited ? "/pending" : redirectTo);
      } else if (res.existing) {
        router.replace(redirectTo);
      }
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
    if (!name.trim()) {
      return setError("Name is required");
    }
    if (backend && !schoolId.trim()) {
      return setError("Please search and select your school from the list");
    }
    if (!backend && !school.trim()) {
      return setError("Name and school are required");
    }

    let resolvedRole = role;
    let resolvedSchool = school.trim();
    let resolvedSchoolId = schoolId.trim() || undefined;
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
        if (inviteCode.trim() || !backend) {
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
        } else if (backend) {
          // Also try match by invited phone/email even without typed code
          try {
            const res = await apiFetch<{ invite: TeacherInvite | null }>(
              `/api/invites/lookup?identifier=${encodeURIComponent(identifier)}`,
            );
            invite = res.invite;
          } catch {
            invite = null;
          }
        }

        if (invite) {
          code = invite.code;
          resolvedRole = invite.role;
          resolvedSchool = invite.school;
          resolvedSchoolId = undefined; // server resolves from invite
          resolvedClass = invite.className || resolvedClass;
          setSchool(resolvedSchool);
          if (resolvedClass) setClassName(resolvedClass);
        }
        // No invite → submit as pending join request for school admin
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
        schoolId: resolvedSchoolId,
        className: resolvedClass,
        childName: childName.trim() || undefined,
        inviteCode: code,
        enrollmentStatus:
          role === "student"
            ? "pending"
            : code
              ? "approved"
              : ["class_teacher", "principal", "bus_attendant"].includes(role)
                ? "pending"
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
        needsSchoolAssignment(created, backend) ||
          needsEnrollmentApproval(created)
          ? "/pending"
          : redirectTo,
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
                <div className="auth-demo-dock" style={{ marginTop: "1.25rem" }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="auth-demo-tag">
                      <ShieldCheck size={13} /> Quick Test Logins
                    </span>
                    <span className="text-11 muted">OTP: <strong>{appConfig.demoOtp}</strong></span>
                  </div>
                  <p className="text-11 muted" style={{ margin: "0 0 0.6rem" }}>
                    Tap any persona to auto-fill their credentials:
                  </p>
                  <div className="auth-demo-grid">
                    {QUICK_DEMO_USERS.map((demo) => {
                      const active = identifier === demo.email;
                      return (
                        <button
                          type="button"
                          key={demo.email}
                          className={`auth-demo-btn ${active ? "active" : ""}`}
                          onClick={() => {
                            setChannel("email");
                            setIdentifier(demo.email);
                            setError(null);
                          }}
                        >
                          <span style={{ fontSize: 13, flexShrink: 0 }}>{demo.badge.split(" ")[0]}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {demo.label}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--muted-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {demo.sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={submitOtp} className="space-y auth-card">
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--blue-tint)",
                    color: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 0.75rem",
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Verification Code</h2>
                <p className="text-sm muted" style={{ margin: "4px 0 0" }}>
                  Code sent to <strong style={{ color: "var(--foreground)" }}>{identifier}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setStep("identifier")}
                  style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, marginTop: 6, display: "inline-block" }}
                >
                  ← Change {channel === "phone" ? "phone number" : "email"}
                </button>
              </div>

              <div style={{ margin: "1.25rem 0" }}>
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
              </div>

              {appConfig.demoMode && (
                <button
                  type="button"
                  onClick={() => setOtp(appConfig.demoOtp || "000000")}
                  className="btn-secondary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 12,
                    padding: "8px 12px",
                    background: "rgba(37, 99, 235, 0.08)",
                    color: "var(--primary)",
                    border: "1px dashed rgba(37, 99, 235, 0.4)",
                  }}
                >
                  <Sparkles size={14} /> Quick-fill demo code (<strong>{appConfig.demoOtp}</strong>)
                </button>
              )}

              {error && <p className="error-text">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary"
                style={{ width: "100%", padding: "12px", marginTop: "1rem" }}
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={submitProfile} className="space-y auth-card">
              <div className="row text-sm muted">
                <GraduationCap size={18} className="tone-primary" />
                <span>Tell us a bit about you to complete your setup.</span>
              </div>

              <label>
                <span className="text-xs font-medium muted">Your Full Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="input"
                />
              </label>

              <div>
                <span className="text-xs font-semibold muted" style={{ display: "block", marginBottom: 8 }}>
                  Select your role in the school:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ROLES.map((r) => {
                    const info = ROLE_INFO[r] || {
                      label: ROLE_LABEL[r],
                      desc: "Access school services",
                      icon: GraduationCap,
                    };
                    const IconComp = info.icon;
                    const active = role === r;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`auth-role-card ${active ? "active" : ""}`}
                      >
                        <div className="auth-role-icon">
                          <IconComp size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--primary)" : "var(--foreground)" }}>
                              {info.label}
                            </span>
                            {active && <CheckCircle2 size={16} className="tone-primary" />}
                          </div>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted-fg)", lineHeight: 1.3 }}>
                            {info.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label>
                <span className="text-xs font-medium muted">Select School</span>
                {backend ? (
                  <SchoolSearchSelect
                    valueId={schoolId}
                    valueLabel={school}
                    onChange={(s) => {
                      setSchoolId(s?.id || "");
                      setSchool(s?.name || "");
                    }}
                  />
                ) : (
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Delhi Public School, Bengaluru"
                    className="input"
                  />
                )}
                <p className="text-11 muted mt-1">
                  Only already registered schools appear here. Search by name,
                  city, or code.
                </p>
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
                    Admin invite code (optional)
                  </span>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="SC-XXXX"
                    className="input"
                  />
                  <p className="text-11 muted mt-1">
                    If you have a code from School Admin, enter it for instant
                    access. Without a code, your request goes to the school
                    admin for approval after you finish setup.
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

              {(role === "class_teacher" ||
                role === "principal" ||
                role === "bus_attendant") &&
                !inviteCode.trim() && (
                  <p className="text-11 muted">
                    No invite code? Submit anyway — School Admin will see your
                    join request under Admin → Users and can approve access.
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
