/**
 * Feedback Page
 * Public form for bug reports, feature requests, and data corrections
 */

"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { trpc } from "@/lib/trpc/client";
import { FeedbackType } from "@prisma/client";
import { Bug, Lightbulb, AlertCircle, MessageSquare } from "lucide-react";

const feedbackTypes = [
  {
    type: FeedbackType.BUG_REPORT,
    label: "Bug Report",
    description: "Report technical issues",
    icon: Bug,
    color: "text-red-600 dark:text-red-400",
    bgColor: "hover:bg-red-50 dark:hover:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  {
    type: FeedbackType.FEATURE_REQUEST,
    label: "Feature Request",
    description: "Suggest improvements",
    icon: Lightbulb,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "hover:bg-yellow-50 dark:hover:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  {
    type: FeedbackType.DATA_CORRECTION,
    label: "Data Issue",
    description: "Report incorrect stats",
    icon: AlertCircle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "hover:bg-orange-50 dark:hover:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    type: FeedbackType.GENERAL,
    label: "General",
    description: "Other feedback",
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
];

export default function FeedbackPage() {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Spam prevention
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submitMutation = trpc.feedback.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Honeypot check
    if (honeypot) {
      setError("Spam detected");
      return;
    }

    if (!selectedType) {
      setError("Please select a feedback type");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        type: selectedType,
        title,
        description,
        email: email || undefined,
        name: name || undefined,
      });

      // Reset form
      setSelectedType(null);
      setTitle("");
      setDescription("");
      setEmail("");
      setName("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl">
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
                Your feedback has been submitted. We'll review it and get back to you if needed.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
              >
                Submit More Feedback
              </button>
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
          <h1 className="mb-4 text-center font-heading text-4xl font-semibold uppercase tracking-wide md:text-5xl">
            Feedback
          </h1>
          <p className="mb-8 text-center text-lg text-muted-foreground">
            Help us improve 1v1stats
          </p>

          <div className="rounded border bg-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selector */}
              <div>
                <span className="mb-3 block font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Feedback Type *
                </span>
                <div role="radiogroup" aria-label="Feedback Type" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.type;
                    return (
                      <button
                        key={type.type}
                        type="button"
                        onClick={() => setSelectedType(type.type)}
                        className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition ${
                          isSelected
                            ? `${type.borderColor} bg-muted`
                            : "border-border hover:border-muted-foreground"
                        } ${type.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 ${type.color}`} />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  required
                  maxLength={200}
                  className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details..."
                  required
                  rows={6}
                  maxLength={5000}
                  className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {description.length}/5000 characters
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-heading text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Contact Info (Optional)
                </h3>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    We may contact you for follow-up
                  </p>
                </div>

                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Error */}
              {error && (
                <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitMutation.isPending || !selectedType || !title || !description}
                className="w-full rounded bg-primary px-4 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
