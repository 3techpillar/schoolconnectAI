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
import { useAuth, type UserProfile } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { apiFetch } from "@/lib/shared/api-client";
import { nextClassName } from "@/lib/shared/class-utils";

export type AttendMark = "P" | "A" | "L" | "H";

export interface RosterStudent {
  id: string;
  name: string;
  rollNo: string;
  parentName: string;
  avatar: string;
  parentChatId: string;
  className: string;
}

export interface CircularItem {
  id: string;
  title: string;
  body: string;
  tag: string;
  createdAt: number;
  unread: boolean;
  postedBy: string;
  className?: string;
}

interface TeacherClassState {
  roster: RosterStudent[];
  attendanceByDay: Record<string, Record<string, AttendMark>>;
  circulars: CircularItem[];
}

interface TeacherClassCtx extends TeacherClassState {
  ready: boolean;
  todayKey: string;
  todayMarks: Record<string, AttendMark>;
  markedCount: number;
  presentCount: number;
  setMark: (studentId: string, mark: AttendMark, dateKey?: string) => void;
  markAllPresent: (dateKey?: string) => void;
  addCircular: (input: {
    title: string;
    body: string;
    tag: string;
    user: UserProfile;
  }) => Promise<boolean>;
  markCircularRead: (circularId: string) => void;
  ensureParentChat: (student: RosterStudent) => string;
  /** Annual promotion for demo roster (pass → next grade, fail → retain). */
  promoteRoster: (
    decisions: Array<{ studentId: string; result: "pass" | "fail" }>,
  ) => Array<{
    studentId: string;
    name: string;
    fromClass: string;
    toClass: string;
    result: "pass" | "fail";
  }>;
}

const STORAGE_KEY = "sc_teacher_class_v1";
const Ctx = createContext<TeacherClassCtx | null>(null);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function seedRoster(): RosterStudent[] {
  return [
    {
      id: "st-aarav",
      name: "Aarav Sharma",
      rollNo: "01",
      parentName: "Priya Sharma",
      avatar: "AS",
      parentChatId: "parent-aarav",
      className: "6-B",
    },
    {
      id: "st-ananya",
      name: "Ananya Iyer",
      rollNo: "02",
      parentName: "Meera Iyer",
      avatar: "AI",
      parentChatId: "parent-ananya",
      className: "6-B",
    },
    {
      id: "st-kabir",
      name: "Kabir Khan",
      rollNo: "03",
      parentName: "Imran Khan",
      avatar: "KK",
      parentChatId: "parent-kabir",
      className: "6-B",
    },
    {
      id: "st-diya",
      name: "Diya Patel",
      rollNo: "04",
      parentName: "Neha Patel",
      avatar: "DP",
      parentChatId: "parent-diya",
      className: "6-B",
    },
    {
      id: "st-vivaan",
      name: "Vivaan Reddy",
      rollNo: "05",
      parentName: "Sneha Reddy",
      avatar: "VR",
      parentChatId: "parent-vivaan",
      className: "6-B",
    },
    {
      id: "st-isha",
      name: "Isha Gupta",
      rollNo: "06",
      parentName: "Ritu Gupta",
      avatar: "IG",
      parentChatId: "parent-isha",
      className: "6-B",
    },
  ];
}

function seedCirculars(): CircularItem[] {
  const now = Date.now();
  return [
    {
      id: "c1",
      title: "Annual Sports Day on 5 July",
      body: "Dear parents, the annual sports day will be held on 5 July. Please ensure students wear house t-shirts.",
      tag: "Event",
      createdAt: now - 1000 * 60 * 12,
      unread: true,
      postedBy: "School Office",
    },
    {
      id: "c2",
      title: "Parent-Teacher meeting — Grade 6",
      body: "Scheduled this Saturday, 10 AM to 1 PM. Slot booking opens tomorrow.",
      tag: "PTM",
      createdAt: now - 1000 * 60 * 120,
      unread: true,
      postedBy: "School Office",
    },
    {
      id: "c3",
      title: "Summer break announcement",
      body: "School reopens on 8 July. Holiday homework list attached.",
      tag: "Notice",
      createdAt: now - 1000 * 60 * 60 * 24,
      unread: false,
      postedBy: "Principal",
    },
  ];
}

