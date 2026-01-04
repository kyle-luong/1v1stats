/**
 * Admin Layout
 * Shared layout for all admin pages with sidebar navigation
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/layout/AdminNav";
import { trpc } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = trpc.user.getMe.useQuery();

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null; // Don't render anything while redirecting
  }

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
