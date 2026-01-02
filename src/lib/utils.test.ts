/**
 * Utility Functions Tests
 * Test suite for utility functions
 */

import { describe, it, expect } from "vitest";
import { calculateFGPercentage, calculatePPG, formatDate } from "./utils";

describe("calculateFGPercentage", () => {
  it("calculates correct percentage", () => {
    expect(calculateFGPercentage(7, 10)).toBe("70.0");
    expect(calculateFGPercentage(3, 8)).toBe("37.5");
  });

  it("handles zero attempts", () => {
    expect(calculateFGPercentage(0, 0)).toBe("0.0");
  });

  it("rounds to one decimal place", () => {
    expect(calculateFGPercentage(1, 3)).toBe("33.3");
  });
});

describe("calculatePPG", () => {
  it("calculates correct PPG", () => {
    expect(calculatePPG(100, 5)).toBe("20.0");
    expect(calculatePPG(77, 7)).toBe("11.0");
  });

  it("handles zero games", () => {
    expect(calculatePPG(0, 0)).toBe("0.0");
  });
});

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-15");
    const formatted = formatDate(date);
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2024");
  });
});
