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
import { useAuth } from "@/lib/providers/auth";

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "archived" | "upcoming";
}

export interface ClassSection {
  id: string;
  grade: number;
  section: string;
  label: string;
  classTeacherId?: string;
  classTeacherName?: string;
  studentCapacity: number;
}

export interface SubjectMaster {
  id: string;
  code: string;
  name: string;
  category: "core" | "elective" | "activity";
}

export interface SubjectTeacherMapping {
  id: string;
  classSectionId: string;
  classLabel: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

interface AcademicStructureCtx {
  ready: boolean;
  sessions: AcademicSession[];
  activeSession: AcademicSession | null;
  classSections: ClassSection[];
  subjects: SubjectMaster[];
  subjectMappings: SubjectTeacherMapping[];
  setActiveSession: (sessionId: string) => void;
  addClassSection: (grade: number, section: string, classTeacherId?: string) => ClassSection;
  assignClassTeacher: (classSectionId: string, teacherId: string, teacherName: string) => void;
  assignSubjectTeacher: (
    classSectionId: string,
    subjectId: string,
    teacherId: string,
    teacherName: string,
  ) => void;
}

const STORAGE_KEY_SESSIONS = "sc_academic_sessions_v1";
const STORAGE_KEY_CLASSES = "sc_academic_classes_v1";
const STORAGE_KEY_SUBJECTS = "sc_academic_subjects_v1";
const STORAGE_KEY_MAPPINGS = "sc_academic_mappings_v1";

const Ctx = createContext<AcademicStructureCtx | null>(null);

function defaultSessions(): AcademicSession[] {
  return [
    { id: "ses-2026", name: "2026–2027", startDate: "2026-04-01", endDate: "2027-03-31", status: "active" },
    { id: "ses-2025", name: "2025–2026", startDate: "2025-04-01", endDate: "2026-03-31", status: "archived" },
  ];
}

function defaultClassSections(): ClassSection[] {
  return [
    { id: "cs-6a", grade: 6, section: "A", label: "6-A", classTeacherId: "usr-t1", classTeacherName: "Ms. Mehta", studentCapacity: 40 },
    { id: "cs-6b", grade: 6, section: "B", label: "6-B", classTeacherId: "usr-t2", classTeacherName: "Ms. Kapoor", studentCapacity: 40 },
    { id: "cs-7a", grade: 7, section: "A", label: "7-A", classTeacherId: "usr-t3", classTeacherName: "Mr. Sharma", studentCapacity: 40 },
    { id: "cs-8a", grade: 8, section: "A", label: "8-A", classTeacherId: "usr-t4", classTeacherName: "Mrs. Sen", studentCapacity: 40 },
  ];
}

function defaultSubjects(): SubjectMaster[] {
  return [
    { id: "sub-math", code: "MATH-101", name: "Mathematics", category: "core" },
    { id: "sub-sci", code: "SCI-101", name: "Science", category: "core" },
    { id: "sub-eng", code: "ENG-101", name: "English", category: "core" },
    { id: "sub-hin", code: "HIN-101", name: "Hindi", category: "core" },
    { id: "sub-sst", code: "SST-101", name: "Social Studies", category: "core" },
    { id: "sub-cs", code: "CS-101", name: "Computer Science", category: "elective" },
  ];
}

function defaultMappings(): SubjectTeacherMapping[] {
  return [
    { id: "map-1", classSectionId: "cs-6b", classLabel: "6-B", subjectId: "sub-math", subjectName: "Mathematics", teacherId: "usr-t-verma", teacherName: "Mr. Verma" },
    { id: "map-2", classSectionId: "cs-6b", classLabel: "6-B", subjectId: "sub-sci", subjectName: "Science", teacherId: "usr-t1", teacherName: "Ms. Mehta" },
    { id: "map-3", classSectionId: "cs-7a", classLabel: "7-A", subjectId: "sub-math", subjectName: "Mathematics", teacherId: "usr-t-verma", teacherName: "Mr. Verma" },
  ];
}

export function AcademicStructureProvider({ children }: { children: ReactNode }) {
  const { ready: authReady } = useAuth();
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectMaster[]>([]);
  const [subjectMappings, setSubjectMappings] = useState<SubjectTeacherMapping[]>([]);

  useEffect(() => {
    if (!authReady) return;
    if (typeof window !== "undefined") {
      try {
        const rawSes = localStorage.getItem(STORAGE_KEY_SESSIONS);
        const rawCls = localStorage.getItem(STORAGE_KEY_CLASSES);
        const rawSub = localStorage.getItem(STORAGE_KEY_SUBJECTS);
        const rawMap = localStorage.getItem(STORAGE_KEY_MAPPINGS);

        setSessions(rawSes ? JSON.parse(rawSes) : defaultSessions());
        setClassSections(rawCls ? JSON.parse(rawCls) : defaultClassSections());
        setSubjects(rawSub ? JSON.parse(rawSub) : defaultSubjects());
        setSubjectMappings(rawMap ? JSON.parse(rawMap) : defaultMappings());
      } catch {
        setSessions(defaultSessions());
        setClassSections(defaultClassSections());
        setSubjects(defaultSubjects());
        setSubjectMappings(defaultMappings());
      } finally {
        setReady(true);
      }
    }
  }, [authReady]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "active") ?? sessions[0] ?? null,
    [sessions],
  );

