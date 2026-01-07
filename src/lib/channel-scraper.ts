// src/lib/channel-scraper.ts
// Channel scraping logic for Phase 1.5 - automated video discovery
// Fetches videos from whitelisted YouTube channels and creates Video records

import { PrismaClient, VideoStatus, VideoCategory } from "@prisma/client";
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
 *
 * @param db - Prisma client instance
 * @param channelId - Internal channel ID (not YouTube channel ID)
 * @param options - Scraping options
 */
export async function scrapeChannel(
  db: PrismaClient,
  channelId: string,
  options: {
    fullScrape?: boolean; // If true, fetch all videos regardless of lastScrapedAt
  } = {}
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

    if (!channel.isActive) {
      result.errors.push(`Channel is not active: ${channel.name}`);
      return result;
    }

    result.channelName = channel.name;

    // Determine scrape parameters
    const since = options.fullScrape ? undefined : channel.lastScrapedAt ?? undefined;

    // Fetch videos from YouTube API
    const videos = await getChannelVideos(channel.youtubeChannelId, {
      since,
      maxResults: 50,
      maxPages: options.fullScrape ? 100 : 5, // Full scrape allows more pages
    });

    result.videosFound = videos.length;

    if (videos.length === 0) {
      // Still update lastScrapedAt even if no new videos
      await db.channel.update({
        where: { id: channelId },
        data: { lastScrapedAt: new Date() },
      });
      return result;
    }

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

    // Create new video records sequentially to handle rate limits and avoid race conditions
    // eslint-disable-next-line no-restricted-syntax
    for (const video of newVideos) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await db.video.create({
          data: {
            youtubeId: video.youtubeId,
            url: getYoutubeWatchUrl(video.youtubeId),
            title: video.title,
            channelName: video.channelName,
            thumbnailUrl: video.thumbnailUrl || getYoutubeThumbnail(video.youtubeId),
            uploadedAt: video.uploadedAt,
            duration: video.duration,
            status: VideoStatus.SCRAPED,
            category: VideoCategory.UNCATEGORIZED,
            isCompetitive: false,
            channelId: channel.id,
            scrapedAt: new Date(),
          },
        });
        result.videosCreated += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Skip duplicates silently (race condition handling)
        if (!message.includes("Unique constraint")) {
          result.errors.push(`Failed to create video ${video.youtubeId}: ${message}`);
        }
      }
    }

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
 * Scrape all channels that are due for daily scraping
 * Only scrapes channels with scrapeFrequency="daily" that haven't been scraped today
 */
export async function scrapeAllDueChannels(db: PrismaClient): Promise<ScrapeAllResult> {
  const result: ScrapeAllResult = {
    channelsProcessed: 0,
    totalVideosCreated: 0,
    results: [],
    errors: [],
  };

  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find channels due for scraping
    const channels = await db.channel.findMany({
      where: {
        isActive: true,
        scrapeFrequency: "daily",
        OR: [
          { lastScrapedAt: null }, // Never scraped
          { lastScrapedAt: { lt: oneDayAgo } }, // Not scraped in last 24 hours
        ],
      },
    });

    // Process channels sequentially to avoid rate limits
    // eslint-disable-next-line no-restricted-syntax
    for (const channel of channels) {
      // eslint-disable-next-line no-await-in-loop
      const scrapeResult = await scrapeChannel(db, channel.id, { fullScrape: false });
      result.results.push(scrapeResult);
      result.channelsProcessed += 1;
      result.totalVideosCreated += scrapeResult.videosCreated;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to scrape channels: ${message}`);
  }

  return result;
}

/**
 * Add a new channel to the database
 * Fetches channel info from YouTube and creates the database record
 */
export async function addChannel(
  db: PrismaClient,
  youtubeChannelId: string,
  options: {
    scrapeFrequency?: string;
  } = {}
): Promise<{ channel: Awaited<ReturnType<typeof db.channel.create>> }> {
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
      isActive: true,
      scrapeFrequency: options.scrapeFrequency ?? "daily",
    },
  });

  return { channel };
}

