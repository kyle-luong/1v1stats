// src/app/api/cron/scrape-channels/route.ts
// Vercel Cron endpoint for automated channel scraping
// Runs daily at 2 AM UTC to fetch new videos from whitelisted channels

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { scrapeAllDueChannels } from "@/lib/channel-scraper";

export const maxDuration = 60; // 60 seconds for Hobby tier

/**
 * GET /api/cron/scrape-channels
 * Triggered by Vercel Cron or manually with CRON_SECRET header
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow Vercel's cron authorization header
  const vercelCronHeader = req.headers.get("x-vercel-cron");

  if (!vercelCronHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await scrapeAllDueChannels(db);

    return NextResponse.json({
      success: true,
      channelsProcessed: result.channelsProcessed,
      totalVideosCreated: result.totalVideosCreated,
      results: result.results.map((r) => ({
        channelName: r.channelName,
        videosCreated: r.videosCreated,
        videosSkipped: r.videosSkipped,
        errors: r.errors.length,
      })),
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Scrape failed", message },
      { status: 500 }
    );
  }
}
