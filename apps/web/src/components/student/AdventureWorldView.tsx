"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { MascotCompanion } from "./MascotCompanion";
import { AskBuddyModal } from "./AskBuddyModal";

interface AdventureWorldViewProps {
  studentName?: string;
  className?: string;
  initialXp?: number;
  initialStreak?: number;
  initialLevel?: number;
  wrapInPhoneShell?: boolean;
  onSwitchToParentDesk?: () => void;
}

interface SubjectWorld {
  id: string;
  title: string;
  category: string;
  progress: number;
  totalChapters: number;
  completedChapters: number;
  nextTopic: string;
  image: string;
  themeColor: string;
  badge: string;
  href: string;
}

const SUBJECT_WORLDS: SubjectWorld[] = [
  {
    id: "math",
    title: "Mathematics",
    category: "Numbers & Geometry",
    progress: 72,
    totalChapters: 12,
    completedChapters: 8,
    nextTopic: "Fractions & Angles Quest",
    image: "/assets/worlds/math_world.jpg",
    themeColor: "#8B5CF6",
    badge: "🧮 Math Kingdom",
    href: "/homework",
  },
  {
    id: "science",
    title: "Science Discovery",
    category: "Physics & Chemistry",
    progress: 64,
    totalChapters: 10,
    completedChapters: 6,
    nextTopic: "Chemical Reactions Lab",
    image: "/assets/worlds/science_world.jpg",
    themeColor: "#06B6D4",
    badge: "🔬 Science Lab",
    href: "/homework",
  },
  {
    id: "english",
    title: "English & Story",
    category: "Grammar & Tales",
    progress: 82,
    totalChapters: 14,
    completedChapters: 11,
    nextTopic: "The Secret Garden Chapter 4",
    image: "/assets/worlds/english_world.jpg",
    themeColor: "#F59E0B",
    badge: "📖 Story Realm",
    href: "/homework",
  },
  {
    id: "tech",
    title: "Coding & AI",
    category: "Robotics & Logic",
    progress: 45,
    totalChapters: 8,
    completedChapters: 3,
    nextTopic: "Python Loops & Mini-Bots",
    image: "/assets/worlds/tech_world.jpg",
    themeColor: "#10B981",
    badge: "💻 Cyber Academy",
    href: "/homework",
  },
];

interface Mission {
  id: string;
  title: string;
  hint: string;
  xp: number;
  done: boolean;
  subject: string;
}

const INITIAL_MISSIONS: Mission[] = [
  {
    id: "m-math",
    title: "Complete Math Quiz #4",
    hint: "5 quick questions on Fractions",
    xp: 50,
    done: false,
    subject: "math",
  },
  {
    id: "m-read",
    title: "Read English Chapter 4",
    hint: "Story comprehension + word puzzles",
    xp: 30,
    done: false,
    subject: "english",
  },
  {
    id: "m-focus",
    title: "5-min Focus Study Timer",
    hint: "Uninterrupted quiet revision",
    xp: 20,
    done: false,
    subject: "study",
  },
];

const LEADERBOARD = [
  { rank: 1, name: "Aarav Sharma", xp: 1250, streak: 7, avatar: "🦁", isMe: true },
  { rank: 2, name: "Diya Patel", xp: 1180, streak: 9, avatar: "🦄", isMe: false },
  { rank: 3, name: "Rohan Verma", xp: 1040, streak: 5, avatar: "🚀", isMe: false },
  { rank: 4, name: "Ananya Iyer", xp: 980, streak: 6, avatar: "🎨", isMe: false },
];