function defaultState(): TeacherClassState {
  const day = todayKey();
  const roster = seedRoster();
  const marks: Record<string, AttendMark> = {};
  roster.forEach((s, i) => {
    marks[s.id] = i === 2 ? "A" : i === 4 ? "L" : "P";
  });
  return {
    roster,
    attendanceByDay: { [day]: marks },
    circulars: seedCirculars(),
  };
}

function loadState(): TeacherClassState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as TeacherClassState;
    const seeded = seedRoster();
    const roster = (parsed.roster?.length ? parsed.roster : seeded).map((s) => ({
      ...s,
      className: s.className || "6-B",
    }));
    return {
      ...defaultState(),
      ...parsed,
      roster,
      circulars: parsed.circulars?.length ? parsed.circulars : seedCirculars(),
    };
  } catch {
    return defaultState();
  }
}

export function TeacherClassProvider({ children }: { children: ReactNode }) {
  const { upsertChat, refreshNotifications } = useSchoolData();
  const { backend, ready: authReady, user } = useAuth();
  const [state, setState] = useState<TeacherClassState>(defaultState);
  const [ready, setReady] = useState(false);
  const day = todayKey();

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (backend && user) {
          const q = user.className
            ? `?className=${encodeURIComponent(user.className)}`
            : "";
          const res = await apiFetch<{
            roster: RosterStudent[];
            attendanceByDay: Record<string, Record<string, AttendMark>>;
            circulars: CircularItem[];
          }>(`/api/class-desk${q}`);
          if (!cancelled) {
            setState({
              roster: res.roster,
              attendanceByDay: res.attendanceByDay,
              circulars: res.circulars,
            });
          }
        } else if (!backend) {
          if (!cancelled) setState(loadState());
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
  }, [authReady, backend, user?.id, user?.className, user]);

  const commit = useCallback(
    (updater: (prev: TeacherClassState) => TeacherClassState) => {
      setState((prev) => {
        const next = updater(prev);
        if (!backend) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [backend],
  );

  const setMark = useCallback(
    (studentId: string, mark: AttendMark, dateKey = day) => {
      if (backend) {
        void apiFetch("/api/class-desk", {
          method: "PATCH",
          body: JSON.stringify({
            setMark: { dateKey, studentId, mark },
            className: user?.className,
          }),
        }).catch(() => undefined);
      }
      commit((prev) => ({
        ...prev,
        attendanceByDay: {
          ...prev.attendanceByDay,
          [dateKey]: {
            ...(prev.attendanceByDay[dateKey] || {}),
            [studentId]: mark,
          },
        },
      }));
    },
    [commit, day, backend, user?.className],
  );

  const markAllPresent = useCallback(
    (dateKey = day) => {
      const marks: Record<string, AttendMark> = {};
      state.roster.forEach((s) => {
        marks[s.id] = "P";
      });
      if (backend) {
        void apiFetch("/api/class-desk", {
          method: "PATCH",
          body: JSON.stringify({
            attendance: { dateKey, marks },
            className: user?.className,
          }),
        }).catch(() => undefined);
      }
      commit((prev) => {
        const all: Record<string, AttendMark> = {};
        prev.roster.forEach((s) => {
          all[s.id] = "P";
        });
        return {
          ...prev,
          attendanceByDay: { ...prev.attendanceByDay, [dateKey]: all },
        };
      });
    },
    [commit, day, backend, user?.className, state.roster],
  );

  const addCircular = useCallback(
    async ({
      title,
      body,
      tag,
      user: actor,
    }: {
      title: string;
      body: string;
      tag: string;
      user: UserProfile;
    }) => {
      if (backend) {
        try {
          const res = await apiFetch<{
            roster: RosterStudent[];
            attendanceByDay: Record<string, Record<string, AttendMark>>;
            circulars: CircularItem[];
          }>("/api/class-desk", {
            method: "PATCH",
            body: JSON.stringify({
              circular: { title, body, tag },
              className: actor.className || "6-B",
            }),
          });
          setState({
            roster: res.roster,
            attendanceByDay: res.attendanceByDay,
            circulars: res.circulars,
          });
          await refreshNotifications();
          return true;
        } catch {
          return false;
        }
      }
      commit((prev) => ({
        ...prev,
        circulars: [
          {
            id: crypto.randomUUID(),
            title: title.trim(),
            body: body.trim(),
            tag,
            createdAt: Date.now(),
            unread: false,
            postedBy: actor.name,
            className: actor.className,
          },
          ...prev.circulars,
        ],
      }));
      return true;
    },
    [commit, backend, refreshNotifications],
  );

  const markCircularRead = useCallback(
    (circularId: string) => {
      if (backend) {
        void apiFetch("/api/class-desk", {
          method: "PATCH",
          body: JSON.stringify({
            markCircularRead: { key: circularId },
            className: user?.className || "6-B",
          }),
        }).catch(() => undefined);
      }
      commit((prev) => ({
        ...prev,
        circulars: prev.circulars.map((c) =>
          c.id === circularId ? { ...c, unread: false } : c,
        ),
      }));
    },
    [backend, commit, user?.className],
  );

  const ensureParentChat = useCallback(
    (student: RosterStudent) => {
      const chatId = student.parentChatId;
      upsertChat({
        id: chatId,
        title: student.parentName,
        subtitle: `Parent of ${student.name}`,
        kind: "teacher",
        className: student.className || "6-B",
        avatar: student.avatar,
        lastMessageAt: Date.now(),
        unread: 0,
      });
      return chatId;
    },
    [upsertChat],
  );

  const promoteRoster = useCallback(
    (decisions: Array<{ studentId: string; result: "pass" | "fail" }>) => {
      let results: Array<{
        studentId: string;
        name: string;
        fromClass: string;
        toClass: string;
        result: "pass" | "fail";
      }> = [];

      if (backend) {
        void apiFetch("/api/class-desk", {
          method: "PATCH",
          body: JSON.stringify({
            promote: decisions,
            className: user?.className,
          }),
        }).catch(() => undefined);
      }

      commit((prev) => {
        results = [];
        const roster = prev.roster.map((s) => {
          const d = decisions.find((x) => x.studentId === s.id);
          if (!d) return s;
          const from = s.className || "6-B";
          const next =
            d.result === "pass" ? nextClassName(from) || from : from;
          results.push({
            studentId: s.id,
            name: s.name,
            fromClass: from,
            toClass: next,
            result: d.result,
          });
          return { ...s, className: next };
        });
        return { ...prev, roster };
      });
      return results;
    },
    [commit, backend, user?.className],
  );

  const value = useMemo<TeacherClassCtx>(() => {
    const marks = state.attendanceByDay[day] || {};
    return {
      ...state,
      ready,
      todayKey: day,
      todayMarks: marks,
      markedCount: Object.keys(marks).length,
      presentCount: Object.values(marks).filter((m) => m === "P").length,
      setMark,
      markAllPresent,
      addCircular,
      markCircularRead,
      ensureParentChat,
      promoteRoster,
    };
  }, [
    state,
    ready,
    day,
    setMark,
    markAllPresent,
    addCircular,
    markCircularRead,
    ensureParentChat,
    promoteRoster,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTeacherClass() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTeacherClass must be used inside TeacherClassProvider");
  return ctx;
}

export function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
  return `${Math.floor(diff / 86_400_000)} d ago`;
}
