"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { apiFetch } from "@/lib/shared/api-client";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { BookOpen, Download, Plus, FileText, Paperclip } from "@/components/shell/Icons";

interface StudyMaterial {
  id: string;
  className: string;
  subject: string;
  title: string;
  description: string;
  chapter: string;
  kind: "pdf" | "video" | "link" | "notes" | "quiz";
  fileUrl: string;
  downloadCount: number;
  uploadedBy: string;
  createdAt: number;
}

const SUBJECT_LIST = ["All", "Math", "Science", "English", "Hindi", "Social Studies"];

export default function LearningHubPage() {
  const { user, ready, backend } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form state for upload
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Math");
  const [chapter, setChapter] = useState("");
  const [kind, setKind] = useState<"pdf" | "video" | "link" | "notes">("pdf");
  const [fileUrl, setFileUrl] = useState("");

  const isTeacherOrAdmin =
    user?.role === "class_teacher" ||
    user?.role === "subject_teacher" ||
    user?.role === "principal" ||
    user?.role === "admin";

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        if (backend) {
          const res = await apiFetch<{ materials: StudyMaterial[] }>("/api/learning");
          if (!cancelled && res.materials) {
            setMaterials(res.materials);
            return;
          }
        }
      } catch (err) {
        console.warn("Learning API fetch failed, falling back to offline materials.", err);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Offline Demo Fallback Materials
      if (!cancelled) {
        setMaterials([
          {
            id: "m1",
            className: user?.className || "Class 6-B",
            subject: "Math",
            title: "Chapter 4: Linear Equations & Graphs",
            description: "Complete formula sheet, solved practice examples and step-by-step graphical solutions.",
            chapter: "Chapter 4",
            kind: "pdf",
            fileUrl: "https://example.com/math_ch4.pdf",
            downloadCount: 42,
            uploadedBy: "Ms. Anjali Kapoor",
            createdAt: Date.now() - 86400000 * 2,
          },
          {
            id: "m2",
            className: user?.className || "Class 6-B",
            subject: "Science",
            title: "Photosynthesis & Plant Respiration 3D Diagram Notes",
            description: "High-resolution labeled diagrams with chapter summary questions for midterm prep.",
            chapter: "Chapter 6",
            kind: "notes",
            fileUrl: "https://example.com/science_ch6.pdf",
            downloadCount: 38,
            uploadedBy: "Mr. Rajesh Verma",
            createdAt: Date.now() - 86400000 * 4,
          },
          {
            id: "m3",
            className: user?.className || "Class 6-B",
            subject: "English",
            title: "Grammar Masterclass: Active vs Passive Voice",
            description: "Video lecture summary and interactive quiz worksheet.",
            chapter: "Grammar Unit 3",
            kind: "video",
            fileUrl: "https://example.com/english_voice",
            downloadCount: 29,
            uploadedBy: "Mrs. Sarah Thomas",
            createdAt: Date.now() - 86400000 * 6,
          },
        ]);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, backend]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMat: StudyMaterial = {
      id: `mat_${Date.now()}`,
      className: user?.className || "Class 6-B",
      subject,
      title: title.trim(),
      description: "Uploaded study material resource for student reference.",
      chapter: chapter.trim() || "General",
      kind,
      fileUrl: fileUrl.trim() || "#",
      downloadCount: 0,
      uploadedBy: user?.name || "Teacher",
      createdAt: Date.now(),
    };

    if (backend) {
      await apiFetch("/api/learning", {
        method: "POST",
        body: JSON.stringify(newMat),
      }).catch(() => null);
    }

    setMaterials((prev) => [newMat, ...prev]);
    setTitle("");
    setChapter("");
    setFileUrl("");
    setShowUploadModal(false);
  };

  const filtered = materials.filter((m) => {
    const matchesSubject = selectedSubject === "All" || m.subject === selectedSubject;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const getKindIcon = (kind: StudyMaterial["kind"]) => {
    switch (kind) {
      case "pdf":
        return <FileText size={18} className="text-red-500" />;
      case "video":
        return <BookOpen size={18} className="text-purple-500" />;
      case "link":
        return <Paperclip size={18} className="text-blue-500" />;
      default:
        return <BookOpen size={18} className="text-emerald-500" />;
    }
  };

  if (!ready || loading) {
    return (
      <PhoneShell title="Study Materials" subtitle="Learning Hub">
        <LoadingBlock label="Loading repository resources…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      title="Learning Hub"
      subtitle={`${user?.className || "Class 6-B"} · Study Resources`}
      headerAccent="plain"
    >
      {/* Hero Banner */}
      <section className="hw-student-hero mt-1">
        <div className="hw-student-banner-wrap">
          <Image
            src="/assets/learning/study_room_3d.jpg"
            alt="Learning Hub Study Room"
            width={720}
            height={405}
            priority
            className="hw-student-banner-img"
          />
          <div className="hw-student-banner-overlay">
            <span className="hw-hero-kicker">✨ Digital Resource Library</span>
            <h2 className="hw-hero-title">Study Materials & Notes 📖</h2>
            <p className="hw-hero-desc">
              Access chapter summaries, formula sheets, PDF guides, and video lectures.
            </p>
          </div>
        </div>
      </section>

      {/* Action Row & Subject Filters */}
      <div style={{ marginTop: 14, marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Search chapters or topics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{
              flex: 1,
              padding: "0.6rem 0.85rem",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: "0.85rem",
              marginRight: isTeacherOrAdmin ? 8 : 0,
            }}
          />
          {isTeacherOrAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              style={{
                borderRadius: "12px",
                padding: "0.6rem 0.95rem",
                fontSize: "0.82rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={() => setShowUploadModal(true)}
            >
              <Plus size={16} />
              <span>Upload</span>
            </button>
          )}
        </div>

        {/* Subject Filter Pills */}
        <div className="hw-subject-scroll">
          {SUBJECT_LIST.map((sub) => (
            <button
              key={sub}
              type="button"
              className={`hw-subject-pill-btn ${selectedSubject === sub ? "active" : ""}`}
              onClick={() => setSelectedSubject(sub)}
            >
              <span>{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid / List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No study materials found"
          body={
            searchQuery || selectedSubject !== "All"
              ? "Try adjusting your subject filter or search terms."
              : "No study materials have been uploaded for your class yet."
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((mat) => (
            <div
              key={mat.id}
              className="card"
              style={{
                borderRadius: "16px",
                padding: "1rem",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      background: "var(--primary-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getKindIcon(mat.kind)}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "var(--primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {mat.subject} · {mat.chapter}
                    </span>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "2px 0 0 0" }}>
                      {mat.title}
                    </h3>
                  </div>
                </div>

                <a
                  href={mat.fileUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    borderRadius: "10px",
                    padding: "0.45rem 0.75rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
              </div>

              {mat.description && (
                <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                  {mat.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  borderTop: "1px solid var(--border-soft)",
                  paddingTop: 8,
                  marginTop: 4,
                }}
              >
                <span>Uploaded by {mat.uploadedBy}</span>
                <span>{mat.downloadCount} downloads</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal for Teachers/Admins */}
      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 12 }}>
              Upload Study Material 📚
            </h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="text-xs font-bold mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Formula Sheet & Notes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="search-input"
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="text-xs font-bold mb-1 block">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="search-input"
                    style={{ width: "100%", padding: "0.6rem" }}
                  >
                    <option value="Math">Math</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Social Studies">Social Studies</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold mb-1 block">Resource Type</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as never)}
                    className="search-input"
                    style={{ width: "100%", padding: "0.6rem" }}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video Lecture</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="link">Web Resource Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block">Chapter / Unit Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4: Linear Equations"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="search-input"
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block">Resource File URL / Drive Link</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="search-input"
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
