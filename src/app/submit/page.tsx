/**
 * Public Video Submission Page
 * Allows anyone to submit 1v1 basketball games with required game stats
 * Auto-fetches video metadata from YouTube
 */

"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { extractYoutubeId, isValidYoutubeUrl } from "@/lib/youtube";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";

export default function SubmitVideoPage() {
  const [url, setUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterNote, setSubmitterNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Required game stats
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");

  const submitMutation = trpc.video.submit.useMutation();
  const utils = trpc.useUtils();

  // Fetch metadata when URL is valid
  const fetchMetadata = useCallback(
    async (videoId: string) => {
      setIsFetchingMetadata(true);
      setError("");
      try {
        const data = await utils.video.getYoutubeMetadata.fetch({ videoId });
        setTitle(data.title);
        setChannelName(data.channelName);
        setThumbnailUrl(data.thumbnailUrl);
        // data.uploadedAt is already a Date from superjson - use directly
        setUploadedAt(
          data.uploadedAt instanceof Date ? data.uploadedAt : new Date(data.uploadedAt)
        );
        setDuration(data.duration);
        setMetadataFetched(true);
      } catch (err) {
        setError(
          `Could not fetch video info: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setMetadataFetched(false);
      } finally {
        setIsFetchingMetadata(false);
      }
    },
    [utils.video.getYoutubeMetadata]
  );

  // Handle URL change
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate YouTube URL
    if (!youtubeId) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    if (!termsAccepted) {
      setError("Please confirm this is a 1v1 basketball game");
      return;
    }

    // Validate required game stats
    if (!player1Name.trim() || !player2Name.trim()) {
      setError("Please enter both player names");
      return;
    }

    const score1 = parseInt(player1Score, 10);
    const score2 = parseInt(player2Score, 10);

    if (Number.isNaN(score1) || Number.isNaN(score2)) {
      setError("Please enter valid scores for both players");
      return;
    }

    if (score1 < 0 || score2 < 0) {
      setError("Scores cannot be negative");
      return;
    }

    if (score1 === score2) {
      setError("Game cannot end in a tie. One player must win.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        url,
        youtubeId,
        title,
        channelName,
        thumbnailUrl: thumbnailUrl || undefined,
        uploadedAt: uploadedAt || undefined,
        duration: duration || undefined,
        submitterEmail: submitterEmail || undefined,
        submitterNote: submitterNote || undefined,
        player1Name: player1Name.trim(),
        player2Name: player2Name.trim(),
        player1Score: score1,
        player2Score: score2,
      });

      // Clear form
      setUrl("");
      setYoutubeId(null);
      setTitle("");
      setChannelName("");
      setThumbnailUrl(null);
      setUploadedAt(null);
      setDuration(null);
      setSubmitterEmail("");
      setSubmitterNote("");
      setPlayer1Name("");
      setPlayer2Name("");
      setPlayer1Score("");
      setPlayer2Score("");
      setTermsAccepted(false);
      setMetadataFetched(false);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit video. Please try again.");
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl">
            <div className="space-y-6 rounded border bg-card p-8 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide">
                Thank You
              </h1>
              <p className="text-muted-foreground">
                Your submission is pending review. Moderators will verify the game data before it
                appears on the site.
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
                  href="/games"
                  className="rounded border-2 border-primary bg-transparent px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary transition hover:bg-primary/10"
                >
                  View Games
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
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-heading text-4xl font-semibold uppercase tracking-wide md:text-5xl">
              Submit a Game
            </h1>
            <p className="text-lg text-muted-foreground">
              Help us build the largest database of 1v1 basketball games
            </p>
          </div>

          <div className="rounded border bg-card p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* YouTube URL */}
              <div className="space-y-4">
                <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Video
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
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {isFetchingMetadata && (
                    <p className="text-xs text-muted-foreground">Fetching video info...</p>
                  )}
                </div>

                {/* Video Preview */}
                {metadataFetched && thumbnailUrl && (
                  <div className="overflow-hidden rounded border bg-secondary/30">
                    <div className="flex gap-4 p-4">
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
                          <p className="mt-1 text-xs text-muted-foreground">
                            Duration: {formatDuration(duration)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual entry if auto-fetch failed */}
                {!metadataFetched && youtubeId && !isFetchingMetadata && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="title-manual" className="text-sm font-medium">
                        Video Title *
                      </label>
                      <input
                        id="title-manual"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter the video title"
                        required
                        className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="channelName-manual" className="text-sm font-medium">
                        Channel Name *
                      </label>
                      <input
                        id="channelName-manual"
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="e.g., The Next Chapter"
                        required
                        className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Game Stats (Required) */}
              <div className="space-y-6 border-t pt-8">
                <div>
                  <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Game Result
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter the final score for this matchup
                  </p>
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
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

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
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    We may contact you if we have questions
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="note" className="text-sm font-medium">
                    Additional Notes
                  </label>
                  <textarea
                    id="note"
                    value={submitterNote}
                    onChange={(e) => setSubmitterNote(e.target.value)}
                    placeholder="Any additional context about the game..."
                    maxLength={500}
                    rows={3}
                    className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    {submitterNote.length}/500 characters
                  </p>
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
                    I confirm this is a 1v1 basketball game video
                  </label>
                </div>

                {error && (
                  <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitMutation.isPending || !youtubeId || !title || !channelName}
                  className="w-full rounded bg-primary px-4 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Game"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
