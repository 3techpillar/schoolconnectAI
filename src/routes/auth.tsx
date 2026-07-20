import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, GraduationCap, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth, ROLE_LABEL, type Role } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SchoolConnect AI" },
      { name: "description", content: "Sign in with email or phone. Parents, teachers, staff — all in one app." },
    ],
  }),
  component: AuthPage,
});

type Step = "identifier" | "otp" | "profile";
type Channel = "email" | "phone";

const ROLES: Role[] = ["parent", "student", "class_teacher", "bus_attendant", "principal", "admin"];

function AuthPage() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search as { redirect?: string } });
  const { user, ready, sendOtp, verifyOtp, completeRegistration } = useAuth();

  const [channel, setChannel] = useState<Channel>("phone");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("identifier");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("parent");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [childName, setChildName] = useState("");

  useEffect(() => {
    if (ready && user) navigate({ to: (search?.redirect as any) || "/" });
  }, [ready, user]);

  const submitIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) return setError("Please enter your " + (channel === "email" ? "email" : "phone number"));
    setLoading(true);
    try { await sendOtp(identifier); setStep("otp"); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(identifier, otp);
      if (res.existing) navigate({ to: (search?.redirect as any) || "/" });
      else setStep("profile");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !school.trim()) return setError("Name and school are required");
    completeRegistration({
      identifier,
      identifierType: channel,
      name: name.trim(),
      role,
      school: school.trim(),
      className: className.trim() || undefined,
      childName: childName.trim() || undefined,
    });
    navigate({ to: (search?.redirect as any) || "/" });
  };

  const needsClass = role === "class_teacher" || role === "student" || role === "parent";
  const needsChild = role === "parent";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground safe-top px-5 pb-6 rounded-b-[28px]">
        <div className="flex items-center gap-2">
          {step !== "identifier" && (
            <button
              onClick={() => { setStep(step === "profile" ? "otp" : "identifier"); setError(null); }}
              className="grid place-items-center h-9 w-9 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <p className="text-[11px] font-medium text-primary-foreground/70">SchoolConnect AI</p>
            <h1 className="text-[22px] font-semibold tracking-tight">
              {step === "identifier" ? "Welcome" : step === "otp" ? "Verify OTP" : "Complete setup"}
            </h1>
          </div>
          <Sparkles className="h-5 w-5 text-primary-foreground/70" />
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-10">
        <div className="mx-auto max-w-md">
          {step === "identifier" && (
            <form onSubmit={submitIdentifier} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in or create an account. One app for parents, teachers, staff and admins.
              </p>

              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                {(["phone", "email"] as const).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                      channel === c ? "bg-surface text-foreground shadow-soft" : "text-muted-foreground"
                    }`}
                  >
                    {c === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    {c === "phone" ? "Phone" : "Email"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  {channel === "phone" ? "Mobile number" : "Email address"}
                </span>
                <input
                  type={channel === "phone" ? "tel" : "email"}
                  inputMode={channel === "phone" ? "tel" : "email"}
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={channel === "phone" ? "+91 98765 43210" : "you@example.com"}
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-medium disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send OTP"}
              </button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                Demo mode — use OTP <span className="font-semibold text-foreground">000000</span> to sign in.
              </div>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={submitOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{identifier}</span>.
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
                className="w-full rounded-xl border border-input bg-surface px-4 py-4 text-center text-2xl tracking-[0.5em] font-semibold outline-none focus:ring-2 focus:ring-ring"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-medium disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify & continue"}
              </button>
              <p className="text-xs text-center text-muted-foreground">
                Demo OTP: <span className="font-semibold text-foreground">000000</span>
              </p>
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={submitProfile} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4 text-primary" />
                Tell us a bit about you to set up your account.
              </div>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <div>
                <span className="text-xs font-medium text-muted-foreground">I am a</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition ${
                        role === r
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-surface text-foreground hover:bg-muted"
                      }`}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">School</span>
                <input
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Delhi Public School, Bengaluru"
                  className="mt-1 w-full rounded-xl border border-input bg-surface px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              {needsClass && (
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    {role === "class_teacher" ? "Class you teach" : "Class / Grade"}
                  </span>
                  <input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="6-B"
                    className="mt-1 w-full rounded-xl border border-input bg-surface px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              )}

              {needsChild && (
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Child's name</span>
                  <input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="mt-1 w-full rounded-xl border border-input bg-surface px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-medium"
              >
                Finish setup
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
