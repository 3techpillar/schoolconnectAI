"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/providers/auth";
import { apiFetch } from "@/lib/shared/api-client";
import {
  DEFAULT_BADGES,
  XP_PER_LEVEL,
  defaultChallenge,
  defaultMissions,
  levelFromXp,
  todayKey,
  yesterdayKey,
  type EngageBadge,
  type EngageChallenge,
  type EngageMission,
  type EngageMood,
} from "@/lib/shared/engage-defaults";

export type Mood = EngageMood;
export type Badge = EngageBadge;
export type Mission = EngageMission;
export type Challenge = EngageChallenge;

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
  checkIn: () =>
    | { ok: boolean; xp: number; message: string }
    | Promise<{ ok: boolean; xp: number; message: string }>;
  setMood: (mood: Mood) => void;
  completeMission: (id: string) => void;
  addFocusMinutes: (mins: number) => void;
  bumpChallenge: (by?: number) => void;
  awardXp: (amount: number, reason?: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  clearCelebrate: () => void;
}

const STORAGE_KEY = "sc_student_engage_v1";

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
    challenge: defaultChallenge(),
    reactions: {},
    celebrateUntil: 0,
  };
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
  const { backend, ready: authReady, user } = useAuth();
  const [state, setState] = useState<EngageState>(defaultState);
  const [ready, setReady] = useState(false);
  const backendRef = useRef(false);
  backendRef.current = backend;

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (backend && user?.schoolId) {
          const res = await apiFetch<{ engage: EngageState }>("/api/engage");
          if (!cancelled) {
            setState({
              ...defaultState(),
              ...res.engage,
              badges: res.engage.badges?.length
                ? res.engage.badges
                : DEFAULT_BADGES,
              missions: res.engage.missions?.length
                ? res.engage.missions
                : defaultMissions(),
            });
          }
        } else if (!backend) {
          if (!cancelled) setState(loadState());
        } else if (!cancelled) {
          setState(defaultState());
        }
      } catch {
        if (!cancelled && !backend) setState(loadState());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, backend, user?.id, user?.schoolId]);

  const runRemoteAction = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await apiFetch<{
        engage: EngageState;
        ok?: boolean;
        message?: string;
        xpGained?: number;
      }>("/api/engage", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setState({
        ...res.engage,
        badges: res.engage.badges?.length ? res.engage.badges : DEFAULT_BADGES,
        missions: res.engage.missions?.length
          ? res.engage.missions
          : defaultMissions(),
        challenge: res.engage.challenge?.id
          ? res.engage.challenge
          : defaultChallenge(),
      });
      return res;
    },
    [],
  );

  const commitLocal = useCallback(
    (updater: (prev: EngageState) => EngageState) => {
      setState((prev) => {
        const next = updater(prev);
        saveState(next);
        return next;
      });
    },
    [],
  );

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
    if (backendRef.current) {
      return runRemoteAction({ action: "checkIn" })
        .then((res) => ({
          ok: Boolean(res.ok),
          xp: res.xpGained || 0,
          message: res.message || "Checked in",
        }))
        .catch(() => ({
          ok: false,
          xp: 0,
          message: "Check-in failed",
        }));
    }

    const day = todayKey();
    let result = { ok: false, xp: 0, message: "Already checked in today" };

    commitLocal((prev) => {
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
  }, [commitLocal, runRemoteAction]);

  const setMood = useCallback(
    (mood: Mood) => {
      if (backendRef.current) {
        void runRemoteAction({ action: "setMood", mood });
        return;
      }
      commitLocal((prev) => ({
        ...prev,
        mood,
        moodDay: todayKey(),
      }));
    },
    [commitLocal, runRemoteAction],
  );

  const completeMission = useCallback(
    (id: string) => {
      if (backendRef.current) {
        void runRemoteAction({ action: "completeMission", missionId: id });
        return;
      }
      commitLocal((prev) => {
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
    [commitLocal, runRemoteAction],
  );

  const addFocusMinutes = useCallback(
    (mins: number) => {
      if (backendRef.current) {
        void runRemoteAction({ action: "addFocusMinutes", minutes: mins });
        return;
      }
      commitLocal((prev) => {
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
    [commitLocal, runRemoteAction],
  );

  const bumpChallenge = useCallback(
    (by = 1) => {
      if (backendRef.current) {
        void runRemoteAction({ action: "bumpChallenge", by });
        return;
      }
      commitLocal((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          progress: Math.min(prev.challenge.goal, prev.challenge.progress + by),
        },
      }));
    },
    [commitLocal, runRemoteAction],
  );

  const awardXp = useCallback(
    (amount: number) => {
      // Server does not accept free-form XP; offline-only helper for demos
      if (backendRef.current) return;
      commitLocal((prev) => awardXpInternal(prev, amount));
    },
    [commitLocal],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (backendRef.current) {
        void runRemoteAction({ action: "toggleReaction", messageId, emoji });
        return;
      }
      commitLocal((prev) => {
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
    [commitLocal, runRemoteAction],
  );

  const clearCelebrate = useCallback(() => {
    if (backendRef.current) {
      void runRemoteAction({ action: "clearCelebrate" });
      return;
    }
    commitLocal((prev) => ({ ...prev, celebrateUntil: 0 }));
  }, [commitLocal, runRemoteAction]);

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
