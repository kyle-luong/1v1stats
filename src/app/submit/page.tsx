/**
 * Public Video Submission Page
 * Allows anyone to submit 1v1 basketball videos for the platform
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { extractYoutubeId, getYoutubeThumbnail, isValidYoutubeUrl } from "@/lib/youtube";
import Link from "next/link";

export default function SubmitVideoPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterNote, setSubmitterNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

    try {
      await submitMutation.mutateAsync({
        url,
        youtubeId,
        title,
        channelName,
        thumbnailUrl: getYoutubeThumbnail(youtubeId),
        submitterEmail: submitterEmail || undefined,
        submitterNote: submitterNote || undefined,
      });

      setSuccess(true);
      // Clear form
      setUrl("");
      setTitle("");
      setChannelName("");
      setSubmitterEmail("");
      setSubmitterNote("");
      setTermsAccepted(false);
    } catch (_err) {
      setError("Failed to submit video. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary">
        <div className="mx-4 w-full max-w-2xl">
          <div className="space-y-6 rounded-lg border bg-card p-8 text-center">
            <div className="text-6xl">✓</div>
            <h1 className="text-3xl font-bold">Thank You!</h1>
            <p className="text-muted-foreground">
              Your video has been submitted and will be reviewed by our team.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Submit Another Video
              </button>
              <Link
                href="/videos"
                className="rounded-lg bg-secondary px-6 py-3 font-medium text-secondary-foreground transition hover:bg-secondary/80"
              >
                View All Videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold">Submit a 1v1 Video</h1>
            <p className="text-muted-foreground">
              Help us build the largest database of 1v1 basketball games
            </p>
          </div>

          <div className="rounded-lg border bg-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  We may contact you if we have questions about this video
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium">
                  Note (optional)
                </label>
                <textarea
                  id="note"
                  value={submitterNote}
                  onChange={(e) => setSubmitterNote(e.target.value)}
                  placeholder="This game was insane! Found it on The Next Chapter's channel"
                  maxLength={500}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  {submitterNote.length}/500 characters
                </p>
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1"
                  required
                />
                <label htmlFor="terms" className="text-sm">
                  I confirm this is a 1v1 basketball game video
                </label>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="h-10 w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Video"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
