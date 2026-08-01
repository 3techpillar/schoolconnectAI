"use client";

import { useState } from "react";
import type { UserProfile } from "@/lib/providers/auth";
import { isSchoolAdmin } from "@/lib/providers/auth";
import { useEnrollment } from "@/lib/providers/enrollment";

export function EnrollmentDesk({
  actor,
  onFlash,
}: {
  actor: UserProfile;
  onFlash?: (msg: string) => void;
}) {
  const {
    inviteTeacher,
    revokeInvite,
    addStudentEnrollment,
    reviewEnrollment,
    pendingEnrollmentsFor,
    pendingInvitesForSchool,
    invites,
    enrollments,
  } = useEnrollment();

  const [tName, setTName] = useState("");
  const [tId, setTId] = useState("");
  const [tClass, setTClass] = useState("6-B");
  const [sName, setSName] = useState("");
  const [sClass, setSClass] = useState(actor.className?.split("-")[0] || "6");
  const [sSection, setSSection] = useState(
    actor.className?.split("-")[1] || "B",
  );
  const [sPhone, setSPhone] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  const canInvite = isSchoolAdmin(actor) || actor.role === "principal";
  const canAddStudent =
    canInvite || actor.role === "class_teacher";
  const pending = pendingEnrollmentsFor(actor);
  const schoolInvites = pendingInvitesForSchool(actor.school);

  const flash = (msg: string) => onFlash?.(msg);

  if (!canInvite && !canAddStudent) {
    return (
      <section className="card card-pad">
        <p className="text-sm muted">
          Only school admin / principal can invite teachers. Class teachers can
          add and approve students for their class.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y">
      {canInvite && (
        <form
          className="card card-pad space-y"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!tName.trim() || !tId.trim()) return;
            try {
              const invite = await inviteTeacher({
                actor,
                name: tName,
                identifier: tId,
                className: tClass,
                role: "class_teacher",
              });
              setLastCode(invite.code);
              setTName("");
              setTId("");
              flash(`Invite sent · code ${invite.code}`);
            } catch (err) {
              flash(err instanceof Error ? err.message : "Invite failed");
            }
          }}
        >
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Invite teacher
          </p>
          <p className="text-11 muted" style={{ margin: 0 }}>
            Teacher registers with this phone/email + invite code to get full
            access.
          </p>
          <label>
            <span className="text-xs font-medium muted">Teacher name</span>
            <input
              className="input"
              value={tName}
              onChange={(e) => setTName(e.target.value)}
              placeholder="Ms. Kapoor"
              required
            />
          </label>
          <label>
            <span className="text-xs font-medium muted">Phone or email</span>
            <input
              className="input"
              value={tId}
              onChange={(e) => setTId(e.target.value)}
              placeholder="+91 98… or name@school.edu"
              required
            />
          </label>
          <label>
            <span className="text-xs font-medium muted">Class (optional)</span>
            <input
              className="input"
              value={tClass}
              onChange={(e) => setTClass(e.target.value)}
              placeholder="6-B"
            />
          </label>
          <button type="submit" className="btn-primary">
            Create invite
          </button>
          {lastCode && (
            <p className="text-sm tone-success" style={{ margin: 0 }}>
              Share code <strong>{lastCode}</strong> with the teacher.
            </p>
          )}
        </form>
      )}

      {canAddStudent && (
        <form
          className="card card-pad space-y"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!sName.trim()) return;
            try {
              const row = await addStudentEnrollment({
                actor,
                studentName: sName,
                className: sClass,
                section: sSection,
                identifier: sPhone || undefined,
              });
              setSName("");
              setSPhone("");
              flash(
                `Added ${row.studentName} to ${row.className} — pending approval until they register & you approve.`,
              );
            } catch (err) {
              flash(err instanceof Error ? err.message : "Add student failed");
            }
          }}
        >
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Add student to class
          </p>
          <p className="text-11 muted" style={{ margin: 0 }}>
            Student can register as usual, but full app access waits until you
            (or admin) approve enrollment for class &amp; section.
          </p>
          <label>
            <span className="text-xs font-medium muted">Student name</span>
            <input
              className="input"
              value={sName}
              onChange={(e) => setSName(e.target.value)}
              placeholder="Aarav Sharma"
              required
            />
          </label>
          <div className="wa-meta-row">
            <label className="grow">
              <span className="text-xs font-medium muted">Class</span>
              <input
                className="input"
                value={sClass}
                onChange={(e) => setSClass(e.target.value)}
                placeholder="6"
                required
              />
            </label>
            <label className="grow">
              <span className="text-xs font-medium muted">Section</span>
              <input
                className="input"
                value={sSection}
                onChange={(e) => setSSection(e.target.value)}
                placeholder="B"
                required
              />
            </label>
          </div>
          <label>
            <span className="text-xs font-medium muted">
              Phone / email (optional — links on signup)
            </span>
            <input
              className="input"
              value={sPhone}
              onChange={(e) => setSPhone(e.target.value)}
              placeholder="+91 …"
            />
          </label>
          <button type="submit" className="btn-primary">
            Add student (pending)
          </button>
        </form>
      )}

      <section className="card card-pad">
        <p className="font-semibold text-sm" style={{ margin: 0 }}>
          Pending enrollments ({pending.length})
        </p>
        {pending.length === 0 && (
          <p className="text-11 muted mt-2" style={{ marginBottom: 0 }}>
            No pending student approvals.
          </p>
        )}
        <ul className="leave-list mt-2">
          {pending.map((e) => (
            <li key={e.id} className="card card-pad" style={{ boxShadow: "none" }}>
              <p className="font-semibold text-sm" style={{ margin: 0 }}>
                {e.studentName}
              </p>
              <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
                {e.className} · Sec {e.section}
                {e.identifier ? ` · ${e.identifier}` : ""}
                {e.note ? ` · ${e.note}` : ""}
              </p>
              <div className="row mt-2" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: "auto", padding: "0.4rem 0.85rem" }}
                  onClick={() => {
                    void reviewEnrollment(e.id, "approved", actor);
                    flash(`Approved ${e.studentName}`);
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    void reviewEnrollment(e.id, "rejected", actor);
                    flash(`Rejected ${e.studentName}`);
                  }}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canInvite && (
        <section className="card card-pad">
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Open teacher invites ({schoolInvites.length})
          </p>
          <ul className="leave-list mt-2">
            {schoolInvites.map((i) => (
              <li key={i.id} className="card card-pad" style={{ boxShadow: "none" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ margin: 0 }}>
                      {i.name}
                    </p>
                    <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                      {i.identifier} · code <strong>{i.code}</strong>
                      {i.className ? ` · ${i.className}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-11 tone-destructive font-semibold"
                    onClick={() => {
                      void revokeInvite(i.id, actor);
                      flash("Invite revoked");
                    }}
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
            {schoolInvites.length === 0 && (
              <p className="text-11 muted" style={{ margin: 0 }}>
                No open invites.
              </p>
            )}
          </ul>
          <p className="text-11 muted mt-2" style={{ marginBottom: 0 }}>
            Recent: {invites.filter((i) => i.status === "accepted").length}{" "}
            accepted ·{" "}
            {enrollments.filter((e) => e.status === "approved").length} students
            approved
          </p>
        </section>
      )}
    </div>
  );
}
