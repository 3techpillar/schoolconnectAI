"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth, ROLE_LABEL, isSchoolAdmin, isSuperAdmin } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { useStudentEngage } from "@/lib/providers/student-engage";
import { useTeacherClass } from "@/lib/providers/teacher-class";
import { useAdminData } from "@/lib/providers/admin-data";
import { useBusTrack } from "@/lib/providers/bus-track";
import { EmptyState, LoadingBlock } from "@/components/StatusUI";
import { apiFetch } from "@/lib/shared/api-client";
import { isFamilyRole } from "@/lib/shared/roles";
import {
  BookOpen,
  CalendarCheck,
  Wallet,
  Megaphone,
  Bus,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  ShieldCheck,
} from "@/components/Icons";

export default function HomePage() {
  const { user, ready, backend } = useAuth();
  const router = useRouter();
  const engage = useStudentEngage();
  const { canPostAsTeacher, homework, unreadChats, ready: schoolReady } =
    useSchoolData();
  const teacherClass = useTeacherClass();
  const admin = useAdminData();
  const bus = useBusTrack();
  const [feesDue, setFeesDue] = useState({
    amount: "₹4,200",
    hint: "Due 28 Jun",
  });
  const [attendance, setAttendance] = useState({
    label: "—",
    hint: "This month",
  });
  const [feed, setFeed] = useState<
    Array<{
      id: string;
      kind: string;
      title: string;
      meta: string;
      href: string;
      tone: string;
      badge?: { label: string; className: string };
    }>
  >([]);
  const [hwStats, setHwStats] = useState({ label: "0", hint: "—" });
  const [homeExtraReady, setHomeExtraReady] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;

    if (!backend) {
      setAttendance({ label: "—", hint: "Offline" });
      setFeed([]);
      setHomeExtraReady(true);
      return;
    }

    (async () => {
      try {
        const [feesRes, attRes, feedRes] = await Promise.all([
          apiFetch<{
            fees: { outstanding: string; dueDateLabel: string };
          }>("/api/fees").catch(() => null),
          apiFetch<{
            attendance: { label: string; hint: string };
          }>("/api/attendance/summary").catch(() => null),
          apiFetch<{
            feed: Array<{
              id: string;
              kind: string;
              title: string;
              meta: string;
              href: string;
              tone: string;
              badge?: { label: string; className: string };
            }>;
            homework: { label: string; hint: string };
          }>("/api/feed").catch(() => null),
        ]);
        if (cancelled) return;
        if (feesRes?.fees) {
          const label = feesRes.fees.dueDateLabel || "";
          setFeesDue({
            amount: feesRes.fees.outstanding,
            hint: label.startsWith("Due")
              ? label
              : `Due ${label.replace(/^Overdue ·\s*/i, "")}`,
          });
        }
        if (attRes?.attendance) {
          setAttendance({
            label: attRes.attendance.label,
            hint: attRes.attendance.hint,
          });
        }
        if (feedRes) {
          setFeed(feedRes.feed || []);
          if (feedRes.homework) setHwStats(feedRes.homework);
        }
      } finally {
        if (!cancelled) setHomeExtraReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, backend]);

  if (!user || !schoolReady || !homeExtraReady) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Loading home…" />
      </div>
    );
  }

  // Only wait on role-relevant providers.
  if (
    (isFamilyRole(user.role) && !engage.ready) ||
    (canPostAsTeacher(user) && !teacherClass.ready) ||
    (isSchoolAdmin(user) && !admin.ready)
  ) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Loading home…" />
      </div>
    );
  }

  const isFamily = isFamilyRole(user.role);
  const isTeacher = canPostAsTeacher(user);
  const isAdmin = isSchoolAdmin(user);
  const superMode = isSuperAdmin(user);
  const firstName = user.name.split(" ")[0] ?? "there";
  const focusName =
    user.role === "parent"
      ? user.childName || user.name
      : user.name;
  const displayName = isTeacher
    ? user.name
    : isAdmin
      ? user.name
      : focusName;
  const initial = (displayName || "?").charAt(0).toUpperCase();
  const subtitle = isFamily
    ? `Level ${engage.level} · ${engage.streak}-day streak`
    : isAdmin
      ? `${superMode ? "Super Admin" : "School Admin"} · ${admin.activeSession?.label || "AY"}`
      : isTeacher
        ? `Class ${user.className || "6-B"} · Teacher desk`
        : `Signed in as ${ROLE_LABEL[user.role]}`;
  const title = isFamily
    ? user.role === "parent" && user.childName
      ? `${user.childName.split(" ")[0]}'s day`
      : `Hey ${firstName}!`
    : isAdmin
      ? `Admin, ${firstName}`
      : isTeacher
        ? `Good day, ${firstName}`
        : `Welcome, ${firstName}`;
  const metaLine = [user.school, user.className && `Class ${user.className}`]
    .filter(Boolean)
    .join(" · ");
  const missionsLeft = engage.missions.filter((m) => !m.done).length;
  const pendingHw = homework.filter(
    (h) => h.status === "pending" || h.status === "in-progress",
  ).length;
  const hwLabel = backend ? hwStats.label : String(homework.length);
  const hwHint = backend
    ? hwStats.hint
    : pendingHw
      ? `${pendingHw} pending`
      : "All clear";
  const unmarked =
    teacherClass.roster.length - teacherClass.markedCount;

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
        <Link
          href={
            isFamily
              ? "/engage"
              : isAdmin
                ? "/admin"
                : isTeacher
                  ? "/class"
                  : "/attendance"
          }
          className="icon-btn muted"
          aria-label="Open"
        >
          <ArrowRight size={16} />
        </Link>
      </section>

      {isAdmin && (
        <>
          <Link href="/admin" className="admin-hero mt-4" style={{ display: "block" }}>
            <p className="text-11" style={{ margin: 0, opacity: 0.85 }}>
              {superMode ? "Super Admin console" : "School Admin console"}
            </p>
            <p className="font-semibold text-15" style={{ margin: "4px 0 0" }}>
              Users · promotions · sessions
              {superMode ? " · schools" : ""}
            </p>
            <p className="text-11" style={{ margin: "4px 0 0", opacity: 0.9 }}>
              Role locked on signup · AY {admin.activeSession?.label || "—"}
            </p>
          </Link>

          <section className="quick-grid">
            {[
              { icon: ShieldCheck, label: "Admin", href: "/admin" },
              { icon: GraduationCap, label: "Promote", href: "/admin" },
              { icon: Megaphone, label: "Notice", href: "/circulars" },
              { icon: Wallet, label: "Fees", href: "/fees" },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} className="quick-btn">
                <Icon size={18} />
                <span className="text-11 font-medium">{label}</span>
              </Link>
            ))}
          </section>

          <section className="teacher-stats mt-3">
            <div className="teacher-stat">
              <p className="teacher-stat-value">{admin.schools.length}</p>
              <p className="text-11 muted">Schools</p>
            </div>
            <div className="teacher-stat">
              <p className="teacher-stat-value">{teacherClass.roster.length}</p>
              <p className="text-11 muted">Roster</p>
            </div>
            <div className="teacher-stat">
              <p className="teacher-stat-value">{admin.promotionLog.length}</p>
              <p className="text-11 muted">Promos</p>
            </div>
            <div className="teacher-stat">
              <p className="teacher-stat-value">{unreadChats}</p>
              <p className="text-11 muted">Chats</p>
            </div>
          </section>
        </>
      )}

      {isTeacher && (
        <>
          <Link href="/class" className="teacher-home-card mt-4">
            <p className="text-11" style={{ margin: 0, opacity: 0.85 }}>
              Teacher Class Desk
            </p>
            <p className="font-semibold text-15" style={{ margin: "4px 0 0" }}>
              {teacherClass.roster.length} students · {unmarked} unmarked today
            </p>
            <p className="text-11" style={{ margin: "4px 0 0", opacity: 0.9 }}>
              Post activity · mark attendance · message parents
            </p>
          </Link>

          <section className="quick-grid">
            {[
              { icon: GraduationCap, label: "Class", href: "/class" },
              { icon: CalendarCheck, label: "Attend", href: "/attendance" },
              { icon: BookOpen, label: "Homework", href: "/homework" },
              { icon: Megaphone, label: "Announce", href: "/circulars" },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} className="quick-btn">
                <Icon size={18} />
                <span className="text-11 font-medium">{label}</span>
              </Link>
            ))}
          </section>

          <h2 className="section-label">Today&apos;s teaching</h2>
          <section className="stats-grid">
            <Link href="/attendance">
              <StatCard
                icon={CalendarCheck}
                label="Unmarked"
                value={String(Math.max(0, unmarked))}
                tone="tone-warning"
                hint="Need attendance"
              />
            </Link>
            <Link href="/homework">
              <StatCard
                icon={BookOpen}
                label="Open HW"
                value={String(pendingHw)}
                tone="tone-info"
                hint="Pending / in progress"
              />
            </Link>
            <Link href="/chats">
              <StatCard
                icon={MessageCircle}
                label="Chats"
                value={String(unreadChats)}
                tone="tone-primary"
                hint="Unread threads"
              />
            </Link>
            <Link href="/circulars">
              <StatCard
                icon={Megaphone}
                label="Announce"
                value="+"
                tone="tone-secondary"
                hint="Post circular"
              />
            </Link>
          </section>

          <Link href="/chats/class-6b" className="ai-banner">
            <div className="ai-banner-inner">
              <div className="ai-icon">
                <MessageCircle size={20} />
              </div>
              <div className="grow">
                <p className="font-semibold text-15">Class 6-B chat</p>
                <p className="text-xs" style={{ opacity: 0.8, marginTop: 2 }}>
                  Post daily activity, homework & progress
                </p>
              </div>
              <ArrowRight size={20} />
            </div>
          </Link>
        </>
      )}

      {isFamily && (
        <>
          <Link href="/engage" className="engage-home-card mt-4">
            <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
              <div>
                <p className="text-11" style={{ margin: 0, opacity: 0.85 }}>
                  Learning Zone
                </p>
                <p className="font-semibold text-15" style={{ margin: "4px 0 0" }}>
                  {engage.xp} XP · Lv {engage.level}
                </p>
                <p className="text-11" style={{ margin: "4px 0 0", opacity: 0.9 }}>
                  {missionsLeft > 0
                    ? `${missionsLeft} missions waiting · tap to play`
                    : "All missions done — claim next challenge"}
                </p>
              </div>
              <div
                className="mini-xp-ring"
                style={{ ["--p" as string]: String(engage.levelProgress) }}
              >
                <span>🔥{engage.streak}</span>
              </div>
            </div>
          </Link>

          <section className="quick-grid">
            {[
              { icon: Sparkles, label: "Zone", href: "/engage" },
              { icon: MessageCircle, label: "Chats", href: "/chats" },
              { icon: BookOpen, label: "Homework", href: "/homework" },
              { icon: Wallet, label: "Fees", href: "/fees" },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} className="quick-btn">
                <Icon size={18} />
                <span className="text-11 font-medium">{label}</span>
              </Link>
            ))}
          </section>

          <h2 className="section-label">Your day</h2>
          <section className="stats-grid">
            <Link href="/attendance">
              <StatCard
                icon={CalendarCheck}
                label="Attendance"
                value={attendance.label}
                tone="tone-success"
                hint={attendance.hint}
              />
            </Link>
            <Link href="/fees">
              <StatCard
                icon={Wallet}
                label="Fees due"
                value={feesDue.amount}
                tone="tone-warning"
                hint={feesDue.hint}
              />
            </Link>
            <Link href="/homework">
              <StatCard
                icon={BookOpen}
                label="Homework"
                value={hwLabel}
                tone="tone-info"
                hint={hwHint}
              />
            </Link>
            <Link href="/bus">
              <StatCard
                icon={Bus}
                label="Bus ETA"
                value={`${bus.etaToHome} min`}
                tone="tone-primary"
                hint={`${bus.stopsBetween} stops · ${bus.homeStop.shortName}`}
              />
            </Link>
          </section>

          <div className="space-y" style={{ gap: 10, marginTop: 12 }}>
            <Link href="/engage" className="ai-banner" style={{ marginTop: 0 }}>
              <div className="ai-banner-inner">
                <div className="ai-icon">
                  <Sparkles size={20} />
                </div>
                <div className="grow">
                  <p className="font-semibold text-15">Open Learning Zone</p>
                  <p className="text-xs" style={{ opacity: 0.8, marginTop: 2 }}>
                    Streaks, badges, focus timer & challenges
                  </p>
                </div>
                <ArrowRight size={20} />
              </div>
            </Link>
            <Link href="/ai" className="ai-banner" style={{ marginTop: 0 }}>
              <div className="ai-banner-inner">
                <div className="ai-icon">
                  <Sparkles size={20} />
                </div>
                <div className="grow">
                  <p className="font-semibold text-15">Ask SchoolConnect AI</p>
                  <p className="text-xs" style={{ opacity: 0.8, marginTop: 2 }}>
                    Attendance, homework, fees & circulars
                  </p>
                </div>
                <ArrowRight size={20} />
              </div>
            </Link>
          </div>
        </>
      )}

      <h2 className="section-label">Recent</h2>
      <ul className="feed">
        {feed.map((item) => (
          <FeedItem
            key={item.id}
            href={item.href}
            icon={
              item.kind === "homework"
                ? BookOpen
                : item.kind === "circular"
                  ? Megaphone
                  : CheckCircle2
            }
            tone={item.tone}
            title={item.title}
            meta={item.meta}
            badge={item.badge}
          />
        ))}
        {isTeacher && (
          <FeedItem
            href="/class"
            icon={GraduationCap}
            tone="tone-primary"
            title="Mark remaining attendance"
            meta={`${Math.max(0, unmarked)} students unmarked today`}
            badge={{ label: "Action", className: "badge badge-warning" }}
          />
        )}
        {isAdmin && (
          <FeedItem
            href="/admin"
            icon={ShieldCheck}
            tone="tone-primary"
            title="Run annual promotions"
            meta={`Session ${admin.activeSession?.label || "—"} · Pass upgrades class`}
            badge={{ label: "Admin", className: "badge badge-secondary" }}
          />
        )}
        {isFamily && (
          <FeedItem
            href="/fees"
            icon={AlertCircle}
            tone="tone-warning"
            title="Term fee reminder"
            meta={`${feesDue.amount} due on ${feesDue.hint.replace(/^Due\s*/i, "")}`}
          />
        )}
        {isFamily && (
          <FeedItem
            href="/engage"
            icon={Sparkles}
            tone="tone-secondary"
            title="Weekly challenge: Reading Rocket"
            meta={`${engage.challenge.progress}/${engage.challenge.goal} actions done`}
            badge={{ label: "Play", className: "badge badge-secondary" }}
          />
        )}
        {!feed.length && !isTeacher && !isAdmin && !isFamily && (
          <li style={{ listStyle: "none" }}>
            <EmptyState
              title="No recent updates"
              body="Circulars and homework will show up here."
            />
          </li>
        )}
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
  href,
}: {
  icon: (p: { size?: number }) => React.ReactNode;
  tone: string;
  title: string;
  meta: string;
  badge?: { label: string; className: string };
  href?: string;
}) {
  const content = (
    <>
      <span className={tone}>
        <Icon size={18} />
      </span>
      <div className="grow">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-11 muted mt-1">{meta}</p>
      </div>
      {badge && <span className={badge.className}>{badge.label}</span>}
    </>
  );

  return (
    <li>
      {href ? (
        <Link href={href} className="row" style={{ color: "inherit", width: "100%" }}>
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
