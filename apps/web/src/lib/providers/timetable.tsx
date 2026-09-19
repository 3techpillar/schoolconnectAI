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
import { type UserProfile, type Role } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { useStaffAttendance } from "@/lib/providers/staff-attendance";
import { toIsoDate } from "@/lib/shared/dates";

export interface PeriodSlot {
  periodNo: number; // 1 to 8
  label: string; // e.g. "Period 1"
  startTime: string; // "08:30"
  endTime: string; // "09:15"
  isBreak?: boolean;
}

export const PERIOD_SLOTS: PeriodSlot[] = [
  { periodNo: 1, label: "Period 1", startTime: "08:30", endTime: "09:15" },
  { periodNo: 2, label: "Period 2", startTime: "09:15", endTime: "10:00" },
  { periodNo: 3, label: "Period 3", startTime: "10:00", endTime: "10:45" },
  { periodNo: 4, label: "Short Recess", startTime: "10:45", endTime: "11:00", isBreak: true },
  { periodNo: 5, label: "Period 4", startTime: "11:00", endTime: "11:45" },
  { periodNo: 6, label: "Period 5", startTime: "11:45", endTime: "12:30" },
  { periodNo: 7, label: "Lunch Break", startTime: "12:30", endTime: "01:15", isBreak: true },
  { periodNo: 8, label: "Period 6", startTime: "01:15", endTime: "02:00" },
  { periodNo: 9, label: "Period 7", startTime: "02:00", endTime: "02:45" },
  { periodNo: 10, label: "Period 8", startTime: "02:45", endTime: "03:30" },
];

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface TimetableEntry {
  id: string;
  className: string; // e.g. "6-B"
  day: DayOfWeek;
  periodNo: number; // 1, 2, 3, 5, 6, 8, 9, 10
  subject: string; // "Mathematics", "English", "Science", "Social Studies", "Hindi", "Computer Science", "Physical Ed", "Art"
  department: string; // "Math", "Languages", "Sciences", "Humanities", "Sports"
  teacherId: string;
  teacherName: string;
  roomNo: string;
}

export interface SubstitutionRecord {
  id: string;
  dateKey: string; // "2026-09-19"
  periodNo: number;
  className: string;
  subject: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  substituteRole: string;
  matchType: "same_subject" | "same_department" | "free_teacher";
  assignedBy: string;
  assignedAt: number;
  roomNo: string;
}

export interface CandidateSubstitute {
  teacherId: string;
  teacherName: string;
  role: Role;
  department: string;
  matchType: "same_subject" | "same_department" | "free_teacher";
  matchLabel: string;
  score: number;
}

interface TimetableState {
  entries: TimetableEntry[];
  substitutions: SubstitutionRecord[];
}

interface TimetableCtx {
  ready: boolean;
  entries: TimetableEntry[];
  substitutions: SubstitutionRecord[];
  getTimetableForClass: (className: string, day?: DayOfWeek) => TimetableEntry[];
  getTimetableForTeacher: (teacherId: string, day?: DayOfWeek) => TimetableEntry[];
  getSubstitutionsForDate: (dateKey?: string) => SubstitutionRecord[];
  getCandidateSubstitutes: (
    day: DayOfWeek,
    periodNo: number,
    subject: string,
    department: string,
    excludeTeacherId: string,
  ) => CandidateSubstitute[];
  runAutoSubstitutionForDate: (
    dateKey: string,
    absentTeacherId: string,
    actor: UserProfile,
  ) => SubstitutionRecord[];
  manualAssignSubstitution: (
    input: {
      dateKey: string;
      periodNo: number;
      className: string;
      subject: string;
      originalTeacherId: string;
      originalTeacherName: string;
      substituteTeacherId: string;
      substituteTeacherName: string;
      roomNo: string;
      actor: UserProfile;
    },
  ) => SubstitutionRecord;
}

