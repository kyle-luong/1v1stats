/**
 * Signup Page
 * Create new account with email/password via Supabase
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createUser = trpc.user.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Send verification email and redirect back to login after confirmation
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Failed to create account");
        setIsLoading(false);
        return;
      }

      // Create user record in database using tRPC (bypasses RLS)
      try {
        await createUser.mutateAsync({
          id: authData.user.id,
          email: authData.user.email!,
          name: name || undefined,
        });
      } catch (dbErr) {
        console.error("Error creating user record:", dbErr);
        // Continue anyway - user is authenticated, though profile might be missing
      }

      // Show verification instructions instead of redirect
      setSuccessMessage(
        `Verification link sent to ${email}. Please check your inbox (and spam folder), verify your email, then sign in with the same credentials.`
      );
      setIsLoading(false);
    } catch (_err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary">
      <div className="mx-4 w-full max-w-md">
        <div className="space-y-6 rounded-lg border bg-card p-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Create Account</h1>
            <p className="text-sm text-muted-foreground">Join the 1v1stats community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={isLoading || !!successMessage}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading || !!successMessage}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading || !!successMessage}
                required
                minLength={6}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="h-10 w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
