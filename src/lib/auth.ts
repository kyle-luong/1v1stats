/**
 * Authentication Utilities
 * Helper functions for checking user permissions
 */

import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";

/**
 * Get current user from Supabase session
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if current user is an admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  return dbUser?.isAdmin ?? false;
}

/**
 * Require admin access or throw error
 */
export async function requireAdmin() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Unauthorized: Admin access required");
  }
}
