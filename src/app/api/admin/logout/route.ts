/**
 * Admin Logout API Route
 * Clears session cookie and invalidates session token
 */

import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get("admin_session")?.value;

    // Clear session from memory if it exists
    if (sessionToken) {
      clearAdminSession(sessionToken);
    }

    // Create response and clear cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.delete("admin_session");

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
