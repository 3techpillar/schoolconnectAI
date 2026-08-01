"use client";

import type { ReactNode } from "react";

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <p className="muted text-sm" style={{ margin: "1rem 0" }}>
      {label}
    </p>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "0.75rem 1rem",
        marginBottom: "0.75rem",
        borderColor: "transparent",
        background: "color-mix(in srgb, #fecaca 35%, transparent)",
      }}
      role="alert"
    >
      <p className="text-sm" style={{ margin: 0 }}>
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          className="text-11 tone-primary font-medium"
          style={{ marginTop: 6, background: "none", border: 0, padding: 0 }}
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ padding: "1.5rem 0.5rem", textAlign: "center" }}>
      <p className="font-medium text-sm" style={{ margin: 0 }}>
        {title}
      </p>
      {body ? (
        <p className="text-11 muted" style={{ margin: "0.35rem 0 0" }}>
          {body}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: "0.75rem" }}>{action}</div> : null}
    </div>
  );
}
