"use client";

import { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/lobby";
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    if (!password) {
      return { score: 0, label: "", colorClass: "bg-white/10", textClass: "text-lilac/40" };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;

    if (score <= 1) {
      return { score: 1, label: "Weak", colorClass: "bg-magenta", textClass: "text-magenta" };
    }
    if (score === 2 || score === 3) {
      return { score: 2, label: "Good", colorClass: "bg-yellow-400", textClass: "text-yellow-400" };
    }
    return { score: 3, label: "Strong", colorClass: "bg-mint", textClass: "text-mint" };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          (Array.isArray(data?.errors) ? data.errors[0]?.message : null) ||
          "Registration failed"
        );
      }

      login(data.accessToken, data.user, data.refreshToken);
      router.push(redirectTarget);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          Create account
        </h1>
        <p className="text-sm text-lilac/70">
          Get your PartyWatch ID to host and sync videos
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
          <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-lilac/80">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="cool_watcher"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-lilac/30 focus:border-ultraviolet focus:ring-2 focus:ring-ultraviolet/20 focus:outline-none transition"
          />
        </div>

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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-lilac/80">
              Password
            </label>
            {password && (
              <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthInfo.textClass}`}>
                {strengthInfo.label}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
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

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-lilac/80">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 pr-12 text-sm text-white placeholder:text-lilac/30 focus:border-ultraviolet focus:ring-2 focus:ring-ultraviolet/20 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lilac/50 hover:text-white transition cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-ultraviolet text-white py-4 px-6 text-sm font-bold shadow-lg shadow-ultraviolet/30 transition hover:bg-ultraviolet/85 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-white" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create PartyWatch Account</span>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs sm:text-sm text-lilac/70">
        Already have an account?{" "}
        <Link
          href={`/login${redirectTarget !== "/lobby" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
          className="font-bold text-mint hover:underline hover:text-mint/90 transition"
        >
          Sign in here &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-lilac/60">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
