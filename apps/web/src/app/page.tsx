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
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  ShieldCheck,
} from "@/components/shell/Icons";
import Image from "next/image";
import { AdventureWorldView } from "@/components/student/AdventureWorldView";
import { MascotCompanion } from "@/components/student/MascotCompanion";
import { AskBuddyModal } from "@/components/student/AskBuddyModal";

export default function HomePage() {
  const { user, ready, backend } = useAuth();
  const router = useRouter();
  const engage = useStudentEngage();
  const { canPostAsTeacher, homework, unreadChats } = useSchoolData();
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
  const [viewMode, setViewMode] = useState<"auto" | "adventure" | "desk">("auto");
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [, setHomeExtraReady] = useState(false);

  const triggerReward = (pts: number, msg: string) => {
    engage.awardXp?.(pts, msg);
    setRewardToast(`✨ +${pts} XP! ${msg}`);
    setTimeout(() => setRewardToast(null), 3200);
  };

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

  if (!ready || !user) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening EduWorld…" splash />
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

  const isFamily = isFamilyRole(user.role);
  const studentSurface = usesStudentFamilySurface(user);
  const guardianSurface = usesGuardianFamilySurface(user);
  const isTeacher = canPostAsTeacher(user);
  const isAdmin = isSchoolAdmin(user);
  const showFees = Boolean(user.capabilities?.fees);
  const showBus = user.capabilities?.bus !== false;
  const showCirculars = user.capabilities?.circulars !== false;
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
  const pendingHw = homework.filter(
    (h) => h.status === "pending" || h.status === "in-progress",
  ).length;
  const hwLabel = backend ? hwStats.label : String(homework.length);
  const unmarked =
    teacherClass.roster.length - teacherClass.markedCount;

  const isStudentUser = Boolean(studentSurface || user?.role === "student");
  const showAdventure = isStudentUser && viewMode === "adventure";

  if (showAdventure && user) {
    return (
      <AdventureWorldView
        studentName={firstName}
        className={user.className || "Class 6-B"}
        initialXp={engage.xp || 1250}
        initialStreak={engage.streak || 7}
        initialLevel={engage.level || 7}
        onSwitchToParentDesk={() => setViewMode("desk")}
      />
    );
  }

  return (
    <PhoneShell subtitle={subtitle} title={title}>
      <section className="home-hero-card">
        {/* Switch to Adventure Mode Banner - visible only for Student View */}
        {isStudentUser && (
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setViewMode("adventure")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.65rem 0.95rem",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: "0 6px 18px -4px rgba(99, 102, 241, 0.4)",
              }}
            >
              <span>🎮 Student Adventure World (Preview)</span>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem" }}>
                Explore 🚀
              </span>
            </button>
          </div>
        )}

        <div className="row" style={{ alignItems: "center" }}>
          <div className="avatar" style={{ width: 52, height: 52, borderRadius: 16, fontSize: 18, fontWeight: 800 }}>
            {initial}
          </div>
          <div className="grow">
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <p className="font-semibold text-15 truncate" style={{ margin: 0 }}>
                {displayName}
              </p>
              <span className="home-beacon-live">
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            <p className="text-xs muted truncate" style={{ margin: "2px 0 0" }}>
              {metaLine || ROLE_LABEL[user.role]}
            </p>
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
            aria-label="Open profile or quick action"
            style={{ width: 40, height: 40, flexShrink: 0 }}
          >
            <ArrowRight size={16} />
          </Link>
        </div>

        {user.role === "parent" && (
          <div className="sibling-switcher-dock">
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-fg)", textTransform: "uppercase" }}>
              Viewing:
            </span>
            <span className="sibling-pill active">
              🎓 {user.childName || "Primary Student"} (Class {user.className || "6-B"})
            </span>
            <Link href="/profile" className="sibling-pill" title="Manage student links">
              + Switch child
            </Link>
          </div>
        )}
      </section>

      {isFamily && (
        <>
          {/* Gamified Status Bar (Streaks, XP, Level) */}
          <div className="pwa-game-stats-row mt-2">
            <div className="game-pill streak-pill-glow" title="Daily streak">
              <span className="streak-flame">🔥</span>
              <span className="pill-text font-bold">{engage.streak || 7}d Streak</span>
            </div>
            <div className="game-pill xp-pill-glow" title="Total Experience Points">
              <span className="xp-star">⭐</span>
              <span className="pill-text font-bold">{(engage.xp || 1250).toLocaleString()} XP</span>
            </div>
            <div className="game-pill level-pill-glow" title="Level Progress">
              <span className="level-badge">Lv {engage.level || 7}</span>
              <div className="mini-progress-track">
                <div
                  className="mini-progress-fill"
                  style={{ width: `${engage.levelProgress || 65}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3D Student Hero Banner Card */}
          <section className="student-home-hero-card">
            <div className="student-home-banner-wrap">
              <Image
                src="/assets/home/student_hero.jpg"
                alt="SchoolConnect Student Learning Adventure"
                width={640}
                height={360}
                priority
                className="student-home-banner-img"
              />
              <div className="student-home-banner-gradient">
                <span className="student-hero-tag">✨ STUDENT LEARNING HUB</span>
                <h2 className="student-hero-greeting">
                  Ready for today, {focusName.split(" ")[0]}? 🚀
                </h2>
                <p className="student-hero-subtitle">
                  {pendingHw > 0
                    ? `${pendingHw} homework quest${pendingHw > 1 ? "s" : ""} waiting · keep the flame alive!`
                    : "All missions up to date · earn extra XP today!"}
                </p>
              </div>
            </div>
          </section>
        </>
      )}

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
          {/* Interactive Mascot Companion */}
          <div className="mt-3">
            <MascotCompanion
              studentName={focusName.split(" ")[0]}
              streak={engage.streak || 7}
              xp={engage.xp || 1250}
              level={engage.level || 7}
              onOpenBuddyChat={() => setIsBuddyOpen(true)}
            />
          </div>

          {/* 3D Cartoon Quick Actions Header */}
          <div className="section-title-row mt-4" style={{ marginBottom: 4 }}>
            <h3 className="pwa-section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Student Hub 🚀
            </h3>
            <span className="pwa-section-kicker">3D Quick Access</span>
          </div>

          {/* 3D Action Cards Grid */}
          <div className="student-3d-grid">
            {/* Homework Quests */}
            <Link href="/homework" className="student-action-card">
              <div className="student-card-top">
                <div className="student-icon-3d-wrap">
                  <Image
                    src="/assets/icons/icon_homework_3d.jpg"
                    alt="Homework Quests"
                    width={52}
                    height={52}
                    className="student-icon-3d-img"
                  />
                </div>
                <span className="student-card-badge badge-amber">
                  {pendingHw > 0 ? `${pendingHw} Due` : "All Done ✓"}
                </span>
              </div>
              <div>
                <h4 className="student-card-title">Homework</h4>
                <p className="student-card-desc">
                  <span>{hwLabel} to solve</span>
                  <span className="student-card-arrow">→</span>
                </p>
              </div>
            </Link>

            {/* Bus Tracker */}
            {showBus && (
              <Link href="/bus" className="student-action-card">
                <div className="student-card-top">
                  <div className="student-icon-3d-wrap">
                    <Image
                      src="/assets/icons/icon_bus_3d.jpg"
                      alt="School Bus Radar"
                      width={52}
                      height={52}
                      className="student-icon-3d-img"
                    />
                  </div>
                  <span className="student-card-badge badge-green">
                    {bus.etaToHome}m ETA
                  </span>
                </div>
                <div>
                  <h4 className="student-card-title">Bus Radar</h4>
                  <p className="student-card-desc">
                    <span>{bus.stopsBetween} stops away</span>
                    <span className="student-card-arrow">→</span>
                  </p>
                </div>
              </Link>
            )}

            {/* Daily Attendance */}
            <Link href="/attendance" className="student-action-card">
              <div className="student-card-top">
                <div className="student-icon-3d-wrap">
                  <Image
                    src="/assets/icons/icon_attendance_3d.jpg"
                    alt="Daily Attendance"
                    width={52}
                    height={52}
                    className="student-icon-3d-img"
                  />
                </div>
                <span className="student-card-badge badge-blue">
                  {attendance.label !== "—" ? attendance.label : "Present"}
                </span>
              </div>
              <div>
                <h4 className="student-card-title">Attendance</h4>
                <p className="student-card-desc">
                  <span>{attendance.hint}</span>
                  <span className="student-card-arrow">→</span>
                </p>
              </div>
            </Link>

            {/* Ask AI Study Buddy */}
            <div
              className="student-action-card"
              onClick={() => setIsBuddyOpen(true)}
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
            >
              <div className="student-card-top">
                <div className="student-icon-3d-wrap">
                  <Image
                    src="/assets/icons/icon_ai_buddy_3d.jpg"
                    alt="AI Study Buddy"
                    width={52}
                    height={52}
                    className="student-icon-3d-img"
                  />
                </div>
                <span className="student-card-badge badge-purple">
                  Instant ✨
                </span>
              </div>
              <div>
                <h4 className="student-card-title">AI Study Pal</h4>
                <p className="student-card-desc">
                  <span>Solve doubts 24/7</span>
                  <span className="student-card-arrow">→</span>
                </p>
              </div>
            </div>

            {/* Circulars & Notices */}
            {showCirculars && (
              <Link href="/circulars" className="student-action-card">
                <div className="student-card-top">
                  <div className="student-icon-3d-wrap">
                    <Image
                      src="/assets/icons/icon_notice_3d.jpg"
                      alt="Notice Board"
                      width={52}
                      height={52}
                      className="student-icon-3d-img"
                    />
                  </div>
                  <span className="student-card-badge badge-coral">
                    Circulars
                  </span>
                </div>
                <div>
                  <h4 className="student-card-title">Notices</h4>
                  <p className="student-card-desc">
                    <span>Events & updates</span>
                    <span className="student-card-arrow">→</span>
                  </p>
                </div>
              </Link>
            )}

            {/* Report Card */}
            <Link href="/report" className="student-action-card">
              <div className="student-card-top">
                <div className="student-icon-3d-wrap">
                  <Image
                    src="/assets/icons/icon_report_3d.jpg"
                    alt="Report Card"
                    width={52}
                    height={52}
                    className="student-icon-3d-img"
                  />
                </div>
                <span className="student-card-badge badge-purple">
                  {user.classHistory?.[0]?.result || "Term 1"}
                </span>
              </div>
              <div>
                <h4 className="student-card-title">Report Card</h4>
                <p className="student-card-desc">
                  <span>Scores & progress</span>
                  <span className="student-card-arrow">→</span>
                </p>
              </div>
            </Link>
          </div>

          {/* Today's Quests & Homework Missions */}
          <div className="student-home-quests-card">
            <div className="student-quests-header">
              <h3 className="student-quests-title">
                Today&apos;s Quests 🎯
              </h3>
              <span className="student-quests-pill">
                {engage.missions.filter((m) => m.done).length}/{engage.missions.length} Done
              </span>
            </div>
            <ul className="missions-checklist">
              {engage.missions.map((m) => (
                <li
                  key={m.id}
                  className={`mission-item ${m.done ? "completed" : ""}`}
                  onClick={() => {
                    if (!m.done) {
                      engage.completeMission(m.id);
                      triggerReward(m.xp, `Quest Completed: ${m.title}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`mission-checkbox ${m.done ? "checked" : ""}`}>
                    {m.done ? "✓" : ""}
                  </div>
                  <div className="mission-content">
                    <p className="mission-title">{m.title}</p>
                    <p className="mission-hint">{m.hint}</p>
                  </div>
                  <span className={`mission-reward-badge ${m.done ? "claimed" : ""}`}>
                    +{m.xp} XP
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Adventure Learning World Banner */}
          <Link href="/engage" className="adventure-portal-banner">
            <div className="adventure-portal-icon">
              🏰
            </div>
            <div className="adventure-portal-body">
              <span className="adventure-portal-tag">🎮 GAMIFIED LEARNING</span>
              <h3 className="adventure-portal-title">Enter Subject Kingdoms</h3>
              <p className="adventure-portal-desc">
                Math, Science, English, Tech & Badges Showcase
              </p>
            </div>
            <div className="adventure-portal-btn">
              Play Zone →
            </div>
          </Link>

          {/* Ask Buddy Instant Card */}
          <div
            className="buddy-instant-card"
            onClick={() => setIsBuddyOpen(true)}
            role="button"
            tabIndex={0}
          >
            <div className="buddy-instant-avatar">
              <Image
                src="/assets/icons/icon_ai_buddy_3d.jpg"
                alt="AI Study Buddy"
                width={52}
                height={52}
                className="rounded-full"
              />
            </div>
            <div className="buddy-instant-body">
              <h4 className="buddy-instant-title">
                Stuck on a problem? 💡
              </h4>
              <p className="buddy-instant-desc">
                Ask Buddy AI for instant step-by-step help and earn +20 XP!
              </p>
            </div>
            <div className="buddy-instant-cta">
              Ask AI
            </div>
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

      {/* Toast Alert */}
      {rewardToast && (
        <div className="adventure-xp-toast" role="status">
          <span>{rewardToast}</span>
        </div>
      )}

      {/* Ask Buddy AI Modal Drawer */}
      <AskBuddyModal
        isOpen={isBuddyOpen}
        onClose={() => setIsBuddyOpen(false)}
        studentName={focusName.split(" ")[0]}
        onRewardXp={(pts) => triggerReward(pts, "Buddy AI Doubts Solved!")}
      />
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
  const borderTone = tone.includes("warning") || tone.includes("amber") || tone.includes("orange")
    ? "orange"
    : tone.includes("success") || tone.includes("green")
      ? "green"
      : "";

  const iconBg = borderTone === "orange"
    ? "var(--accent-soft)"
    : borderTone === "green"
      ? "var(--success-soft)"
      : "var(--info-soft)";

  const content = (
    <div className={`feed-item ${borderTone}`}>
      <div className="feed-icon" style={{ background: iconBg }}>
        <AppIcon icon={icon} tone={toneFromClass(tone)} size={18} />
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        <p className="feed-title truncate" style={{ margin: 0 }}>{title}</p>
        <p className="feed-sub truncate" style={{ margin: "2px 0 0" }}>{meta}</p>
      </div>
      {badge && <span className={badge.className}>{badge.label}</span>}
      <ArrowRight size={14} className="feed-time" style={{ opacity: 0.6 }} />
    </div>
  );

  return (
    <li style={{ listStyle: "none", marginBottom: 8 }}>
      {href ? (
        <Link href={href} style={{ textDecoration: "none" }}>
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
