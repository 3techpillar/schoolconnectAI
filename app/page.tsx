"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import {
  BookOpen,
  CalendarCheck,
  Wallet,
  Megaphone,
  Bus,
  Phone,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "@/components/Icons";

export default function HomePage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/auth");
  }, [ready, user, router]);

  if (!user) return <div className="app-shell" />;

  const firstName = user.name.split(" ")[0] ?? "there";
  const displayName = user.childName ?? user.name ?? "";
  const initial = (displayName || "?").charAt(0).toUpperCase();
  const subtitle = user.childName
    ? `Hi, ${firstName}`
    : `Signed in as ${ROLE_LABEL[user.role]}`;
  const title = user.childName
    ? `${user.childName.split(" ")[0]}'s day`
    : `Welcome, ${firstName}`;
  const metaLine = [user.school, user.className && `Class ${user.className}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <PhoneShell subtitle={subtitle} title={title}>
      <section className="card card-pad row">
        <div className="avatar">{initial}</div>
        <div className="grow">
          <p className="font-semibold text-15 truncate">{displayName}</p>
          <p className="text-xs muted truncate">
            {metaLine || ROLE_LABEL[user.role]}
          </p>
          <div className="status-live mt-1">
            {ROLE_LABEL[user.role]} · Active
          </div>
        </div>
        <Link href="/attendance" className="icon-btn muted" aria-label="Attendance">
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="quick-grid">
        {[
          { icon: Phone, label: "Call" },
          { icon: MessageCircle, label: "Message" },
          { icon: Wallet, label: "Pay" },
          { icon: BookOpen, label: "Homework" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="quick-btn">
            <Icon size={18} />
            <span className="text-11 font-medium">{label}</span>
          </button>
        ))}
      </section>

      <h2 className="section-label">Today</h2>
      <section className="stats-grid">
        <StatCard icon={CalendarCheck} label="Attendance" value="96%" tone="tone-success" hint="This month" />
        <StatCard icon={Wallet} label="Fees due" value="₹4,200" tone="tone-warning" hint="Due 28 Jun" />
        <StatCard icon={BookOpen} label="Homework" value="3" tone="tone-info" hint="2 pending" />
        <Link href="/bus">
          <StatCard icon={Bus} label="Bus ETA" value="8 min" tone="tone-primary" hint="Route 12 · live" />
        </Link>
      </section>

      <Link href="/ai" className="ai-banner">
        <div className="ai-banner-inner">
          <div className="ai-icon">
            <Sparkles size={20} />
          </div>
          <div className="grow">
            <p className="font-semibold text-15">Ask SchoolConnect AI</p>
            <p className="text-xs" style={{ opacity: 0.8, marginTop: 2 }}>
              &quot;How is Aarav doing this week?&quot;
            </p>
          </div>
          <ArrowRight size={20} />
        </div>
      </Link>

      <h2 className="section-label">Recent</h2>
      <ul className="feed">
        <FeedItem
          icon={Megaphone}
          tone="tone-secondary"
          title="Annual Sports Day on 5 July"
          meta="Circular · 12 min ago"
          badge={{ label: "New", className: "badge badge-secondary" }}
        />
        <FeedItem
          icon={BookOpen}
          tone="tone-info"
          title="Math: Complete exercise 4.2"
          meta="Homework · Due tomorrow"
          badge={{ label: "Pending", className: "badge badge-warning" }}
        />
        <FeedItem
          icon={CheckCircle2}
          tone="tone-success"
          title="Science project submitted"
          meta="Approved by Ms. Kapoor · Yesterday"
        />
        <FeedItem
          icon={AlertCircle}
          tone="tone-warning"
          title="Term fee reminder"
          meta="₹4,200 due on 28 Jun"
        />
      </ul>
    </PhoneShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: (p: { size?: number }) => React.ReactNode;
  label: string;
  value: string;
  tone: string;
  hint: string;
}) {
  return (
    <div className="stat-card">
      <div className="row" style={{ gap: "0.5rem" }}>
        <span className={tone}>
          <Icon size={16} />
        </span>
        <p className="text-xs muted">{label}</p>
      </div>
      <p className="stat-value">{value}</p>
      <p className="text-11 muted mt-1">{hint}</p>
    </div>
  );
}

function FeedItem({
  icon: Icon,
  tone,
  title,
  meta,
  badge,
}: {
  icon: (p: { size?: number }) => React.ReactNode;
  tone: string;
  title: string;
  meta: string;
  badge?: { label: string; className: string };
}) {
  return (
    <li>
      <span className={tone}>
        <Icon size={18} />
      </span>
      <div className="grow">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-11 muted mt-1">{meta}</p>
      </div>
      {badge && <span className={badge.className}>{badge.label}</span>}
    </li>
  );
}
