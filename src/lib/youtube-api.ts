// src/lib/youtube-api.ts
// YouTube Data API v3 integration for channel scraping
// Handles channel metadata fetching and video listing

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeChannelSnippet {
  title: string;
  description: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
}

interface YouTubeChannelStatistics {
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

interface YouTubeChannelItem {
  id: string;
  snippet: YouTubeChannelSnippet;
  statistics: YouTubeChannelStatistics;
}

interface YouTubeChannelResponse {
  items: YouTubeChannelItem[];
}

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
    maxres?: { url: string };
  };
}

interface YouTubeVideoContentDetails {
  duration: string; // ISO 8601 format, e.g., "PT5M30S"
}

interface YouTubeVideoItem {
  id: { videoId: string } | string;
  snippet: YouTubeVideoSnippet;
  contentDetails?: YouTubeVideoContentDetails;
}

interface YouTubeSearchResponse {
  items: YouTubeVideoItem[];
  nextPageToken?: string;
}

interface YouTubeVideoListResponse {
  items: Array<{
    id: string;
    contentDetails: YouTubeVideoContentDetails;
  }>;
}

export interface ChannelInfo {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
}

export interface VideoInfo {
  youtubeId: string;
  title: string;
  description: string;
  channelName: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  duration: number; // seconds
}

function getApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Parse ISO 8601 duration to seconds
 * e.g., "PT5M30S" -> 330, "PT1H2M3S" -> 3723
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Resolve a YouTube handle (@handle) to channel ID
 */
async function resolveHandleToChannelId(handle: string): Promise<string | null> {
  const apiKey = getApiKey();
  const url = `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as YouTubeChannelResponse;
  return data.items[0]?.id ?? null;
}

/**
 * Resolve a custom URL or username to channel ID
 */
async function resolveCustomUrlToChannelId(customName: string): Promise<string | null> {
  const apiKey = getApiKey();
  // Try searching for the channel by name
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(customName)}&maxResults=1&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const item = data.items[0];
  if (item && typeof item.id === "object" && "channelId" in item.id) {
    return (item.id as { channelId: string }).channelId;
  }
  return null;
}

/**
 * Extract YouTube channel ID from various URL formats
 * Supports:
 * - https://www.youtube.com/channel/UC... (channel ID)
 * - https://www.youtube.com/@handle (handle)
 * - https://www.youtube.com/c/CustomName (custom URL)
 * - https://www.youtube.com/user/Username (legacy)
 * - UC... (raw channel ID)
 */
export async function extractChannelId(input: string): Promise<string | null> {
  // If it's already a channel ID (starts with UC)
  if (input.startsWith("UC") && input.length === 24) {
    return input;
  }

  try {
    const url = new URL(input);

    // Handle youtube.com URLs
    if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com"
    ) {
      const pathParts = url.pathname.split("/").filter(Boolean);

      // Direct channel ID: /channel/UC...
      if (pathParts[0] === "channel" && pathParts[1]?.startsWith("UC")) {
        return pathParts[1];
      }

      // Handle: /@handle
      if (pathParts[0]?.startsWith("@")) {
        const handle = pathParts[0].slice(1);
        return await resolveHandleToChannelId(handle);
      }

      // Custom URL: /c/CustomName or /user/Username
      if (pathParts[0] === "c" || pathParts[0] === "user") {
        const customName = pathParts[1];
        if (customName) {
          return await resolveCustomUrlToChannelId(customName);
        }
      }
    }

    return null;
  } catch {
    // Not a URL, try treating as handle
    if (input.startsWith("@")) {
      const resolved = await resolveHandleToChannelId(input.slice(1));
      return resolved;
    }
    return null;
  }
}

/**
 * Fetch channel information from YouTube Data API
 */
export async function getChannelInfo(channelId: string): Promise<ChannelInfo> {
  const apiKey = getApiKey();
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as YouTubeChannelResponse;
  const channel = data.items[0];

  if (!channel) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  return {
    id: channel.id,
    name: channel.snippet.title,
    description: channel.snippet.description,
    thumbnailUrl:
      channel.snippet.thumbnails.high?.url ??
      channel.snippet.thumbnails.medium?.url ??
      channel.snippet.thumbnails.default?.url ??
      "",
    subscriberCount: parseInt(channel.statistics.subscriberCount, 10) || 0,
  };
}

/**
 * Fetch recent videos from a channel
 * Returns videos published after the specified date (if provided)
 */
export async function getChannelVideos(
  channelId: string,
  options: {
    since?: Date;
    maxResults?: number;
  } = {}
): Promise<VideoInfo[]> {
  const apiKey = getApiKey();
  const maxResults = options.maxResults ?? 50;

  // Build search URL
  let searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${apiKey}`;

  if (options.since) {
    searchUrl += `&publishedAfter=${options.since.toISOString()}`;
  }

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`YouTube API error: ${searchResponse.status} ${searchResponse.statusText}`);
  }

  const searchData = (await searchResponse.json()) as YouTubeSearchResponse;

  if (searchData.items.length === 0) {
    return [];
  }

  // Extract video IDs to fetch durations
  const videoIds = searchData.items
    .map((item) => (typeof item.id === "object" ? item.id.videoId : item.id))
    .join(",");

  // Fetch video details for durations
  const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
  const detailsResponse = await fetch(detailsUrl);

  let durationsMap: Map<string, number> = new Map();
  if (detailsResponse.ok) {
    const detailsData = (await detailsResponse.json()) as YouTubeVideoListResponse;
    durationsMap = new Map(
      detailsData.items.map((item) => [
        item.id,
        parseDuration(item.contentDetails.duration),
      ])
    );
  }

  // Combine search results with durations
  return searchData.items.map((item) => {
    const videoId = typeof item.id === "object" ? item.id.videoId : item.id;
    return {
      youtubeId: videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelName: item.snippet.channelTitle,
      thumbnailUrl:
        item.snippet.thumbnails.maxres?.url ??
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
      uploadedAt: new Date(item.snippet.publishedAt),
      duration: durationsMap.get(videoId) ?? 0,
    };
  });
}

/**
 * Validate that a channel ID exists
 */
export async function validateChannelId(channelId: string): Promise<boolean> {
  try {
    await getChannelInfo(channelId);
    return true;
  } catch {
    return false;
  }
}
