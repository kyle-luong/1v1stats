/**
 * Videos Listing Page
 * Displays grid of completed videos with thumbnails, titles, and game info
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc/Provider";
import { VideoStatus, VerificationStatus } from "@prisma/client";
import { VideoCardSkeleton } from "@/components/ui/video-card-skeleton";

function getVerificationBadge(status: VerificationStatus) {
  switch (status) {
    case "VERIFIED":
      return { label: "Verified", className: "bg-emerald-100 text-emerald-700" };
    case "PARTIAL":
      return { label: "Partial", className: "bg-orange-100 text-orange-700" };
    default:
      return null; // Don't show badge for unverified
  }
}

export default function VideosPage() {
  const [filter, setFilter] = useState<"all" | "with-games">("all");

  const { data: videos, isLoading, error } = trpc.video.getAll.useQuery({
    status: VideoStatus.COMPLETED,
    limit: 100,
  });

  const filteredVideos = videos?.filter((video) => {
    if (filter === "with-games") {
      return video.game !== null;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">Videos</h1>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Videos
            </button>
            <button
              type="button"
              onClick={() => setFilter("with-games")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "with-games"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              With Games
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-destructive">
              Failed to Load Videos
            </h2>
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

        {!isLoading && !error && filteredVideos && filteredVideos.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((video) => (
              <Link
                key={video.id}
                href={video.game ? `/games/${video.game.id}` : "#"}
                className={
                  video.game
                    ? "group cursor-pointer overflow-hidden rounded-lg border bg-card transition hover:shadow-lg"
                    : "group cursor-default overflow-hidden rounded-lg border bg-card opacity-75 transition hover:shadow-lg"
                }
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
                  {/* Verification Badge */}
                  {getVerificationBadge(video.verificationStatus) && (
                    <div className="absolute right-2 top-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          getVerificationBadge(video.verificationStatus)?.className
                        }`}
                      >
                        {getVerificationBadge(video.verificationStatus)?.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-1 line-clamp-2 font-semibold leading-tight">
                    {video.title}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">{video.channelName}</p>

                  {video.game ? (
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {video.game.player1.name}
                        </span>
                        <span className="font-bold">{video.game.player1Score}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {video.game.player2.name}
                        </span>
                        <span className="font-bold">{video.game.player2Score}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="border-t pt-3 text-xs text-muted-foreground">
                      No game data yet
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        {!isLoading && !error && (!filteredVideos || filteredVideos.length === 0) && (
          <div className="py-12 text-center text-muted-foreground">
            No videos found. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
