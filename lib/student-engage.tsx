"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Mood = "great" | "good" | "okay" | "tired";

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt?: number;
}

export interface Mission {
  id: string;
  title: string;
  hint: string;
  xp: number;
  href: string;
  done: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  rewardXp: number;
  endsIn: string;
}

export interface ReactionMap {
  [messageId: string]: string[]; // emoji list from this device
}

interface EngageState {
  xp: number;
  streak: number;
  lastCheckInDay: string | null;
  mood: Mood | null;
  moodDay: string | null;
  focusMinutes: number;
  badges: Badge[];
  missions: Mission[];
  challenge: Challenge;
  reactions: ReactionMap;
  celebrateUntil: number;
}

interface EngageCtx extends EngageState {
  ready: boolean;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
  checkIn: () => { ok: boolean; xp: number; message: string };
  setMood: (mood: Mood) => void;
  completeMission: (id: string) => void;
  addFocusMinutes: (mins: number) => void;
  bumpChallenge: (by?: number) => void;
  awardXp: (amount: number, reason?: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  clearCelebrate: () => void;
}

const STORAGE_KEY = "sc_student_engage_v1";
const XP_PER_LEVEL = 100;

const DEFAULT_BADGES: Badge[] = [
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultMissions(): Mission[] {
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

function defaultState(): EngageState {
  return {
    xp: 40,
    streak: 2,
    lastCheckInDay: yesterdayKey(),
    mood: null,
    moodDay: null,
    focusMinutes: 0,
    badges: DEFAULT_BADGES,
    missions: defaultMissions(),
    challenge: {
      id: "week-reading",
      title: "Reading Rocket",
      description: "Complete 5 study actions this week (homework, focus, check-ins)",
      progress: 2,
      goal: 5,
      rewardXp: 50,
      endsIn: "4 days left",
    },
    reactions: {},
    celebrateUntil: 0,
  };
}

function levelFromXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function loadState(): EngageState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as EngageState;
    return {
      ...defaultState(),
      ...parsed,
      badges: parsed.badges?.length ? parsed.badges : DEFAULT_BADGES,
      missions: parsed.missions?.length ? parsed.missions : defaultMissions(),
    };
  } catch {
    return defaultState();
  }
}

function saveState(state: EngageState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const Ctx = createContext<EngageCtx | null>(null);

export function StudentEngageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EngageState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  const commit = useCallback((updater: (prev: EngageState) => EngageState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const unlockBadge = (prev: EngageState, id: string): EngageState => {
    const badges = prev.badges.map((b) =>
      b.id === id && !b.unlockedAt ? { ...b, unlockedAt: Date.now() } : b,
    );
    return { ...prev, badges };
  };

  const awardXpInternal = (prev: EngageState, amount: number): EngageState => {
    const xp = prev.xp + amount;
    let next = { ...prev, xp, celebrateUntil: Date.now() + 2200 };
    if (levelFromXp(xp) >= 3) next = unlockBadge(next, "level-3");
    return next;
  };

  const checkIn = useCallback(() => {
    const day = todayKey();
    let result = { ok: false, xp: 0, message: "Already checked in today" };

    commit((prev) => {
      if (prev.lastCheckInDay === day) return prev;

      const continued = prev.lastCheckInDay === yesterdayKey();
      const streak = continued ? prev.streak + 1 : 1;
      let next = awardXpInternal(
        {
          ...prev,
          streak,
          lastCheckInDay: day,
          missions: prev.missions.map((m) =>
            m.id === "mission-checkin" ? { ...m, done: true } : m,
          ),
        },
        15,
      );
      next = unlockBadge(next, "first-checkin");
      if (streak >= 3) next = unlockBadge(next, "streak-3");
      next = {
        ...next,
        challenge: {
          ...next.challenge,
          progress: Math.min(next.challenge.goal, next.challenge.progress + 1),
        },
      };
      result = { ok: true, xp: 15, message: `Streak ${streak} · +15 XP` };
      return next;
    });

    return result;
  }, [commit]);

  const setMood = useCallback(
    (mood: Mood) => {
      commit((prev) => ({
        ...prev,
        mood,
        moodDay: todayKey(),
      }));
    },
    [commit],
  );

  const completeMission = useCallback(
    (id: string) => {
      commit((prev) => {
        const mission = prev.missions.find((m) => m.id === id);
        if (!mission || mission.done) return prev;
        let next = awardXpInternal(
          {
            ...prev,
            missions: prev.missions.map((m) =>
              m.id === id ? { ...m, done: true } : m,
            ),
            challenge: {
              ...prev.challenge,
              progress: Math.min(prev.challenge.goal, prev.challenge.progress + 1),
            },
          },
          mission.xp,
        );
        if (id === "mission-homework") next = unlockBadge(next, "hw-hero");
        if (id === "mission-chat") next = unlockBadge(next, "chatty");
        if (id === "mission-focus") next = unlockBadge(next, "focus-15");
        return next;
      });
    },
    [commit],
  );

  const addFocusMinutes = useCallback(
    (mins: number) => {
      commit((prev) => {
        const focusMinutes = prev.focusMinutes + mins;
        let next: EngageState = { ...prev, focusMinutes };
        if (mins >= 5) {
          next = {
            ...next,
            missions: next.missions.map((m) =>
              m.id === "mission-focus" ? { ...m, done: true } : m,
            ),
          };
          next = awardXpInternal(next, 20);
          next = {
            ...next,
            challenge: {
              ...next.challenge,
              progress: Math.min(next.challenge.goal, next.challenge.progress + 1),
            },
          };
        }
        if (focusMinutes >= 15) next = unlockBadge(next, "focus-15");
        return next;
      });
    },
    [commit],
  );

  const bumpChallenge = useCallback(
    (by = 1) => {
      commit((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          progress: Math.min(prev.challenge.goal, prev.challenge.progress + by),
        },
      }));
    },
    [commit],
  );

  const awardXp = useCallback(
    (amount: number) => {
      commit((prev) => awardXpInternal(prev, amount));
    },
    [commit],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      commit((prev) => {
        const current = prev.reactions[messageId] || [];
        const has = current.includes(emoji);
        const nextList = has
          ? current.filter((e) => e !== emoji)
          : [...current, emoji];
        return {
          ...prev,
          reactions: { ...prev.reactions, [messageId]: nextList },
        };
      });
    },
    [commit],
  );

