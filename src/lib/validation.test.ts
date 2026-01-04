// src/lib/validation.test.ts
// Tests for form validation utilities

import { describe, it, expect } from "vitest";
import { validateGameStats, formatGameStatsForNote } from "./validation";

describe("validateGameStats", () => {
  describe("empty inputs", () => {
    it("returns valid when all fields are empty", () => {
      const result = validateGameStats({
        player1Name: "",
        player2Name: "",
        player1Score: "",
        player2Score: "",
      });
      expect(result.isValid).toBe(true);
      expect(result.hasGameStats).toBe(false);
    });

    it("returns valid when all fields are whitespace", () => {
      const result = validateGameStats({
        player1Name: "   ",
        player2Name: "  ",
        player1Score: " ",
        player2Score: "",
      });
      expect(result.isValid).toBe(true);
      expect(result.hasGameStats).toBe(false);
    });
  });

  describe("partial inputs", () => {
    it("returns error when only player1Name is provided", () => {
      const result = validateGameStats({
        player1Name: "Cash",
        player2Name: "",
        player1Score: "",
        player2Score: "",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("fill in all");
    });

    it("returns error when only scores are provided", () => {
      const result = validateGameStats({
        player1Name: "",
        player2Name: "",
        player1Score: "21",
        player2Score: "18",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("fill in all");
    });

    it("returns error when one score is missing", () => {
      const result = validateGameStats({
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "21",
        player2Score: "",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("fill in all");
    });
  });

  describe("valid complete inputs", () => {
    it("returns valid with typical scores", () => {
      const result = validateGameStats({
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "21",
        player2Score: "18",
      });
      expect(result.isValid).toBe(true);
      expect(result.hasGameStats).toBe(true);
    });

    it("returns valid with zero score", () => {
      const result = validateGameStats({
        player1Name: "Player A",
        player2Name: "Player B",
        player1Score: "21",
        player2Score: "0",
      });
      expect(result.isValid).toBe(true);
      expect(result.hasGameStats).toBe(true);
    });

    it("returns valid with high scores", () => {
      const result = validateGameStats({
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "35",
        player2Score: "33",
      });
      expect(result.isValid).toBe(true);
      expect(result.hasGameStats).toBe(true);
    });
  });

  describe("invalid scores", () => {
    it("returns error for negative scores", () => {
      const result = validateGameStats({
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "-5",
        player2Score: "21",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("positive");
    });

    it("returns error for non-numeric scores", () => {
      const result = validateGameStats({
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "abc",
        player2Score: "21",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("valid numbers");
    });

    it("returns error for unrealistically high scores", () => {
      const result = validateGameStats({
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "100",
        player2Score: "21",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("unrealistic");
    });
  });
});

describe("formatGameStatsForNote", () => {
  it("formats game stats correctly without existing note", () => {
    const result = formatGameStatsForNote(
      {
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "21",
        player2Score: "18",
      },
      ""
    );
    expect(result).toBe("[GAME DATA] Cash: 21 vs Hezi: 18");
  });

  it("prepends game stats to existing note", () => {
    const result = formatGameStatsForNote(
      {
        player1Name: "Cash",
        player2Name: "Hezi",
        player1Score: "21",
        player2Score: "18",
      },
      "Great game!"
    );
    expect(result).toBe("[GAME DATA] Cash: 21 vs Hezi: 18\n\nGreat game!");
  });

  it("trims player names", () => {
    const result = formatGameStatsForNote(
      {
        player1Name: "  Cash  ",
        player2Name: "  Hezi  ",
        player1Score: "21",
        player2Score: "18",
      },
      ""
    );
    expect(result).toBe("[GAME DATA] Cash: 21 vs Hezi: 18");
  });
});
