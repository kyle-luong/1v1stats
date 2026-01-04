/**
 * Public Video Submission Page
 * Allows anyone to submit 1v1 basketball videos with optional game stats
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { extractYoutubeId, getYoutubeThumbnail, isValidYoutubeUrl } from "@/lib/youtube";
import { validateGameStats, formatGameStatsForNote } from "@/lib/validation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export default function SubmitVideoPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterNote, setSubmitterNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Optional game stats
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");

  const submitMutation = trpc.video.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate YouTube URL
    if (!isValidYoutubeUrl(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    const youtubeId = extractYoutubeId(url);
    if (!youtubeId) {
      setError("Could not extract video ID from URL");
      return;
    }

    if (!termsAccepted) {
      setError("Please confirm this is a 1v1 basketball game");
      return;
    }

    // Validate optional game stats (all-or-nothing with score validation)
    const gameStatsInput = { player1Name, player2Name, player1Score, player2Score };
    const gameStatsValidation = validateGameStats(gameStatsInput);
    if (!gameStatsValidation.isValid) {
      setError(gameStatsValidation.error || "Invalid game stats");
      return;
    }

    try {
      // Build note with game stats if provided.
      // Game stats are stored in the note field as structured text for admin processing.
      // This allows submitters to provide helpful data without requiring a database schema change.
      // Admins will manually parse this data when creating official Game records.
      const fullNote = gameStatsValidation.hasGameStats
        ? formatGameStatsForNote(gameStatsInput, submitterNote)
        : submitterNote;

      await submitMutation.mutateAsync({
        url,
        youtubeId,
        title,
        channelName,
        thumbnailUrl: getYoutubeThumbnail(youtubeId),
        submitterEmail: submitterEmail || undefined,
        submitterNote: fullNote || undefined,
      });

      setSuccess(true);
      // Clear form
      setUrl("");
      setTitle("");
      setChannelName("");
      setSubmitterEmail("");
      setSubmitterNote("");
      setPlayer1Name("");
      setPlayer2Name("");
      setPlayer1Score("");
      setPlayer2Score("");
      setTermsAccepted(false);
    } catch (_err) {
      setError("Failed to submit video. Please try again.");
    }
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
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide">
                Thank You
              </h1>
              <p className="text-muted-foreground">
                Your submission is pending review. Moderators will verify the game
                data before it appears on the site.
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
              {/* Video Information */}
              <div className="space-y-6">
                <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Video Information
                </h2>

                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium">
                    YouTube URL *
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Video Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Jordan vs LeBron - Epic 1v1 Battle"
                    required
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="channelName" className="text-sm font-medium">
                    Channel Name *
                  </label>
                  <input
                    id="channelName"
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="The Next Chapter"
                    required
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Game Stats (Optional) */}
              <div className="space-y-6 border-t pt-8">
                <div>
                  <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Game Stats (Optional)
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Help moderators by providing the final score
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="player1Name" className="text-sm font-medium">
                      Player 1 Name
                    </label>
                    <input
                      id="player1Name"
                      type="text"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="e.g., Cash"
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="player1Score" className="text-sm font-medium">
                      Score
                    </label>
                    <input
                      id="player1Score"
                      type="number"
                      min="0"
                      value={player1Score}
                      onChange={(e) => setPlayer1Score(e.target.value)}
                      placeholder="21"
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="player2Name" className="text-sm font-medium">
                      Player 2 Name
                    </label>
                    <input
                      id="player2Name"
                      type="text"
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      placeholder="e.g., Hezi"
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="player2Score" className="text-sm font-medium">
                      Score
                    </label>
                    <input
                      id="player2Score"
                      type="number"
                      min="0"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(e.target.value)}
                      placeholder="18"
                      className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Notes */}
              <div className="space-y-6 border-t pt-8">
                <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Contact & Notes
                </h2>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Your Email (optional)
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
                    Additional Notes (optional)
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
                  disabled={submitMutation.isPending}
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
