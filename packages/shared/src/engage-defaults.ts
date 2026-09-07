/** Shared Student Zone defaults — used by provider + /api/engage. */

export type EngageMood = "great" | "good" | "okay" | "tired";

export interface EngageBadge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt?: number;
}

export interface EngageMission {
  id: string;
  title: string;
  hint: string;
  xp: number;
  href: string;
  done: boolean;
}

export interface EngageChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  rewardXp: number;
  endsIn: string;
}

export const XP_PER_LEVEL = 100;

export const DEFAULT_BADGES: EngageBadge[] = [
  {
    id: "first-checkin",
    title: "Early Bird",
    description: "Completed your first daily check-in",
    emoji: "🌅",
  },
  {
    id: "streak-3",
    title: "On Fire",
    description: "Kept a 3-day learning streak",
    emoji: "🔥",
  },
  {
    id: "hw-hero",
    title: "Homework Hero",
    description: "Finished a homework mission",
    emoji: "📚",
  },
  {
    id: "focus-15",
    title: "Deep Focus",
    description: "Studied 15 minutes with Focus Timer",
    emoji: "🎯",
  },
  {
    id: "chatty",
    title: "Class Connector",
    description: "Opened class chats and stayed involved",
    emoji: "💬",
  },
  {
    id: "level-3",
    title: "Rising Star",
    description: "Reached level 3",
    emoji: "⭐",
  },
];

export function defaultMissions(): EngageMission[] {
  return [
    {
      id: "mission-checkin",
      title: "Daily check-in",
      hint: "Say hi and keep your streak alive",
      xp: 15,
      href: "/engage",
      done: false,
    },
    {
      id: "mission-homework",
      title: "Move one homework forward",
      hint: "Mark progress or submit an assignment",
      xp: 25,
      href: "/homework",
      done: false,
    },
    {
      id: "mission-chat",
      title: "Visit class chat",
      hint: "Read today’s activity from your teacher",
      xp: 10,
      href: "/chats/class-6b",
      done: false,
    },
    {
      id: "mission-focus",
      title: "5-min focus session",
      hint: "Start a short study timer",
      xp: 20,
      href: "/engage",
      done: false,
    },
  ];
}

export function defaultChallenge(): EngageChallenge {
  return {
    id: "week-reading",
    title: "Reading Rocket",
    description:
      "Complete 5 study actions this week (homework, focus, check-ins)",
    progress: 2,
    goal: 5,
    rewardXp: 50,
    endsIn: "4 days left",
  };
}

export function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function levelFromXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
