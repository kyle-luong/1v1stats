// src/components/common/EmptyState.tsx
// Reusable empty state component for when there's no data to display

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Displays a friendly message when there's no data to show.
 * Optionally includes a call-to-action button.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`py-12 text-center ${className}`}>
      <h3 className="mb-2 font-heading text-lg font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {description && (
        <p className="mb-6 text-muted-foreground">{description}</p>
      )}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="inline-block rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