const STORAGE_KEY = "sc_timetable_v1";
const Ctx = createContext<TimetableCtx | null>(null);

function seedTimetableEntries(): TimetableEntry[] {
  const days: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const out: TimetableEntry[] = [];

  // Teachers catalog
  const teacherKapoor = { id: "staff-kapoor", name: "Ms. Kapoor", dept: "Math" };
  const teacherSingh = { id: "staff-singh", name: "Dr. Anita Singh", dept: "Sciences" };
  const teacherVerma = { id: "staff-verma", name: "Rajesh Verma", dept: "Sports" };
  const teacherSharma = { id: "staff-sharma", name: "Sanjay Sharma", dept: "Humanities" };
  const teacherIyer = { id: "staff-iyer", name: "Mrs. Meenakshi Iyer", dept: "Languages" };

  days.forEach((day, dIdx) => {
    // Class 6-B Schedule
    out.push(
      {
        id: `6b-${day}-1`,
        className: "6-B",
        day,
        periodNo: 1,
        subject: "Mathematics",
        department: "Math",
        teacherId: teacherKapoor.id,
        teacherName: teacherKapoor.name,
        roomNo: "Room 104",
      },
      {
        id: `6b-${day}-2`,
        className: "6-B",
        day,
        periodNo: 2,
        subject: "English Literature",
        department: "Languages",
        teacherId: teacherIyer.id,
        teacherName: teacherIyer.name,
        roomNo: "Room 104",
      },
      {
        id: `6b-${day}-3`,
        className: "6-B",
        day,
        periodNo: 3,
        subject: "General Science",
        department: "Sciences",
        teacherId: teacherSingh.id,
        teacherName: teacherSingh.name,
        roomNo: "Science Lab 1",
      },
      {
        id: `6b-${day}-5`,
        className: "6-B",
        day,
        periodNo: 5,
        subject: "Social Studies",
        department: "Humanities",
        teacherId: teacherSharma.id,
        teacherName: teacherSharma.name,
        roomNo: "Room 104",
      },
      {
        id: `6b-${day}-6`,
        className: "6-B",
        day,
        periodNo: 6,
        subject: dIdx % 2 === 0 ? "Hindi" : "Computer Science",
        department: dIdx % 2 === 0 ? "Languages" : "Sciences",
        teacherId: dIdx % 2 === 0 ? teacherIyer.id : teacherSingh.id,
        teacherName: dIdx % 2 === 0 ? teacherIyer.name : teacherSingh.name,
        roomNo: dIdx % 2 === 0 ? "Room 104" : "Computer Lab 2",
      },
      {
        id: `6b-${day}-8`,
        className: "6-B",
        day,
        periodNo: 8,
        subject: "Physical Education",
        department: "Sports",
        teacherId: teacherVerma.id,
        teacherName: teacherVerma.name,
        roomNo: "Playground / Gym",
      },
    );

    // Class 10-A Schedule
    out.push(
      {
        id: `10a-${day}-1`,
        className: "10-A",
        day,
        periodNo: 1,
        subject: "Physics",
        department: "Sciences",
        teacherId: teacherSingh.id,
        teacherName: teacherSingh.name,
        roomNo: "Physics Lab",
      },
      {
        id: `10a-${day}-2`,
        className: "10-A",
        day,
        periodNo: 2,
        subject: "Higher Mathematics",
        department: "Math",
        teacherId: teacherKapoor.id,
        teacherName: teacherKapoor.name,
        roomNo: "Room 302",
      },
      {
        id: `10a-${day}-3`,
        className: "10-A",
        day,
        periodNo: 3,
        subject: "History & Civics",
        department: "Humanities",
        teacherId: teacherSharma.id,
        teacherName: teacherSharma.name,
        roomNo: "Room 302",
      },
    );
  });

  return out;
}