export function AdventureWorldView({
  studentName = "Aarav",
  className = "Class 6-B",
  initialXp = 1250,
  initialStreak = 7,
  initialLevel = 7,
  wrapInPhoneShell = true,
  onSwitchToParentDesk,
}: AdventureWorldViewProps) {
  const [xp, setXp] = useState(initialXp);
  const [streak, setStreak] = useState(initialStreak);
  const [level, setLevel] = useState(initialLevel);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Level progress calculations
  const xpIntoLevel = xp % 250;
  const xpForNextLevel = 250;
  const progressPercent = Math.round((xpIntoLevel / xpForNextLevel) * 100);

  const triggerReward = (addedXp: number, msg: string) => {
    setXp((prev) => prev + addedXp);
    setRewardToast(`✨ +${addedXp} XP! ${msg}`);
    setTimeout(() => setRewardToast(null), 3000);
  };

  const handleCompleteMission = (missionId: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId && !m.done) {
          triggerReward(m.xp, `Quest Completed: ${m.title}`);
          return { ...m, done: true };
        }
        return m;
      })
    );
  };

  const handleDailyCheckIn = () => {
    if (checkedInToday) return;
    setCheckedInToday(true);
    setStreak((s) => s + 1);
    triggerReward(15, "Daily Habit Streak +1 Day!");
  };

  const content = (
    <div className="pwa-adventure-container">
      {/* Toast Alert */}
      {rewardToast && (
        <div className="adventure-xp-toast" role="status">
          <span>{rewardToast}</span>
        </div>
      )}

      {/* Gamified Top Status Pills (PWA Mobile Friendly) */}
      <div className="pwa-game-stats-row">
        <div className="game-pill streak-pill-glow" title="Daily streak">
          <span className="streak-flame">🔥</span>
          <span className="pill-text font-bold">{streak}d Streak</span>
        </div>

        <div className="game-pill xp-pill-glow" title="Total Experience Points">
          <span className="xp-star">⭐</span>
          <span className="pill-text font-bold">{xp.toLocaleString()} XP</span>
        </div>

        <div className="game-pill level-pill-glow" title="Level Progress">
          <span className="level-badge">Lv {level}</span>
          <div className="mini-progress-track">
            <div
              className="mini-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mascot Companion Hero Card */}
      <div className="mt-3">
        <MascotCompanion
          studentName={studentName}
          streak={streak}
          xp={xp}
          level={level}
          onOpenBuddyChat={() => setIsBuddyOpen(true)}
        />
      </div>

      {/* Daily Streak Habit Check-In Card */}
      <div className="adventure-checkin-card mt-3">
        <div className="checkin-info">
          <h4 className="checkin-title">Daily Habit Check-In</h4>
          <p className="checkin-desc">Keep your flame blazing today!</p>
        </div>
        <button
          type="button"
          className={`checkin-btn ${checkedInToday ? "checked" : ""}`}
          onClick={handleDailyCheckIn}
          disabled={checkedInToday}
        >
          {checkedInToday ? "Checked In ✓" : "+15 XP Check-In"}
        </button>
      </div>

      {/* Today's Quests / Missions */}
      <div className="adventure-missions-card mt-3">
        <div className="missions-header">
          <h3 className="missions-heading">Today&apos;s Quests 🎯</h3>
          <span className="missions-count">
            {missions.filter((m) => m.done).length}/{missions.length} Done
          </span>
        </div>

        <ul className="missions-checklist">
          {missions.map((m) => (
            <li
              key={m.id}
              className={`mission-item ${m.done ? "completed" : ""}`}
              onClick={() => handleCompleteMission(m.id)}
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

      {/* Exam Adventure Space Banner */}
      <div className="adventure-quest-banner mt-4">
        <Image
          src="/assets/banners/exam_adventure.jpg"
          alt="Exam Adventure & Quest Ahead"
          width={600}
          height={260}
          priority
          className="quest-banner-img"
        />
        <div className="quest-banner-overlay">
          <div className="quest-banner-tag">🚀 SPECIAL EVENT</div>
          <h3 className="quest-banner-title">Term Exam Adventure!</h3>
          <p className="quest-banner-desc">
            Earn double XP on chapter practice runs!
          </p>
          <Link href="/homework" className="quest-banner-cta">
            Start Quests →
          </Link>
        </div>
      </div>

      {/* Winding Milestone Trail (Duolingo Style for Mobile) */}
      <div className="mt-4">
        <div className="section-title-row">
          <h3 className="pwa-section-title">Adventure Trail 🗺️</h3>
          <span className="pwa-section-kicker">Level 7 Milestone</span>
        </div>

        <div className="pwa-trail-track mt-2">
          <div className="trail-node completed" title="Level 1 Arithmetic">
            <span className="node-icon">⭐</span>
            <span className="node-label">Arithmetic</span>
          </div>
          <div className="pwa-trail-divider active" />
          <div className="trail-node completed" title="Level 2 Geometry">
            <span className="node-icon">📐</span>
            <span className="node-label">Geometry</span>
          </div>
          <div className="pwa-trail-divider active" />
          <div className="trail-node current pulse-ring" title="Current Quest: Fractions">
            <span className="node-icon">🚀</span>
            <span className="node-label">Fractions</span>
          </div>
          <div className="pwa-trail-divider" />
          <div className="trail-node locked" title="Level 8 Algebra">
            <span className="node-icon">🔒</span>
            <span className="node-label">Algebra</span>
          </div>
        </div>
      </div>

      {/* 3D Subject Worlds */}
      <div className="mt-4">
        <div className="section-title-row">
          <h3 className="pwa-section-title">Subject Kingdoms 🏰</h3>
          <span className="active-worlds-pill">4 Active</span>
        </div>

        <div className="pwa-subject-stack mt-2">
          {SUBJECT_WORLDS.map((subject) => (
            <div
              key={subject.id}
              className="pwa-subject-card"
              style={{ ["--accent-color" as string]: subject.themeColor }}
            >
              <div className="pwa-subject-media">
                <Image
                  src={subject.image}
                  alt={subject.title}
                  width={340}
                  height={170}
                  className="pwa-subject-img"
                />
                <div className="subject-media-badge">{subject.badge}</div>
              </div>

              <div className="pwa-subject-body">
                <div className="subject-category-row">
                  <span className="subject-category-text">{subject.category}</span>
                  <span className="subject-chapters-text">
                    {subject.completedChapters}/{subject.totalChapters} Units
                  </span>
                </div>

                <h4 className="subject-title">{subject.title}</h4>
                <p className="subject-next-topic">
                  <strong>Next:</strong> {subject.nextTopic}
                </p>

                {/* Progress bar */}
                <div className="subject-progress-container">
                  <div className="progress-info-row">
                    <span>Mastery</span>
                    <span className="progress-value">{subject.progress}%</span>
                  </div>
                  <div className="subject-progress-track">
                    <div
                      className="subject-progress-fill"
                      style={{
                        width: `${subject.progress}%`,
                        backgroundColor: subject.themeColor,
                      }}
                    />
                  </div>
                </div>

                <div className="subject-card-footer">
                  <Link
                    href={subject.href}
                    className="subject-continue-btn"
                    style={{ backgroundColor: subject.themeColor }}
                  >
                    <span>Continue Quest →</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Collection */}
      <div className="adventure-achievements-card mt-4">
        <div className="achievements-header">
          <h3 className="achievements-heading">Badges Showcase 🏆</h3>
          <span className="active-worlds-pill">4/4 Unlocked</span>
        </div>

        <div className="badge-preview-card mt-2">
          <Image
            src="/assets/badges/gamification_badges.jpg"
            alt="Badges Collection"
            width={340}
            height={340}
            className="badges-collection-img"
          />
          <div className="badges-list-pills">
            <span className="badge-pill unlocked">🏆 Math Master</span>
            <span className="badge-pill unlocked">🔬 Science Explorer</span>
            <span className="badge-pill unlocked">📖 Book Worm</span>
            <span className="badge-pill unlocked">💡 Problem Solver</span>
          </div>
        </div>
      </div>

      {/* Class Leaderboard */}
      <div className="adventure-leaderboard-card mt-4">
        <div className="leaderboard-header">
          <h4 className="leaderboard-title">Class Leaderboard 📊</h4>
          <span className="leaderboard-scope">This Week</span>
        </div>

        <ul className="leaderboard-list">
          {LEADERBOARD.map((u) => (
            <li
              key={u.name}
              className={`leaderboard-item ${u.isMe ? "current-user" : ""}`}
            >
              <div className="rank-badge">
                {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : `#${u.rank}`}
              </div>
              <span className="user-avatar-emoji">{u.avatar}</span>
              <div className="user-meta">
                <p className="user-name">
                  {u.name} {u.isMe && <span className="you-pill">You</span>}
                </p>
                <p className="user-streak">🔥 {u.streak}d streak</p>
              </div>
              <span className="user-xp">{u.xp.toLocaleString()} XP</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Floating Mascot Button */}
      <MascotCompanion
        variant="floating"
        onOpenBuddyChat={() => setIsBuddyOpen(true)}
      />

      {/* Ask Buddy AI Modal Drawer */}
      <AskBuddyModal
        isOpen={isBuddyOpen}
        onClose={() => setIsBuddyOpen(false)}
        studentName={studentName}
        onRewardXp={(pts) => triggerReward(pts, "Buddy AI Doubts Solved!")}
      />
    </div>
  );

  if (wrapInPhoneShell) {
    return (
      <PhoneShell
        title="Learning Zone"
        subtitle={`${studentName}'s Adventure · Level ${level}`}
        headerAccent="primary"
      >
        {content}
      </PhoneShell>
    );
  }

  return content;
}
