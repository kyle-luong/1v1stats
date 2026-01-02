/**
 * YouTube Utility Functions
 * Helper functions for YouTube URL parsing and thumbnail generation
 */

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
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1); // Remove leading slash
    }

    // Handle youtube.com links
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      // Standard watch URLs
      const vParam = urlObj.searchParams.get('v');
      if (vParam) return vParam;

      // Embed URLs (/embed/VIDEO_ID)
      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/')[2];
      }

      // Short URLs (/v/VIDEO_ID)
      if (urlObj.pathname.startsWith('/v/')) {
        return urlObj.pathname.split('/')[2];
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
