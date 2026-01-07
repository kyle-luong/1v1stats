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



interface YouTubePlaylistItemSnippet {
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  resourceId: {
    kind: string;
    videoId: string;
  };
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
    maxres?: { url: string };
  };
}

interface YouTubePlaylistItem {
  id: string;
  snippet: YouTubePlaylistItemSnippet;
}

interface YouTubePlaylistItemsResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface YouTubeVideoListResponse {
  items: Array<{
    id: string;
    contentDetails: YouTubeVideoContentDetails;
    snippet?: YouTubeVideoSnippet;
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
 * Decode HTML entities in strings (YouTube API returns encoded titles)
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
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
 * Resolve a custom URL or username to channel ID via search
 */
async function resolveCustomUrlToChannelId(customName: string): Promise<string | null> {
  const apiKey = getApiKey();
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(customName)}&maxResults=1&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  interface ChannelSearchResponse {
    items: Array<{
      id: { channelId: string };
      snippet: { title: string };
    }>;
  }

  const data = (await response.json()) as ChannelSearchResponse;
  return data.items[0]?.id?.channelId ?? null;
}

/**
 * Extract YouTube channel ID from various URL formats
 * Supports:
 * - https://www.youtube.com/channel/UC... (channel ID)
 * - https://www.youtube.com/@handle (handle)
 * - https://www.youtube.com/c/CustomName (custom URL)
 * - https://www.youtube.com/user/Username (legacy)
 * - UC... (raw channel ID)
 * - @handle (raw handle)
 */
export async function extractChannelId(input: string): Promise<string | null> {
  const trimmed = input.trim();

  // If it's already a channel ID (starts with UC and is 24 chars)
  if (trimmed.startsWith("UC") && trimmed.length === 24) {
    return trimmed;
  }

  // If it's a raw handle
  if (trimmed.startsWith("@")) {
    return resolveHandleToChannelId(trimmed.slice(1));
  }

  try {
    const url = new URL(trimmed);

    // Handle youtube.com URLs
    if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
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
      if ((pathParts[0] === "c" || pathParts[0] === "user") && pathParts[1]) {
        return await resolveCustomUrlToChannelId(pathParts[1]);
      }
    }

    return null;
  } catch {
    // Not a valid URL, try as custom name search
    return resolveCustomUrlToChannelId(trimmed);
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
    name: decodeHtmlEntities(channel.snippet.title),
    description: decodeHtmlEntities(channel.snippet.description),
    thumbnailUrl:
      channel.snippet.thumbnails.high?.url ??
      channel.snippet.thumbnails.medium?.url ??
      channel.snippet.thumbnails.default?.url ??
      "",
    subscriberCount: parseInt(channel.statistics.subscriberCount, 10) || 0,
  };
}

/**
 * Convert a channel ID to its uploads playlist ID
 * YouTube channel IDs start with "UC", uploads playlists start with "UU"
 */
function getUploadsPlaylistId(channelId: string): string {
  if (channelId.startsWith("UC")) {
    return `UU${channelId.slice(2)}`;
  }
  throw new Error(`Invalid channel ID format: ${channelId}`);
}

/**
 * Fetch videos from a channel using the PlaylistItems API
 * This is more reliable than Search API and returns ALL videos
 * Used for bulk scraping - fetches all videos or videos since a date
 */
export async function getChannelVideos(
  channelId: string,
  options: {
    since?: Date;
    maxResults?: number; // Per page, max 50
    maxPages?: number; // Limit total pages for safety
  } = {}
): Promise<VideoInfo[]> {
  const apiKey = getApiKey();
  const maxResultsPerPage = Math.min(options.maxResults ?? 50, 50);
  const maxPages = options.maxPages ?? 200; // Safety limit: 10000 videos max

  // Get the uploads playlist ID for this channel
  const uploadsPlaylistId = getUploadsPlaylistId(channelId);

  const allVideos: VideoInfo[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;
  let reachedSinceDate = false;

  // Pagination requires sequential fetching - each page depends on the previous pageToken
  /* eslint-disable no-await-in-loop */
  do {
    // Build playlistItems URL
    let playlistUrl = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResultsPerPage}&key=${apiKey}`;

    if (pageToken) {
      playlistUrl += `&pageToken=${pageToken}`;
    }

    const playlistResponse = await fetch(playlistUrl);
    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text();
      throw new Error(
        `YouTube API error: ${playlistResponse.status} ${playlistResponse.statusText} - ${errorText}`
      );
    }

    const playlistData = (await playlistResponse.json()) as YouTubePlaylistItemsResponse;

    if (playlistData.items.length === 0) {
      break;
    }

    // Extract video IDs to fetch durations (batch fetch for efficiency)
    const videoIds = playlistData.items.map((item) => item.snippet.resourceId.videoId).join(",");

    // Fetch video details for durations
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);

    let durationsMap: Map<string, number> = new Map();
    if (detailsResponse.ok) {
      const detailsData = (await detailsResponse.json()) as YouTubeVideoListResponse;
      durationsMap = new Map(
        detailsData.items.map((item) => [item.id, parseDuration(item.contentDetails.duration)])
      );
    }

    // Combine playlist items with durations
    // Use standard for loop to avoid no-restricted-syntax (for-of) and no-loop-func (forEach)
    for (let i = 0; i < playlistData.items.length; i += 1) {
      const item = playlistData.items[i];
      const vidId = item.snippet.resourceId.videoId;
      const pubDate = new Date(item.snippet.publishedAt);
      
      if (options.since && pubDate < options.since) {
        reachedSinceDate = true;
      }

      allVideos.push({
        youtubeId: vidId,
        title: decodeHtmlEntities(item.snippet.title),
        description: item.snippet.description,
        channelName: decodeHtmlEntities(item.snippet.channelTitle),
        thumbnailUrl:
          item.snippet.thumbnails.maxres?.url ??
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url ??
          "",
        uploadedAt: pubDate,
        duration: durationsMap.get(vidId) ?? 0,
      });
    }

    // Stop if we've reached videos older than the 'since' date
    if (reachedSinceDate) {
      break;
    }

    pageToken = playlistData.nextPageToken;
    pageCount += 1;
  } while (pageToken && pageCount < maxPages);
  /* eslint-enable no-await-in-loop */

  return allVideos;
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

