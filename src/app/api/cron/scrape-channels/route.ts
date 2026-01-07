// src/app/api/cron/scrape-channels/route.ts
// Cron endpoint for automated channel scraping
// Called daily by Vercel Cron to fetch new videos from whitelisted channels

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { scrapeAllDueChannels } from "@/lib/channel-scraper";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development only
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scrapeAllDueChannels(db);

    return NextResponse.json({
      success: true,
      channelsProcessed: result.channelsProcessed,
      totalVideosCreated: result.totalVideosCreated,
      results: result.results.map((r) => ({
        channelName: r.channelName,
        videosFound: r.videosFound,
        videosCreated: r.videosCreated,
        videosSkipped: r.videosSkipped,
        errors: r.errors,
      })),
      errors: result.errors,
    });
  } catch (error) {
    console.error("Cron scrape failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

