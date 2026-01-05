/**
 * YouTube Utility Functions
 * Helper functions for YouTube URL parsing and thumbnail generation
 */

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
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYoutubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle youtu.be short links
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1); // Remove leading slash
    }

    // Handle youtube.com links
    if (urlObj.hostname === "www.youtube.com" || urlObj.hostname === "youtube.com") {
      // Standard watch URLs
      const vParam = urlObj.searchParams.get("v");
      if (vParam) return vParam;

      // Embed URLs (/embed/VIDEO_ID)
      if (urlObj.pathname.startsWith("/embed/")) {
        const id = urlObj.pathname.split("/")[2];
        return id || null;
      }

      // Short URLs (/v/VIDEO_ID)
      if (urlObj.pathname.startsWith("/v/")) {
        const id = urlObj.pathname.split("/")[2];
        return id || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate YouTube thumbnail URL from video ID
 * Uses maxresdefault for highest quality
 */
export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Generate YouTube watch URL from video ID
 */
export function getYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Validate YouTube URL format
 */
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null;
}

/**
 * YouTube video metadata from Data API
 */
export interface YouTubeVideoMetadata {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  duration: number; // seconds
}

/**
 * Parse ISO 8601 duration (e.g., "PT1H2M3S") to seconds
 */
function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video metadata from YouTube Data API
 * Requires YOUTUBE_API_KEY environment variable
 */
export async function fetchYoutubeMetadata(videoId: string): Promise<YouTubeVideoMetadata> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is not set");
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const video = data.items[0];
  const { snippet, contentDetails } = video;

  return {
    title: decodeHtmlEntities(snippet.title),
    channelName: decodeHtmlEntities(snippet.channelTitle),
    thumbnailUrl:
      snippet.thumbnails?.maxres?.url ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      getYoutubeThumbnail(videoId),
    uploadedAt: new Date(snippet.publishedAt),
    duration: parseIsoDuration(contentDetails.duration),
  };
}
