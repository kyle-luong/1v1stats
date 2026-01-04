// src/components/common/EmptyState.test.tsx
// Unit tests for EmptyState component

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No results found"
        description="Try adjusting your search terms."
      />
    );
    
    expect(screen.getByText("No results found")).toBeDefined();
    expect(screen.getByText("Try adjusting your search terms.")).toBeDefined();
  });

  it("renders with action link", () => {
    render(
      <EmptyState 
        title="Empty" 
        actionLabel="Retry" 
        actionHref="/retry" 
      />
    );
    
    expect(screen.getByText("Retry")).toBeDefined();
    expect(screen.getByRole("link")).toBeDefined();
  });

  it("renders with action button", () => {
    const handleAction = () => {};
    render(
      <EmptyState 
        title="Empty" 
        actionLabel="Retry" 
        onAction={handleAction} 
      />
    );
    
    expect(screen.getByText("Retry")).toBeDefined();
    expect(screen.getByRole("button")).toBeDefined();
  });
});
