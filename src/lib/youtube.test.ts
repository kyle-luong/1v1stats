// src/lib/youtube.test.ts
// Unit tests for YouTube utility functions

import { describe, it, expect } from "vitest";
import { extractYoutubeId, isValidYoutubeUrl, getYoutubeThumbnail } from "./youtube";

describe("YouTube Utilities", () => {
  describe("extractYoutubeId", () => {
    it("extracts ID from standard watch URL", () => {
      expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });
    
    it("extracts ID from short URL", () => {
      expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });
    
    it("extracts ID from embed URL", () => {
      expect(extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("returns null for invalid URLs", () => {
      expect(extractYoutubeId("https://example.com")).toBe(null);
      expect(extractYoutubeId("invalid")).toBe(null);
    });

    it("handles embed URLs without ID safely", () => {
      expect(extractYoutubeId("https://www.youtube.com/embed/")).toBe(null);
    });
  });

  describe("isValidYoutubeUrl", () => {
    it("returns true for valid URLs", () => {
      expect(isValidYoutubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    });

    it("returns false for invalid URLs", () => {
      expect(isValidYoutubeUrl("https://example.com")).toBe(false);
    });
  });

  describe("getYoutubeThumbnail", () => {
    it("returns maxresdefault thumbnail URL", () => {
      expect(getYoutubeThumbnail("123")).toBe("https://img.youtube.com/vi/123/maxresdefault.jpg");
    });
  });
});
