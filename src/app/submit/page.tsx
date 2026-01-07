/**
 * Public Video Submission Page
 * Allows users to:
 * 1. Select from scraped videos that need categorization
 * 2. Submit new YouTube URLs with category and game data
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { extractYoutubeId, isValidYoutubeUrl } from "@/lib/youtube";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCategory } from "@prisma/client";

// Category display names
const CATEGORY_LABELS: Record<VideoCategory, string> = {
  UNCATEGORIZED: "Uncategorized",
  ONE_V_ONE: "1v1",
  SPAR: "Spar/Practice",
  TWO_V_TWO: "2v2",
  THREE_V_THREE: "3v3",
  FIVE_V_FIVE: "5v5",
  TAG_TEAM: "Tag Team",
  REACTION: "Reaction",
  MISC: "Misc",
};

interface SelectedVideo {
  id: string;
  youtubeId: string;
  url: string;
  title: string;
  channelName: string;
  thumbnailUrl: string | null;
  duration: number | null;
}

export default function SubmitVideoPage() {
  const searchParams = useSearchParams();
  const preselectedVideoId = searchParams.get("video");

  // Mode: "select" (pick from scraped) or "url" (enter new URL)
  const [mode, setMode] = useState<"select" | "url">("select");

  // Selected scraped video
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);

  // New URL submission
  const [url, setUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

  // Form fields
  const [category, setCategory] = useState<VideoCategory>(VideoCategory.ONE_V_ONE);
  const [isCompetitive, setIsCompetitive] = useState(true);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterNote, setSubmitterNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const utils = trpc.useUtils();

  // Fetch scraped videos for selection
  const scrapedVideos = trpc.video.getScrapedVideos.useQuery({ limit: 20 });

  // Fetch preselected video if ID provided
  const preselectedVideo = trpc.video.getById.useQuery(
    { id: preselectedVideoId || "" },
    { enabled: !!preselectedVideoId }
  );

  // Set preselected video when loaded
  useEffect(() => {
    if (preselectedVideo.data && preselectedVideoId) {
      setSelectedVideo({
        id: preselectedVideo.data.id,
        youtubeId: preselectedVideo.data.youtubeId,
        url: preselectedVideo.data.url,
        title: preselectedVideo.data.title,
        channelName: preselectedVideo.data.channelName,
        thumbnailUrl: preselectedVideo.data.thumbnailUrl,
        duration: preselectedVideo.data.duration,
      });
      setMode("select");
    }
  }, [preselectedVideo.data, preselectedVideoId]);

  const submitMutation = trpc.video.submit.useMutation();
  const submitDataMutation = trpc.video.submitDataForVideo.useMutation();

  // Fetch metadata for new URL
  const fetchMetadata = useCallback(
    async (videoId: string) => {
      setIsFetchingMetadata(true);
      setError("");
      try {
        const data = await utils.video.getYoutubeMetadata.fetch({ videoId });
        setTitle(data.title);
        setChannelName(data.channelName);
        setThumbnailUrl(data.thumbnailUrl);
        setUploadedAt(data.uploadedAt instanceof Date ? data.uploadedAt : new Date(data.uploadedAt));
        setDuration(data.duration);
        setMetadataFetched(true);
      } catch (err) {
        setError(`Could not fetch video info: ${err instanceof Error ? err.message : "Unknown error"}`);
        setMetadataFetched(false);
      } finally {
        setIsFetchingMetadata(false);
      }
    },
    [utils.video.getYoutubeMetadata]
  );

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (isValidYoutubeUrl(newUrl)) {
      const id = extractYoutubeId(newUrl);
      if (id && id !== youtubeId) {
        setYoutubeId(id);
        setMetadataFetched(false);
        setError("");
        fetchMetadata(id);
      }
    } else {
      setYoutubeId(null);
      setMetadataFetched(false);
    }
  };

  const handleSelectVideo = (video: SelectedVideo) => {
    setSelectedVideo(video);
    setMode("select");
  };

  const clearSelection = () => {
    setSelectedVideo(null);
    setMode("url");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Please confirm this is 1v1 basketball content");
      return;
    }

    // Validate 1v1 data
    if (category === VideoCategory.ONE_V_ONE) {
      if (!player1Name.trim() || !player2Name.trim()) {
        setError("Please enter both player names for 1v1");
        return;
      }
      const score1 = parseInt(player1Score, 10);
      const score2 = parseInt(player2Score, 10);
      if (Number.isNaN(score1) || Number.isNaN(score2)) {
        setError("Please enter valid scores");
        return;
      }
      if (score1 < 0 || score2 < 0) {
        setError("Scores cannot be negative");
        return;
      }
      if (score1 === score2) {
        setError("Game cannot end in a tie");
        return;
      }
    }

    try {
      if (selectedVideo) {
        // Submit data for existing scraped video
        await submitDataMutation.mutateAsync({
          videoId: selectedVideo.id,
          category,
          isCompetitive: category === VideoCategory.ONE_V_ONE ? isCompetitive : undefined,
          player1Name: category === VideoCategory.ONE_V_ONE ? player1Name.trim() : undefined,
          player2Name: category === VideoCategory.ONE_V_ONE ? player2Name.trim() : undefined,
          player1Score: category === VideoCategory.ONE_V_ONE ? parseInt(player1Score, 10) : undefined,
          player2Score: category === VideoCategory.ONE_V_ONE ? parseInt(player2Score, 10) : undefined,
          submitterEmail: submitterEmail || undefined,
          submitterNote: submitterNote || undefined,
        });
      } else {
        // Submit new URL
        if (!youtubeId || !metadataFetched) {
          setError("Please enter a valid YouTube URL");
          return;
        }

        await submitMutation.mutateAsync({
          url,
          youtubeId,
          title,
          channelName,
          thumbnailUrl: thumbnailUrl || undefined,
          uploadedAt: uploadedAt || undefined,
          duration: duration || undefined,
          category,
          isCompetitive: category === VideoCategory.ONE_V_ONE ? isCompetitive : undefined,
          player1Name: category === VideoCategory.ONE_V_ONE ? player1Name.trim() : undefined,
          player2Name: category === VideoCategory.ONE_V_ONE ? player2Name.trim() : undefined,
          player1Score: category === VideoCategory.ONE_V_ONE ? parseInt(player1Score, 10) : undefined,
          player2Score: category === VideoCategory.ONE_V_ONE ? parseInt(player2Score, 10) : undefined,
          submitterEmail: submitterEmail || undefined,
          submitterNote: submitterNote || undefined,
        });
      }

      // Reset form
      setSelectedVideo(null);
      setUrl("");
      setYoutubeId(null);
      setTitle("");
      setChannelName("");
      setThumbnailUrl(null);
      setUploadedAt(null);
      setDuration(null);
      setCategory(VideoCategory.ONE_V_ONE);
      setIsCompetitive(true);
      setPlayer1Name("");
      setPlayer2Name("");
      setPlayer1Score("");
      setPlayer2Score("");
      setSubmitterEmail("");
      setSubmitterNote("");
      setTermsAccepted(false);
      setMetadataFetched(false);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl">
            <div className="space-y-6 rounded border bg-card p-8 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide">Thank You</h1>
              <p className="text-muted-foreground">
                Your submission is pending review. Moderators will verify the data before it appears on the site.
              </p>
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
                >
                  Submit Another
                </button>
                <Link
                  href="/videos"
                  className="rounded border-2 border-primary bg-transparent px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary transition hover:bg-primary/10"
                >
                  Browse Videos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-heading text-4xl font-semibold uppercase tracking-wide md:text-5xl">
              Contribute Data
            </h1>
            <p className="text-lg text-muted-foreground">
              Help us build the largest database of 1v1 basketball games
            </p>
          </div>

          {/* Mode Selector */}
          <div className="mb-8 flex gap-2 rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("select")}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors ${
                mode === "select"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Select from Library
              {scrapedVideos.data && ` (${scrapedVideos.data.length})`}
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors ${
                mode === "url"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Enter YouTube URL
            </button>
          </div>

          {/* Video Selection Carousel */}
          {scrapedVideos.data && scrapedVideos.data.length > 0 && !selectedVideo && mode === "select" && (
            <div className="mb-8">
              <h2 className="mb-4 font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Videos Needing Data
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {scrapedVideos.data.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => handleSelectVideo(video)}
                    className="group flex-shrink-0 overflow-hidden rounded-lg border bg-card transition hover:border-primary hover:shadow-lg"
                    style={{ width: "200px" }}
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {video.thumbnailUrl ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover transition group-hover:scale-105"
                          />
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-2 top-2 z-10 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm transition hover:bg-red-700"
                          >
                            Watch ▶
                          </a>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No thumbnail
                        </div>
                      )}
                      {video.duration && (
                        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] text-white">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-xs font-medium">{video.title}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{video.channelName}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Form */}
          <div className="rounded border bg-card p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Selected Video Display */}
              {selectedVideo && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Selected Video
                    </h2>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex gap-4 rounded border bg-secondary/30 p-4">
                    <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded">
                      {selectedVideo.thumbnailUrl ? (
                        <Image src={selectedVideo.thumbnailUrl} alt={selectedVideo.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted text-xs text-muted-foreground">
                          No thumbnail
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-semibold">{selectedVideo.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedVideo.channelName}</p>
                      {selectedVideo.duration && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Duration: {formatDuration(selectedVideo.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* URL Input (when not selecting from scraped) */}
              {!selectedVideo && mode === "url" && (
                <div className="space-y-4">
                  <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Video URL
                  </h2>
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      YouTube URL *
                    </label>
                    <input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {isFetchingMetadata && <p className="text-xs text-muted-foreground">Fetching video info...</p>}
                  </div>

                  {/* Video Preview */}
                  {metadataFetched && thumbnailUrl && (
                    <div className="flex gap-4 rounded border bg-secondary/30 p-4">
                      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded">
                        <Image src={thumbnailUrl} alt={title} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 font-semibold">{title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{channelName}</p>
                        {uploadedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Uploaded {uploadedAt.toLocaleDateString()}
                          </p>
                        )}
                        {duration && (
                          <p className="mt-1 text-xs text-muted-foreground">Duration: {formatDuration(duration)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category Selection */}
              <div className="space-y-4 border-t pt-8">
                <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Category *
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([key]) => key !== "UNCATEGORIZED")
                    .map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key as VideoCategory)}
                        className={`rounded px-3 py-2 text-sm font-medium transition ${
                          category === key
                            ? "bg-primary text-primary-foreground"
                            : "border bg-background hover:bg-secondary"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                </div>
              </div>

              {/* Game Stats (1v1 only) */}
              {category === VideoCategory.ONE_V_ONE && (
                <div className="space-y-6 border-t pt-8">
                  <div>
                    <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Game Result
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">Enter the final score for this matchup</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="competitive"
                      type="checkbox"
                      checked={isCompetitive}
                      onChange={(e) => setIsCompetitive(e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    <label htmlFor="competitive" className="text-sm font-medium">
                      Competitive Game
                    </label>
                    <span className="text-xs text-muted-foreground">(will affect player statistics)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="player1Name" className="text-sm font-medium">
                        Player 1 Name *
                      </label>
                      <input
                        id="player1Name"
                        type="text"
                        value={player1Name}
                        onChange={(e) => setPlayer1Name(e.target.value)}
                        placeholder="e.g., Cash"
                        required
                        className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="player1Score" className="text-sm font-medium">
                        Score *
                      </label>
                      <input
                        id="player1Score"
                        type="number"
                        min="0"
                        value={player1Score}
                        onChange={(e) => setPlayer1Score(e.target.value)}
                        placeholder="21"
                        required
                        className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="-my-2 flex items-center justify-center">
                    <span className="font-heading text-sm font-bold text-muted-foreground">VS</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="player2Name" className="text-sm font-medium">
                        Player 2 Name *
                      </label>
                      <input
                        id="player2Name"
                        type="text"
                        value={player2Name}
                        onChange={(e) => setPlayer2Name(e.target.value)}
                        placeholder="e.g., Hezi"
                        required
                        className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="player2Score" className="text-sm font-medium">
                        Score *
                      </label>
                      <input
                        id="player2Score"
                        type="number"
                        min="0"
                        value={player2Score}
                        onChange={(e) => setPlayer2Score(e.target.value)}
                        placeholder="18"
                        required
                        className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Notes */}
              <div className="space-y-6 border-t pt-8">
                <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Contact & Notes (Optional)
                </h2>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Your Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">We may contact you if we have questions</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="note" className="text-sm font-medium">
                    Additional Notes
                  </label>
                  <textarea
                    id="note"
                    value={submitterNote}
                    onChange={(e) => setSubmitterNote(e.target.value)}
                    placeholder="Any additional context..."
                    maxLength={500}
                    rows={3}
                    className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">{submitterNote.length}/500 characters</p>
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="space-y-6 border-t pt-8">
                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input"
                    required
                  />
                  <label htmlFor="terms" className="text-sm">
                    I confirm this is 1v1 basketball related content
                  </label>
                </div>

                {error && <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                <button
                  type="submit"
                  disabled={
                    submitMutation.isPending ||
                    submitDataMutation.isPending ||
                    (!selectedVideo && (!youtubeId || !metadataFetched))
                  }
                  className="w-full rounded bg-primary px-4 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitMutation.isPending || submitDataMutation.isPending ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
