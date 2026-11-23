"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/lobby";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Invalid credentials");
      }

      login(data.accessToken, data.user, data.refreshToken);
      router.push(redirectTarget);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-sm text-lilac/70">
          Sign in to jump back into your synchronized watch parties
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-magenta/40 bg-magenta/10 p-3.5 text-xs sm:text-sm font-medium text-magenta backdrop-blur-sm"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-lilac/80">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@gmail.com"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-lilac/30 focus:border-ultraviolet focus:ring-2 focus:ring-ultraviolet/20 focus:outline-none transition"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-lilac/80">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 pr-12 text-sm text-white placeholder:text-lilac/30 focus:border-ultraviolet focus:ring-2 focus:ring-ultraviolet/20 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lilac/50 hover:text-white transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-white text-ink py-4 px-6 text-sm font-bold shadow-lg transition hover:bg-lilac active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-ink" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Sign in to PartyWatch</span>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs sm:text-sm text-lilac/70">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${redirectTarget !== "/lobby" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
          className="font-bold text-mint hover:underline hover:text-mint/90 transition"
        >
          Create one now &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-lilac/60">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
