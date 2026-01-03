/**
 * Admin Navigation Sidebar
 * Navigation component for admin pages with logout functionality
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const adminLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "📊",
  },
  {
    href: "/admin/videos",
    label: "Videos",
    icon: "🎥",
  },
  {
    href: "/admin/channels",
    label: "Channels",
    icon: "📺",
  },
  {
    href: "/admin/players",
    label: "Players",
    icon: "👤",
  },
  {
    href: "/admin/games",
    label: "Games",
    icon: "🏀",
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-card">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">Isostat Admin</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className="mr-3 text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t p-4">
            {userEmail && (
              <div className="mb-3 truncate text-xs text-muted-foreground">
                {userEmail}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex h-16 items-center justify-between border-b bg-card px-4">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">Isostat Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="rounded-md p-2 hover:bg-secondary"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-b bg-card px-2 py-3">
            <nav className="space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span className="mr-3 text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 border-t pt-4">
              {userEmail && (
                <div className="mb-3 truncate px-3 text-xs text-muted-foreground">
                  {userEmail}
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
