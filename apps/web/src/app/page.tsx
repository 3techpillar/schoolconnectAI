"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth, ROLE_LABEL, isSchoolAdmin, isSuperAdmin } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { useStudentEngage } from "@/lib/providers/student-engage";
import { useTeacherClass } from "@/lib/providers/teacher-class";
import { useAdminData } from "@/lib/providers/admin-data";
import { useBusTrack } from "@/lib/providers/bus-track";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { apiFetch } from "@/lib/shared/api-client";
import { isFamilyRole } from "@/lib/shared/roles";
import {
  usesGuardianFamilySurface,
  usesStudentFamilySurface,
} from "@schoolconnect/shared";
import { needsSchoolAssignment } from "@/lib/providers/enrollment";
import { AppIcon, type AppIconTone, type IconComp } from "@/components/shell/AppIcon";
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
  FileText,
  Bell,
} from "@/components/shell/Icons";

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
    if (ready && user && needsSchoolAssignment(user, backend)) {
      router.replace("/pending");
    }
  }, [ready, user, backend, router]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;

    if (!backend || !user?.schoolId) {
      setAttendance({ label: "—", hint: !user?.schoolId ? "No school" : "Offline" });
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
  }, [ready, user?.id, user?.schoolId, backend]);

  if (!user || !schoolReady || !homeExtraReady) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Loading your day…" splash />
      </div>
    );
  }

  if (needsSchoolAssignment(user, backend)) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening…" splash />
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
        <LoadingBlock label="Loading your day…" splash />
      </div>
    );
  }

  const isFamily = isFamilyRole(user.role);
  const studentSurface = usesStudentFamilySurface(user);
  const guardianSurface = usesGuardianFamilySurface(user);
  const isTeacher = canPostAsTeacher(user);
  const isAdmin = isSchoolAdmin(user);
  const showFees = Boolean(user.capabilities?.fees);
  const showBus = user.capabilities?.bus !== false;
  const showCirculars = user.capabilities?.circulars !== false;
  const showAttendance = user.capabilities?.attendance !== false;
  const showNotifications = user.capabilities?.notifications !== false;
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
    ? guardianSurface
      ? "Attendance · report · progress"
      : `Level ${engage.level} · ${engage.streak}-day streak`
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
              ? studentSurface
                ? "/engage"
                : "/attendance"
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
              { icon: ShieldCheck, label: "Admin", href: "/admin", tone: "slate" as const },
              { icon: GraduationCap, label: "Promote", href: "/admin", tone: "orange" as const },
              { icon: Megaphone, label: "Notice", href: "/circulars", tone: "blue" as const },
              ...(showFees
                ? [{ icon: Wallet, label: "Fees", href: "/fees", tone: "green" as const }]
                : []),
            ].map(({ icon, label, href, tone }) => (
              <Link key={label} href={href} className="quick-btn">
                <AppIcon icon={icon} tone={tone} size={18} />
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
              { icon: GraduationCap, label: "Class", href: "/class", tone: "orange" as const },
              { icon: CalendarCheck, label: "Attend", href: "/attendance", tone: "green" as const },
              { icon: BookOpen, label: "Homework", href: "/homework", tone: "blue" as const },
              { icon: Megaphone, label: "Announce", href: "/circulars", tone: "teal" as const },
            ].map(({ icon, label, href, tone }) => (
              <Link key={label} href={href} className="quick-btn">
                <AppIcon icon={icon} tone={tone} size={18} />
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
          {studentSurface ? (
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
                  <span>{engage.streak}d</span>
                </div>
              </div>
            </Link>
          ) : (
            <section className="list-hero list-hero-blue mt-4">
              <p className="list-hero-kicker">Parent view</p>
              <h2 className="list-hero-title">
                {user.childName?.split(" ")[0] || "Your child"}&apos;s school day
              </h2>
              <p className="list-hero-body">
                Same tools as your child — attendance, report and progress stay on top.
              </p>
            </section>
          )}

          {guardianSurface ? (
            <section className="trust-highlights">
              {[
                {
                  href: "/attendance",
                  icon: CalendarCheck,
                  label: "Attendance",
                  value: attendance.label,
                  hint: attendance.hint,
                  tone: "green" as const,
                },
                {
                  href: "/report",
                  icon: FileText,
                  label: "Report",
                  value: user.classHistory?.[0]?.result
                    ? user.classHistory[0].result === "pending"
                      ? "In term"
                      : user.classHistory[0].result
                    : "View",
                  hint: user.classHistory?.[0]?.sessionLabel || "This year",
                  tone: "blue" as const,
                },
                {
                  href: "/engage",
                  icon: Sparkles,
                  label: "Progress",
                  value: `Lv ${engage.level}`,
                  hint: `${engage.xp} XP · ${engage.streak}-day streak`,
                  tone: "yellow" as const,
                },
              ].map((item) => (
                <Link key={item.label} href={item.href} className={`trust-card tone-${item.tone}`}>
                  <AppIcon icon={item.icon} tone={item.tone} size={18} />
                  <p className="text-11 muted" style={{ margin: "8px 0 0" }}>
                    {item.label}
                  </p>
                  <p className="trust-card-value">{item.value}</p>
                  <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                    {item.hint}
                  </p>
                </Link>
              ))}
            </section>
          ) : null}

          {showBus ? (
            <Link href="/bus" className="bus-home-card mt-4">
              <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p className="text-11" style={{ margin: 0, opacity: 0.85 }}>
                    Live bus tracking
                  </p>
                  <p className="font-semibold text-15" style={{ margin: "4px 0 0" }}>
                    {bus.etaToHome} min to {bus.homeStop.shortName}
                  </p>
                  <p className="text-11" style={{ margin: "4px 0 0", opacity: 0.9 }}>
                    {bus.stopsBetween} stop{bus.stopsBetween === 1 ? "" : "s"} away · open map
                  </p>
                </div>
                <AppIcon icon={Bus} tone="blue" size={22} />
              </div>
            </Link>
          ) : null}

          <section className="quick-grid">
            {(
              [
                ...(showBus
                  ? [{ icon: Bus, label: "Bus", href: "/bus", tone: "blue" as const }]
                  : []),
                ...(showCirculars
                  ? [{ icon: Megaphone, label: "Notices", href: "/circulars", tone: "orange" as const }]
                  : []),
                ...(showAttendance
                  ? [{ icon: CalendarCheck, label: "Attend", href: "/attendance", tone: "green" as const }]
                  : []),
                ...(showNotifications
                  ? [{ icon: Bell, label: "Alerts", href: "/notifications", tone: "slate" as const }]
                  : []),
                ...(showFees
                  ? [{ icon: Wallet, label: "Fees", href: "/fees", tone: "green" as const }]
                  : []),
                { icon: FileText, label: "Report", href: "/report", tone: "teal" as const },
              ] as const
            ).map(({ icon, label, href, tone }) => (
              <Link key={label} href={href} className="quick-btn">
                <AppIcon icon={icon} tone={tone} size={18} />
                <span className="text-11 font-medium">{label}</span>
              </Link>
            ))}
          </section>

          <h2 className="section-label">
            {studentSurface ? "Your day" : "Today at a glance"}
          </h2>
          <section className="stats-grid">
            {guardianSurface ? null : (
              <Link href="/attendance">
                <StatCard
                  icon={CalendarCheck}
                  label="Attendance"
                  value={attendance.label}
                  tone="tone-success"
                  hint={attendance.hint}
                />
              </Link>
            )}
            {studentSurface ? (
              <Link href="/report">
                <StatCard
                  icon={FileText}
                  label="Report"
                  value={
                    user.classHistory?.[0]?.result === "pending"
                      ? "In term"
                      : user.classHistory?.[0]?.result || "View"
                  }
                  tone="tone-info"
                  hint={user.classHistory?.[0]?.sessionLabel || "Academic snapshot"}
                />
              </Link>
            ) : null}
            {showFees ? (
              <Link href="/fees">
                <StatCard
                  icon={Wallet}
                  label="Fees due"
                  value={feesDue.amount}
                  tone="tone-warning"
                  hint={feesDue.hint}
                />
              </Link>
            ) : null}
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
        {isFamily && showFees && (
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

function toneFromClass(tone: string): AppIconTone {
  if (tone.includes("success") || tone.includes("green")) return "green";
  if (tone.includes("warning") || tone.includes("amber") || tone.includes("orange"))
    return "orange";
  if (tone.includes("secondary") || tone.includes("teal")) return "teal";
  if (tone.includes("reward") || tone.includes("yellow")) return "yellow";
  if (tone.includes("destructive") || tone.includes("danger")) return "orange";
  if (tone.includes("slate")) return "slate";
  if (tone.includes("whatsapp")) return "teal";
  return "blue";
}

function StatCard({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: IconComp;
  label: string;
  value: string;
  tone: string;
  hint: string;
}) {
  return (
    <div className="stat-card">
      <div className="row" style={{ gap: "0.5rem" }}>
        <AppIcon icon={icon} tone={toneFromClass(tone)} size={16} />
        <p className="text-xs muted">{label}</p>
      </div>
      <p className="stat-value">{value}</p>
      <p className="text-11 muted mt-1">{hint}</p>
    </div>
  );
}

function FeedItem({
  icon,
  tone,
  title,
  meta,
  badge,
  href,
}: {
  icon: IconComp;
  tone: string;
  title: string;
  meta: string;
  badge?: { label: string; className: string };
  href?: string;
}) {
  const content = (
    <>
      <AppIcon icon={icon} tone={toneFromClass(tone)} size={18} />
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
