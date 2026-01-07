/**
 * Videos Listing Page
 * Displays all publicly visible videos (SCRAPED + APPROVED) with category filters
 * Users can browse content and contribute data for uncategorized videos
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { trpc } from "@/lib/trpc/Provider";
import { VideoCategory } from "@prisma/client";
import { VideoCardSkeleton } from "@/components/ui/video-card-skeleton";

// Category display configuration
const CATEGORY_CONFIG: Record<VideoCategory, { label: string; color: string }> = {
  UNCATEGORIZED: { label: "Uncategorized", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  ONE_V_ONE: { label: "1v1", color: "bg-primary/10 text-primary" },
  SPAR: { label: "Spar", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" },
  TWO_V_TWO: { label: "2v2", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200" },
  THREE_V_THREE: { label: "3v3", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200" },
  FIVE_V_FIVE: { label: "5v5", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200" },
  TAG_TEAM: { label: "Tag Team", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200" },
  REACTION: { label: "Reaction", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" },
  MISC: { label: "Misc", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

type FilterOption = "ALL" | VideoCategory;

export default function VideosPage() {
  const [filter, setFilter] = useState<FilterOption>("ALL");

  const { data: videos, isLoading, error } = trpc.video.getPublicVideos.useQuery({
    category: filter === "ALL" ? undefined : filter,
    limit: 100,
  });

  // Filter options to show in UI
  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "UNCATEGORIZED", label: "Needs Data" },
    { value: "ONE_V_ONE", label: "1v1" },
    { value: "TWO_V_TWO", label: "2v2" },
    { value: "THREE_V_THREE", label: "3v3" },
    { value: "FIVE_V_FIVE", label: "5v5" },
    { value: "SPAR", label: "Spar" },
    { value: "TAG_TEAM", label: "Tag Team" },
    { value: "REACTION", label: "Reaction" },
    { value: "MISC", label: "Misc" },
  ];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-semibold uppercase tracking-wide">Videos</h1>
          <p className="mt-2 text-muted-foreground">
            Browse 1v1 basketball content from top channels
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-destructive">Failed to Load Videos</h2>
            <p className="text-sm text-muted-foreground">
              There was an error loading videos. Please try refreshing the page.
            </p>
          </div>
        )}

        {/* eslint-disable react/no-array-index-key */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <VideoCardSkeleton key={`video-skeleton-${i}`} />
            ))}
          </div>
        )}
        {/* eslint-enable react/no-array-index-key */}

        {!isLoading && !error && videos && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => {
              const isUncategorized = video.category === VideoCategory.UNCATEGORIZED;
              const has1v1Game = video.category === VideoCategory.ONE_V_ONE && video.game;
              const categoryConfig = CATEGORY_CONFIG[video.category];

              // Determine link destination
              let href = video.url; // Default to YouTube
              let isExternal = true;

              if (has1v1Game && video.game) {
                href = `/games/${video.game.id}`;
                isExternal = false;
              } else if (isUncategorized) {
                href = `/submit?video=${video.id}`;
                isExternal = false;
              }

              const CardWrapper = isExternal ? "a" : Link;
              const cardProps = isExternal
                ? { href, target: "_blank", rel: "noopener noreferrer" }
                : { href };

              return (
                <CardWrapper
                  key={video.id}
                  {...cardProps}
                  className="group cursor-pointer overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No Thumbnail
                      </div>
                    )}
                    {/* Duration badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {/* Category badge */}
                    <div className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium ${categoryConfig.color}`}>
                      {categoryConfig.label}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 line-clamp-2 font-semibold leading-tight">{video.title}</h3>
                    <p className="mb-3 text-sm text-muted-foreground">{video.channelName}</p>

                    {/* 1v1 Game Info */}
                    {has1v1Game && video.game && (
                      <div className="space-y-2 border-t pt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{video.game.player1.name}</span>
                          <span className="font-bold">{video.game.player1Score}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{video.game.player2.name}</span>
                          <span className="font-bold">{video.game.player2Score}</span>
                        </div>
                        {video.isCompetitive && (
                          <div className="text-xs text-primary">Competitive</div>
                        )}
                      </div>
                    )}

                    {/* Uncategorized CTA */}
                    {isUncategorized && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Help categorize this video
                        </div>
                      </div>
                    )}

                    {/* Non-1v1 approved content */}
                    {!isUncategorized && !has1v1Game && (
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        Watch on YouTube
                      </div>
                    )}
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        )}

        {!isLoading && !error && (!videos || videos.length === 0) && (
          <div className="py-12 text-center text-muted-foreground">
            {filter === "UNCATEGORIZED" ? (
              <>
                <p className="mb-4">No videos need categorization right now!</p>
                <Link href="/submit" className="text-primary hover:underline">
                  Submit a new video
                </Link>
              </>
            ) : (
              <p>No videos found. Check back soon!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
