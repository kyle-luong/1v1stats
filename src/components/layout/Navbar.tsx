// src/components/Navbar.tsx
// Public navigation bar with CraftedNBA-inspired styling and Contribute dropdown

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/games", label: "GAMES" },
  { href: "/players", label: "PLAYERS" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isContributeActive =
    pathname === "/submit" || pathname === "/donate" || pathname === "/feedback";

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-heading text-2xl font-semibold tracking-wide text-foreground">
              ISOSTAT
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-heading text-sm font-medium tracking-wider transition-colors hover:text-primary",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Contribute Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1 font-heading text-sm font-medium tracking-wider transition-colors hover:text-primary focus:outline-none",
                  isContributeActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                CONTRIBUTE
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href="/submit" className="w-full cursor-pointer">
                    Submit Games
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/donate" className="w-full cursor-pointer">
                    Donate
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/feedback" className="w-full cursor-pointer">
                    Feedback
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="pb-4 md:hidden">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-2 py-2 font-heading text-sm font-medium tracking-wider transition-colors hover:text-primary",
                    pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile Contribute Links */}
              <div className="border-t pt-2">
                <span className="px-2 py-1 font-heading text-xs font-medium tracking-wider text-muted-foreground">
                  CONTRIBUTE
                </span>
                <Link
                  href="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 text-sm transition-colors hover:text-primary",
                    pathname === "/submit"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  Submit Games
                </Link>
                <Link
                  href="/donate"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 text-sm transition-colors hover:text-primary",
                    pathname === "/donate"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  Donate
                </Link>
                <Link
                  href="/feedback"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 text-sm transition-colors hover:text-primary",
                    pathname === "/feedback"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  Feedback
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