function seedSubstitutions(): SubstitutionRecord[] {
  const today = toIsoDate();
  return [
    {
      id: "sub-seed-1",
      dateKey: today,
      periodNo: 1,
      className: "6-B",
      subject: "Mathematics",
      originalTeacherId: "staff-kapoor",
      originalTeacherName: "Ms. Kapoor",
      substituteTeacherId: "staff-singh",
      substituteTeacherName: "Dr. Anita Singh",
      substituteRole: "principal",
      matchType: "same_department",
      assignedBy: "Auto-Substitution Engine",
      assignedAt: Date.now() - 1000 * 60 * 60 * 3,
      roomNo: "Room 104",
    },
  ];
}

function defaultState(): TimetableState {
  return {
    entries: seedTimetableEntries(),
    substitutions: seedSubstitutions(),
  };
}

function loadState(): TimetableState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as TimetableState;
    return {
      entries: parsed.entries?.length ? parsed.entries : seedTimetableEntries(),
      substitutions: parsed.substitutions?.length ? parsed.substitutions : seedSubstitutions(),
    };
  } catch {
    return defaultState();
  }
}

export function TimetableProvider({ children }: { children: ReactNode }) {
  const { pushNotification } = useSchoolData();
  const { staffRoster } = useStaffAttendance();
  const [state, setState] = useState<TimetableState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  const commit = useCallback(
    (updater: (prev: TimetableState) => TimetableState) => {
      setState((prev) => {
        const next = updater(prev);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const getTimetableForClass = useCallback(
    (className: string, day?: DayOfWeek) => {
      return state.entries.filter((e) => {
        const matchClass = e.className.toLowerCase() === className.toLowerCase();
        return day ? matchClass && e.day === day : matchClass;
      });
    },
    [state.entries],
  );

  const getTimetableForTeacher = useCallback(
    (teacherId: string, day?: DayOfWeek) => {
      return state.entries.filter((e) => {
        const matchTeacher = e.teacherId === teacherId;
        return day ? matchTeacher && e.day === day : matchTeacher;
      });
    },
    [state.entries],
  );

  const getSubstitutionsForDate = useCallback(
    (dateKey = toIsoDate()) => {
      return state.substitutions.filter((s) => s.dateKey === dateKey);
    },
    [state.substitutions],
  );

  const getCandidateSubstitutes = useCallback(
    (
      day: DayOfWeek,
      periodNo: number,
      subject: string,
      department: string,
      excludeTeacherId: string,
    ): CandidateSubstitute[] => {
      // Find all teachers occupied during this day + periodNo
      const busyTeacherIds = new Set<string>(
        state.entries
          .filter((e) => e.day === day && e.periodNo === periodNo)
          .map((e) => e.teacherId),
      );

      // Filter available staff who are NOT busy and NOT the excluded teacher
      const candidates: CandidateSubstitute[] = [];

      staffRoster.forEach((staff) => {
        if (staff.id === excludeTeacherId) return;
        if (busyTeacherIds.has(staff.id)) return; // Teacher is busy teaching another class

        const staffDept =
          staff.role === "class_teacher" ? "Math" : staff.role === "principal" ? "Sciences" : "Sports";

        let matchType: "same_subject" | "same_department" | "free_teacher" = "free_teacher";
        let score = 1;
        let matchLabel = "Available Free Teacher";

        if (staffDept.toLowerCase() === department.toLowerCase()) {
          matchType = "same_department";
          score = 2;
          matchLabel = `Same Department (${department})`;
        }

        candidates.push({
          teacherId: staff.id,
          teacherName: staff.name,
          role: staff.role,
          department: staffDept,
          matchType,
          matchLabel,
          score,
        });
      });

      return candidates.sort((a, b) => b.score - a.score);
    },
    [state.entries, staffRoster],
  );

  const runAutoSubstitutionForDate = useCallback(
    (dateKey: string, absentTeacherId: string, actor: UserProfile) => {
      const dayName = new Date(dateKey + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "long",
      }) as DayOfWeek;

      // Find all periods taught by absent teacher on this day
      const affectedPeriods = state.entries.filter(
        (e) => e.teacherId === absentTeacherId && e.day === dayName,
      );

      const generated: SubstitutionRecord[] = [];

      affectedPeriods.forEach((period) => {
        const candidates = getCandidateSubstitutes(
          period.day,
          period.periodNo,
          period.subject,
          period.department,
          absentTeacherId,
        );

        if (!candidates.length) return;
        const chosen = candidates[0]; // Top ranked substitute

        const sub: SubstitutionRecord = {
          id: crypto.randomUUID(),
          dateKey,
          periodNo: period.periodNo,
          className: period.className,
          subject: period.subject,
          originalTeacherId: period.teacherId,
          originalTeacherName: period.teacherName,
          substituteTeacherId: chosen.teacherId,
          substituteTeacherName: chosen.teacherName,
          substituteRole: chosen.role,
          matchType: chosen.matchType,
          assignedBy: actor.name,
          assignedAt: Date.now(),
          roomNo: period.roomNo,
        };

        generated.push(sub);

        // Notify substitute teacher
        pushNotification({
          title: "⚡ Auto-Substitution Assigned",
          body: `You are assigned to cover Class ${period.className} (Period ${period.periodNo} - ${period.subject}) on ${dateKey} in ${period.roomNo}.`,
          type: "activity",
          href: "/timetable",
        });
      });

      if (generated.length) {
        commit((prev) => ({
          ...prev,
          substitutions: [...generated, ...prev.substitutions],
        }));
      }

      return generated;
    },
    [state.entries, getCandidateSubstitutes, pushNotification, commit],
  );

  const manualAssignSubstitution = useCallback(
    (input: {
      dateKey: string;
      periodNo: number;
      className: string;
      subject: string;
      originalTeacherId: string;
      originalTeacherName: string;
      substituteTeacherId: string;
      substituteTeacherName: string;
      roomNo: string;
      actor: UserProfile;
    }) => {
      const sub: SubstitutionRecord = {
        id: crypto.randomUUID(),
        dateKey: input.dateKey,
        periodNo: input.periodNo,
        className: input.className,
        subject: input.subject,
        originalTeacherId: input.originalTeacherId,
        originalTeacherName: input.originalTeacherName,
        substituteTeacherId: input.substituteTeacherId,
        substituteTeacherName: input.substituteTeacherName,
        substituteRole: "teacher",
        matchType: "free_teacher",
        assignedBy: input.actor.name,
        assignedAt: Date.now(),
        roomNo: input.roomNo,
      };

      commit((prev) => ({
        ...prev,
        substitutions: [sub, ...prev.substitutions.filter((s) => !(s.dateKey === input.dateKey && s.periodNo === input.periodNo && s.className === input.className))],
      }));

      pushNotification({
        title: "⚡ Substitution Assignment Updated",
        body: `Assigned ${input.substituteTeacherName} for Class ${input.className} Period ${input.periodNo} (${input.subject}) on ${input.dateKey}.`,
        type: "activity",
        href: "/timetable",
      });

      return sub;
    },
    [commit, pushNotification],
  );

  const value = useMemo<TimetableCtx>(() => {
    return {
      ready,
      entries: state.entries,
      substitutions: state.substitutions,
      getTimetableForClass,
      getTimetableForTeacher,
      getSubstitutionsForDate,
      getCandidateSubstitutes,
      runAutoSubstitutionForDate,
      manualAssignSubstitution,
    };
  }, [
    ready,
    state,
    getTimetableForClass,
    getTimetableForTeacher,
    getSubstitutionsForDate,
    getCandidateSubstitutes,
    runAutoSubstitutionForDate,
    manualAssignSubstitution,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTimetable() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTimetable must be used inside TimetableProvider");
  return ctx;
}
