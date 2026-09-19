"use client";

import { useState } from "react";
import { useAcademicStructure } from "@/lib/providers/academic-structure";
import { useAuth } from "@/lib/providers/auth";
import { BookOpen, GraduationCap, School, ShieldCheck } from "@/components/shell/Icons";

export function AcademicStructureDesk() {
  const {
    sessions,
    activeSession,
    classSections,
    subjects,
    subjectMappings,
    setActiveSession,
    addClassSection,
    assignClassTeacher,
    assignSubjectTeacher,
  } = useAcademicStructure();
  const { listUsers } = useAuth();

  const [newGrade, setNewGrade] = useState(6);
  const [newSection, setNewSection] = useState("C");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const [mapClassId, setMapClassId] = useState(classSections[0]?.id || "");
  const [mapSubjectId, setMapSubjectId] = useState(subjects[0]?.id || "");
  const [mapTeacherId, setMapTeacherId] = useState("");

  const teachers = listUsers().filter(
    (u) =>
      u.role === "class_teacher" ||
      u.role === "subject_teacher" ||
      u.role === "principal",
  );

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.trim()) return;
    const teacher = teachers.find((t) => t.id === selectedTeacherId);
    const created = addClassSection(
      newGrade,
      newSection.trim(),
      teacher?.id,
    );
    if (teacher) {
      assignClassTeacher(created.id, teacher.id, teacher.name);
    }
    setFlash(`Created Class Section ${created.label} successfully.`);
    setNewSection("");
  };

  const handleAssignSubjectTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapClassId || !mapSubjectId || !mapTeacherId) return;
    const teacher = teachers.find((t) => t.id === mapTeacherId);
    if (!teacher) return;

    assignSubjectTeacher(mapClassId, mapSubjectId, teacher.id, teacher.name);
    setFlash("Assigned subject teacher successfully.");
  };

  return (
    <div className="space-y mt-3">
      {/* Session Banner */}
      <section className="card card-pad">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="font-semibold text-sm row" style={{ margin: 0, gap: 6 }}>
              <School size={16} className="tone-primary" /> Active Academic Session
            </p>
            <p className="text-xs muted" style={{ margin: "2px 0 0" }}>
              Current academic year for timetable, attendance, exams & fees.
            </p>
          </div>
          <select
            className="input"
            style={{ width: "auto", minWidth: 140, fontWeight: 700 }}
            value={activeSession?.id || ""}
            onChange={(e) => setActiveSession(e.target.value)}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Class & Section Creator Desk */}
      <form className="card card-pad space-y" onSubmit={handleAddClass}>
        <div>
          <p className="font-semibold text-sm row" style={{ margin: 0, gap: 6 }}>
            <GraduationCap size={16} className="tone-success" /> Create Class Section & Assign Class Teacher
          </p>
          <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
            Add new class sections and designate primary class teachers.
          </p>
        </div>

        <div className="wa-meta-row">
          <label className="grow">
            <span className="text-xs font-medium muted">Grade Level</span>
            <select
              className="input"
              value={newGrade}
              onChange={(e) => setNewGrade(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </label>
          <label className="grow">
            <span className="text-xs font-medium muted">Section Letter</span>
            <input
              className="input"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value.toUpperCase())}
              placeholder="A / B / C"
              required
            />
          </label>
        </div>

        <label>
          <span className="text-xs font-medium muted">Designated Class Teacher</span>
          <select
            className="input"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            <option value="">Select Teacher...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.className ? `Class ${t.className}` : "Staff"})
              </option>
            ))}
          </select>
        </label>

        {flash && (
          <p className="text-11 tone-success row" style={{ gap: 6, margin: 0 }}>
            <ShieldCheck size={14} /> {flash}
          </p>
        )}

        <button type="submit" className="btn-primary" style={{ width: "auto" }}>
          Create Class Section
        </button>
      </form>

      {/* Subject Teacher Mapping Desk */}
      <form className="card card-pad space-y" onSubmit={handleAssignSubjectTeacher}>
        <div>
          <p className="font-semibold text-sm row" style={{ margin: 0, gap: 6 }}>
            <BookOpen size={16} className="tone-info" /> Subject Teacher Mapping Desk
          </p>
          <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
            Assign subject specialist teachers to specific class sections.
          </p>
        </div>

        <div className="wa-meta-row">
          <label className="grow">
            <span className="text-xs font-medium muted">Class Section</span>
            <select
              className="input"
              value={mapClassId}
              onChange={(e) => setMapClassId(e.target.value)}
            >
              {classSections.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grow">
            <span className="text-xs font-medium muted">Subject</span>
            <select
              className="input"
              value={mapSubjectId}
              onChange={(e) => setMapSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span className="text-xs font-medium muted">Subject Teacher</span>
          <select
            className="input"
            value={mapTeacherId}
            onChange={(e) => setMapTeacherId(e.target.value)}
            required
          >
            <option value="">Select Subject Teacher...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.school || "Staff"})
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn-primary" style={{ width: "auto" }}>
          Map Subject Teacher
        </button>
      </form>

      {/* Academic Master Roster Overview */}
      <section className="card card-pad">
        <h2 className="font-semibold text-sm" style={{ margin: "0 0 8px" }}>
          Class Roster & Subject Mapping Matrix
        </h2>
        <ul className="leave-list">
          {classSections.map((c) => {
            const mappedSubs = subjectMappings.filter((m) => m.classSectionId === c.id);
            return (
              <li key={c.id} className="card card-pad">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <span className="font-bold text-sm">Class {c.label}</span>
                    <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                      Class Teacher: <strong>{c.classTeacherName || "Not assigned"}</strong> · Capacity: {c.studentCapacity}
                    </p>
                  </div>
                  <span className="leave-badge leave-approved">ACTIVE</span>
                </div>

                {mappedSubs.length > 0 && (
                  <div className="mt-2 text-xs" style={{ background: "var(--surface-soft)", padding: 8, borderRadius: 6 }}>
                    <strong>Subject Mappings:</strong>
                    <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                      {mappedSubs.map((m) => (
                        <li key={m.id}>
                          {m.subjectName}: <strong>{m.teacherName}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
