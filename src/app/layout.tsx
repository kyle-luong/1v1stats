/**
 * Root Layout
 * Main layout component that wraps all pages
 * Includes global styles, fonts, and providers
 */

import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Isostat - Basketball 1v1 Statistics",
  description: "Track and analyze statistics from 1v1 basketball videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable} font-sans`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
