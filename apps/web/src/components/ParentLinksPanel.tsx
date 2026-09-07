"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";
import type { UserProfile } from "@/lib/providers/auth";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { GraduationCap, ShieldCheck } from "@/components/shell/Icons";

type LinkedStudent = {
  id: string;
  name: string;
  className?: string;
  identifier?: string;
};

type LinkRow = {
  id: string;
  studentUserId: string;
  relationship: string;
  status: string;
  primary: boolean;
  student?: LinkedStudent | null;
};

type Props = {
  user: UserProfile;
  onLinked?: (studentName: string) => void;
};

export function ParentLinksPanel({ user, onLinked }: Props) {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [relationship, setRelationship] = useState<
    "father" | "mother" | "guardian" | "other"
  >("guardian");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ links: LinkRow[] }>("/api/links");
      setLinks(res.links || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load links");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    if (!studentIdentifier.trim()) return;
    setBusy(true);
    setFlash(null);
    setError(null);
    try {
      const res = await apiFetch<{
        created: boolean;
        student: { name: string; className?: string };
      }>("/api/links", {
        method: "POST",
        body: JSON.stringify({
          studentIdentifier: studentIdentifier.trim(),
          relationship,
        }),
      });
      setStudentIdentifier("");
      setFlash(
        res.created
          ? `Linked to ${res.student.name}`
          : `Already linked to ${res.student.name}`,
      );
      onLinked?.(res.student.name);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link failed");
    } finally {
      setBusy(false);
    }
  }

  async function setPrimary(id: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/links/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ primary: true }),
      });
      // Clear primary on siblings locally after reload
      await load();
      setFlash("Primary child updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/links/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "revoked" }),
      });
      await load();
      setFlash("Link removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove link");
    } finally {
      setBusy(false);
    }
  }

  if (user.role !== "parent") return null;

  return (
    <section className="card card-pad mt-3 space-y">
      <div>
        <p className="font-semibold text-sm" style={{ margin: 0 }}>
          Linked children
        </p>
        <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
          Connect your account to a student login (phone/email). Attendance,
          leave and home then use that child.
        </p>
      </div>

      {loading ? (
        <LoadingBlock label="Loading links…" />
      ) : links.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          tone="blue"
          title="No children linked yet"
          body="Enter the student’s registered phone or email below."
        />
      ) : (
        <ul className="leave-list" style={{ margin: 0 }}>
          {links.map((l) => (
            <li key={l.id} className="card card-pad" style={{ boxShadow: "none" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="grow">
                  <p className="font-semibold text-sm" style={{ margin: 0 }}>
                    {l.student?.name || "Student"}
                    {l.primary ? (
                      <span className="leave-badge leave-approved" style={{ marginLeft: 8 }}>
                        primary
                      </span>
                    ) : null}
                  </p>
                  <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
                    {l.relationship}
                    {l.student?.className ? ` · ${l.student.className}` : ""}
                    {l.student?.identifier ? ` · ${l.student.identifier}` : ""}
                  </p>
                </div>
              </div>
              <div className="row mt-2" style={{ gap: 8 }}>
                {!l.primary && (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => void setPrimary(l.id)}
                  >
                    Make primary
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => void revoke(l.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="space-y" onSubmit={(e) => void createLink(e)}>
        <label>
          <span className="text-xs font-medium muted">
            Student phone or email
          </span>
          <input
            className="input"
            value={studentIdentifier}
            onChange={(e) => setStudentIdentifier(e.target.value)}
            placeholder="student@demo.com"
            autoComplete="off"
            required
          />
        </label>
        <label>
          <span className="text-xs font-medium muted">Relationship</span>
          <select
            className="input"
            value={relationship}
            onChange={(e) =>
              setRelationship(
                e.target.value as "father" | "mother" | "guardian" | "other",
              )
            }
          >
            <option value="guardian">Guardian</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="other">Other</option>
          </select>
        </label>
        {error && <p className="error-text">{error}</p>}
        {flash && (
          <p className="text-11 tone-success row" style={{ gap: 6, margin: 0 }}>
            <ShieldCheck size={14} /> {flash}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Linking…" : "Link child account"}
        </button>
      </form>
    </section>
  );
}
