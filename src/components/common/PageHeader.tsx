// src/components/common/PageHeader.tsx
// Reusable page header component with title and optional subtitle

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}

/**
 * Consistent page header styling across the application.
 */
export function PageHeader({
  title,
  subtitle,
  className = "",
  centered = false,
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${centered ? "text-center" : ""} ${className}`}>
      <h1 className="font-heading text-4xl font-semibold uppercase tracking-wide md:text-5xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
