// src/lib/channel-scraper.ts
// Channel scraping logic for Phase 1.5 - automated video discovery
// Fetches videos from whitelisted YouTube channels and creates Video records

import { PrismaClient, VideoStatus, VerificationStatus } from "@prisma/client";
import { getChannelVideos, getChannelInfo } from "./youtube-api";
import { getYoutubeWatchUrl, getYoutubeThumbnail } from "./youtube";

export interface ScrapeResult {
  channelId: string;
  channelName: string;
  videosFound: number;
  videosCreated: number;
  videosSkipped: number;
  errors: string[];
}

export interface ScrapeAllResult {
  channelsProcessed: number;
  totalVideosCreated: number;
  results: ScrapeResult[];
  errors: string[];
}

/**
 * Scrape a single channel for new videos
 * Creates Video records for videos not already in the database
 */
export async function scrapeChannel(
  db: PrismaClient,
  channelId: string
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    channelId,
    channelName: "",
    videosFound: 0,
    videosCreated: 0,
    videosSkipped: 0,
    errors: [],
  };

  try {
    // Get channel from database
    const channel = await db.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      result.errors.push(`Channel not found in database: ${channelId}`);
      return result;
    }

    if (!channel.isWhitelisted) {
      result.errors.push(`Channel is not whitelisted: ${channel.name}`);
      return result;
    }

    result.channelName = channel.name;

    // Fetch videos from YouTube API
    // Only fetch videos since last scrape (or all recent if never scraped)
    const videos = await getChannelVideos(channel.youtubeChannelId, {
      since: channel.lastScrapedAt ?? undefined,
      maxResults: 50,
    });

    result.videosFound = videos.length;

    // Get existing video YouTube IDs to avoid duplicates
    const existingVideos = await db.video.findMany({
      where: {
        youtubeId: { in: videos.map((v) => v.youtubeId) },
      },
      select: { youtubeId: true },
    });
    const existingIds = new Set(existingVideos.map((v) => v.youtubeId));

    // Filter to only new videos
    const newVideos = videos.filter((video) => !existingIds.has(video.youtubeId));
    result.videosSkipped = videos.length - newVideos.length;

    // Create new video records using Promise.all for parallel processing
    const createResults = await Promise.all(
      newVideos.map(async (video) => {
        try {
          await db.video.create({
            data: {
              youtubeId: video.youtubeId,
              url: getYoutubeWatchUrl(video.youtubeId),
              title: video.title,
              channelName: video.channelName,
              thumbnailUrl: video.thumbnailUrl || getYoutubeThumbnail(video.youtubeId),
              uploadedAt: video.uploadedAt,
              duration: video.duration,
              status: VideoStatus.PENDING,
              verificationStatus: VerificationStatus.UNVERIFIED,
              channelId: channel.id,
              scrapedAt: new Date(),
            },
          });
          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return { success: false, error: `Failed to create video ${video.youtubeId}: ${message}` };
        }
      })
    );

    // Count successes and collect errors
    createResults.forEach((createResult) => {
      if (createResult.success) {
        result.videosCreated += 1;
      } else if (createResult.error) {
        result.errors.push(createResult.error);
      }
    });

    // Update channel's lastScrapedAt timestamp
    await db.channel.update({
      where: { id: channelId },
      data: { lastScrapedAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Scrape failed: ${message}`);
  }

  return result;
}

/**
 * Scrape all whitelisted channels that are due for scraping
 */
export async function scrapeAllDueChannels(
  db: PrismaClient
): Promise<ScrapeAllResult> {
  const result: ScrapeAllResult = {
    channelsProcessed: 0,
    totalVideosCreated: 0,
    results: [],
    errors: [],
  };

  try {
    // Find channels due for scraping
    const now = new Date();
    const channels = await db.channel.findMany({
      where: {
        isWhitelisted: true,
        OR: [
          { lastScrapedAt: null }, // Never scraped
          {
            scrapeFrequency: "daily",
            lastScrapedAt: {
              lt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
            },
          },
          {
            scrapeFrequency: "weekly",
            lastScrapedAt: {
              lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            },
          },
        ],
      },
    });

    // Filter out "manual" frequency channels (they are only scraped on demand)
    const dueChannels = channels.filter((c) => c.scrapeFrequency !== "manual");

    // Process channels sequentially to avoid rate limits
    // Using reduce pattern to chain promises instead of for-of loop
    await dueChannels.reduce(async (previousPromise, channel) => {
      await previousPromise;
      const scrapeResult = await scrapeChannel(db, channel.id);
      result.results.push(scrapeResult);
      result.channelsProcessed += 1;
      result.totalVideosCreated += scrapeResult.videosCreated;
    }, Promise.resolve());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to scrape channels: ${message}`);
  }

  return result;
}

/**
 * Add a new channel to the whitelist
 * Fetches channel info from YouTube and creates the database record
 */
export async function addWhitelistedChannel(
  db: PrismaClient,
  youtubeChannelId: string,
  options: {
    scrapeFrequency?: string;
    scrapeImmediately?: boolean;
  } = {}
): Promise<{ channel: Awaited<ReturnType<typeof db.channel.create>>; scrapeResult?: ScrapeResult }> {
  // Fetch channel info from YouTube
  const channelInfo = await getChannelInfo(youtubeChannelId);

  // Create channel record
  const channel = await db.channel.create({
    data: {
      youtubeChannelId: channelInfo.id,
      name: channelInfo.name,
      description: channelInfo.description,
      thumbnailUrl: channelInfo.thumbnailUrl,
      subscriberCount: channelInfo.subscriberCount,
      isWhitelisted: true,
      scrapeFrequency: options.scrapeFrequency ?? "daily",
    },
  });

  // Optionally scrape immediately
  let scrapeResult: ScrapeResult | undefined;
  if (options.scrapeImmediately) {
    scrapeResult = await scrapeChannel(db, channel.id);
  }

  return { channel, scrapeResult };
}
