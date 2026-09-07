"use client";

import type { ReactNode } from "react";
import { LaunchSplash } from "@/components/shell/LaunchSplash";
import { AppIcon, type AppIconTone, type IconComp } from "@/components/shell/AppIcon";
import { Inbox } from "@/components/shell/Icons";

export function LoadingBlock({
  label = "Loading…",
  splash = false,
}: {
  label?: string;
  splash?: boolean;
}) {
  if (splash) {
    return <LaunchSplash label={label} variant="full" />;
  }
  return (
    <div className="loading-inline-brand" role="status" aria-live="polite">
      <span className="loading-inline-dot" />
      <p className="muted text-sm" style={{ margin: 0 }}>
        {label}
      </p>
    </div>
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
    <div className="status-error-banner" role="alert">
      <p className="text-sm" style={{ margin: 0 }}>
        {message}
      </p>
      {onRetry ? (
        <button type="button" className="text-11 font-semibold tone-primary" onClick={onRetry}>
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
  icon,
  tone = "blue",
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: IconComp;
  tone?: AppIconTone;
}) {
  const Glyph = icon || Inbox;
  return (
    <div className="empty-state">
      <AppIcon icon={Glyph} tone={tone} size={22} />
      <p className="font-semibold text-sm empty-state-title">{title}</p>
      {body ? <p className="text-11 muted empty-state-body">{body}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
