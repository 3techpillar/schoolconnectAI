import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen, CalendarCheck, Wallet, Megaphone, Bus, Phone, MessageCircle,
  ArrowRight, CheckCircle2, AlertCircle, Sparkles,
} from "lucide-react";
import { useEffect } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth, ROLE_LABEL } from "@/lib/auth";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — SchoolConnect AI" },
      { name: "description", content: "Your child's day at a glance: attendance, homework, fees and circulars." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user]);
  if (!user) return <div className="min-h-screen bg-background" />;
  const firstName = user.name.split(" ")[0] ?? "there";
  const displayName = user.childName ?? user.name ?? "";
  const initial = (displayName || "?").charAt(0).toUpperCase();
  const subtitle = user.childName ? `Hi, ${firstName}` : `Signed in as ${ROLE_LABEL[user.role]}`;
  const title = user.childName ? `${user.childName.split(" ")[0]}'s day` : `Welcome, ${firstName}`;
  const metaLine = [user.school, user.className && `Class ${user.className}`].filter(Boolean).join(" · ");

  return (
    <PhoneShell subtitle={subtitle} title={title}>
      {/* Hero identity card */}
      <section className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-primary text-white grid place-items-center text-base font-semibold">{initial}</div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{metaLine || ROLE_LABEL[user.role]}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-success font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {ROLE_LABEL[user.role]} · Active
          </div>
        </div>
        <Link to="/attendance" className="shrink-0 h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition">
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>


      {/* Quick actions */}
      <section className="mt-4 grid grid-cols-4 gap-2">
        {[
          { icon: Phone, label: "Call" },
          { icon: MessageCircle, label: "Message" },
          { icon: Wallet, label: "Pay" },
          { icon: BookOpen, label: "Homework" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-surface border border-border hover:border-primary/40 transition">
            <Icon className="h-[18px] w-[18px] text-primary" />
            <span className="text-[11px] font-medium text-foreground">{label}</span>
          </button>
        ))}
      </section>

      {/* Today summary */}
      <h2 className="mt-6 mb-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Today</h2>
      <section className="grid grid-cols-2 gap-3">
        <StatCard icon={CalendarCheck} label="Attendance" value="96%" tone="success" hint="This month" />
        <StatCard icon={Wallet} label="Fees due" value="₹4,200" tone="warning" hint="Due 28 Jun" />
        <StatCard icon={BookOpen} label="Homework" value="3" tone="info" hint="2 pending" />
        <Link to="/bus" className="block">
          <StatCard icon={Bus} label="Bus ETA" value="8 min" tone="primary" hint="Route 12 · live" />
        </Link>
      </section>

      {/* AI nudge */}
      <Link to="/ai" className="mt-5 block rounded-2xl bg-primary text-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[15px]">Ask SchoolConnect AI</p>
            <p className="text-xs text-white/80 mt-0.5">"How is Aarav doing this week?"</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </div>
      </Link>

      {/* Activity feed */}
      <h2 className="mt-6 mb-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Recent</h2>
      <ul className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
        <FeedItem
          icon={Megaphone} tone="text-secondary"
          title="Annual Sports Day on 5 July"
          meta="Circular · 12 min ago"
          badge={{ label: "New", tone: "bg-secondary/10 text-secondary" }}
        />
        <FeedItem
          icon={BookOpen} tone="text-info"
          title="Math: Complete exercise 4.2"
          meta="Homework · Due tomorrow"
          badge={{ label: "Pending", tone: "bg-warning/15 text-warning" }}
        />
        <FeedItem
          icon={CheckCircle2} tone="text-success"
          title="Science project submitted"
          meta="Approved by Ms. Kapoor · Yesterday"
        />
        <FeedItem
          icon={AlertCircle} tone="text-warning"
          title="Term fee reminder"
          meta="₹4,200 due on 28 Jun"
        />
      </ul>
    </PhoneShell>
  );
}

function StatCard({ icon: Icon, label, value, tone, hint }: { icon: any; label: string; value: string; tone: "success"|"warning"|"info"|"primary"; hint: string }) {
  const toneMap = {
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
    primary: "text-primary",
  };
  return (
    <div className="rounded-2xl bg-surface border border-border p-3.5">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${toneMap[tone]}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-xl font-semibold leading-tight tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}

function FeedItem({ icon: Icon, tone, title, meta, badge }: { icon: any; tone: string; title: string; meta: string; badge?: { label: string; tone: string } }) {
  return (
    <li className="p-3.5 flex items-center gap-3">
      <Icon className={`h-[18px] w-[18px] shrink-0 ${tone}`} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{meta}</p>
      </div>
      {badge && <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${badge.tone}`}>{badge.label}</span>}
    </li>
  );
}