  const clearCelebrate = useCallback(() => {
    commit((prev) => ({ ...prev, celebrateUntil: 0 }));
  }, [commit]);

  const level = levelFromXp(state.xp);
  const xpIntoLevel = state.xp % XP_PER_LEVEL;
  const value = useMemo<EngageCtx>(
    () => ({
      ...state,
      ready,
      level,
      xpIntoLevel,
      xpForNextLevel: XP_PER_LEVEL,
      levelProgress: xpIntoLevel / XP_PER_LEVEL,
      checkIn,
      setMood,
      completeMission,
      addFocusMinutes,
      bumpChallenge,
      awardXp,
      toggleReaction,
      clearCelebrate,
    }),
    [
      state,
      ready,
      level,
      xpIntoLevel,
      checkIn,
      setMood,
      completeMission,
      addFocusMinutes,
      bumpChallenge,
      awardXp,
      toggleReaction,
      clearCelebrate,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudentEngage() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useStudentEngage must be used inside StudentEngageProvider");
  }
  return ctx;
}

export const MOOD_OPTIONS: { id: Mood; label: string; emoji: string }[] = [
  { id: "great", label: "Great", emoji: "😄" },
  { id: "good", label: "Good", emoji: "🙂" },
  { id: "okay", label: "Okay", emoji: "😐" },
  { id: "tired", label: "Tired", emoji: "😴" },
];

export const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "👏"];
