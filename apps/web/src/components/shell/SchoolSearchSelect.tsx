"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/shared/api-client";

export type PublicSchoolOption = {
  id: string;
  name: string;
  city?: string;
  code?: string;
  branchName?: string;
  productMode?: string;
};

type Props = {
  valueId: string;
  valueLabel: string;
  onChange: (school: PublicSchoolOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function SchoolSearchSelect({
  valueId,
  valueLabel,
  onChange,
  disabled,
  placeholder = "Search and select your school",
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<PublicSchoolOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      const qs = query.trim()
        ? `?q=${encodeURIComponent(query.trim())}`
        : "";
      apiFetch<{ schools: PublicSchoolOption[] }>(`/api/schools/public${qs}`)
        .then((res) => {
          if (!cancelled) setSchools(res.schools || []);
        })
        .catch((err) => {
          if (!cancelled) {
            setLoadError(
              err instanceof Error ? err.message : "Could not load schools",
            );
            setSchools([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, query ? 200 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return schools;
    const q = query.trim().toLowerCase();
    return schools.filter((s) => {
      const hay = `${s.name} ${s.city || ""} ${s.code || ""} ${s.branchName || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [schools, query]);

  const display =
    open || !valueId
      ? query
      : valueLabel || schools.find((s) => s.id === valueId)?.name || "";

  return (
    <div className="school-select" ref={wrapRef}>
      <div className="school-select-control">
        <input
          className="input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          onFocus={() => {
            setOpen(true);
            if (valueId && !query) setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (valueId) onChange(null);
          }}
          autoComplete="off"
        />
        {valueId ? (
          <button
            type="button"
            className="school-select-clear"
            aria-label="Clear school"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setQuery("");
              setOpen(true);
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {open && (
        <ul id={listId} className="school-select-list" role="listbox">
          {loading && (
            <li className="school-select-empty muted">Loading schools…</li>
          )}
          {!loading && loadError && (
            <li className="school-select-empty error-text">{loadError}</li>
          )}
          {!loading && !loadError && filtered.length === 0 && (
            <li className="school-select-empty muted">
              No registered school found. Ask your school admin to create the
              school first.
            </li>
          )}
          {!loading &&
            filtered.map((s) => (
              <li key={s.id} role="option" aria-selected={s.id === valueId}>
                <button
                  type="button"
                  className={`school-select-option ${s.id === valueId ? "active" : ""}`}
                  onClick={() => {
                    onChange(s);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="school-select-name">{s.name}</span>
                  <span className="school-select-meta muted">
                    {[s.branchName, s.city, s.code].filter(Boolean).join(" · ") ||
                      "Registered school"}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
