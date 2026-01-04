// src/components/common/LoadingSpinner.test.tsx
// Unit tests for LoadingSpinner component

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeDefined();
    expect(spinner.className).toContain("animate-spin");
  });

  it("renders with custom class names", () => {
    render(<LoadingSpinner className="text-red-500" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("text-red-500");
  });

  it("renders with small size", () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-4 w-4");
  });

  it("renders with large size", () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-12 w-12");
  });
});