  const setActiveSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const next = prev.map((s) => ({
        ...s,
        status: (s.id === sessionId ? "active" : "archived") as AcademicSession["status"],
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const addClassSection = useCallback(
    (grade: number, section: string, classTeacherId?: string) => {
      const label = `${grade}-${section.toUpperCase()}`;
      const newClass: ClassSection = {
        id: `cs-${grade}${section.toLowerCase()}-${Date.now()}`,
        grade,
        section: section.toUpperCase(),
        label,
        classTeacherId,
        studentCapacity: 40,
      };
      setClassSections((prev) => {
        const next = [...prev, newClass];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(next));
        }
        return next;
      });
      return newClass;
    },
    [],
  );

  const assignClassTeacher = useCallback(
    (classSectionId: string, teacherId: string, teacherName: string) => {
      setClassSections((prev) => {
        const next = prev.map((c) =>
          c.id === classSectionId
            ? { ...c, classTeacherId: teacherId, classTeacherName: teacherName }
            : c,
        );
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const assignSubjectTeacher = useCallback(
    (
      classSectionId: string,
      subjectId: string,
      teacherId: string,
      teacherName: string,
    ) => {
      const targetClass = classSections.find((c) => c.id === classSectionId);
      const targetSub = subjects.find((s) => s.id === subjectId);
      if (!targetClass || !targetSub) return;

      setSubjectMappings((prev) => {
        const filtered = prev.filter(
          (m) => !(m.classSectionId === classSectionId && m.subjectId === subjectId),
        );
        const next: SubjectTeacherMapping[] = [
          ...filtered,
          {
            id: `map-${Date.now()}`,
            classSectionId,
            classLabel: targetClass.label,
            subjectId,
            subjectName: targetSub.name,
            teacherId,
            teacherName,
          },
        ];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_MAPPINGS, JSON.stringify(next));
        }
        return next;
      });
    },
    [classSections, subjects],
  );

  const value = useMemo<AcademicStructureCtx>(
    () => ({
      ready,
      sessions,
      activeSession,
      classSections,
      subjects,
      subjectMappings,
      setActiveSession,
      addClassSection,
      assignClassTeacher,
      assignSubjectTeacher,
    }),
    [
      ready,
      sessions,
      activeSession,
      classSections,
      subjects,
      subjectMappings,
      setActiveSession,
      addClassSection,
      assignClassTeacher,
      assignSubjectTeacher,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAcademicStructure() {
  const c = useContext(Ctx);
  if (!c) {
    throw new Error(
      "useAcademicStructure must be used inside AcademicStructureProvider",
    );
  }
  return c;
}
