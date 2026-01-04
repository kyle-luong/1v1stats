/**
 * Admin Layout
 * Shared layout for all admin pages with sidebar navigation
 */

import { AdminNav } from "@/components/layout/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <AdminNav />
      {/* Desktop: offset for sidebar */}
      <main className="md:pl-64">
        {children}
      </main>
    </div>
  );
}
