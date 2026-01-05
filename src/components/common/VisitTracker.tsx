// src/components/common/VisitTracker.tsx
// Silent component that tracks page visits on mount

"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";

export function VisitTracker() {
  const hasTracked = useRef(false);
  const trackVisit = trpc.siteStats.trackVisit.useMutation();

  useEffect(() => {
    // Only track once per page load
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackVisit.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally run once on mount
  }, []);

  return null;
}

