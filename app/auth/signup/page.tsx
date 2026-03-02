"use client";

import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms of Service to continue."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) { setError(error.message); setLoading(false); }
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Logo size="lg" className="justify-center mb-6" />
          <div className="card p-6">
            <div className="text-3xl mb-3">📬</div>
            <h2 className="font-syne text-lg font-bold mb-2">Check your inbox</h2>
            <p className="text-sm text-text-2">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center" />
          <p className="text-sm text-text-2 mt-2">Partnership intelligence for web3</p>
        </div>

        <div className="card p-6">
          <h2 className="font-syne text-lg font-bold tracking-tight mb-1">Create your account</h2>
          <p className="text-xs text-text-2 mb-6">Join NYXUS — early access pricing</p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <input
                className="input-base"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  className="input-base pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="input-label">Confirm password</label>
              <div className="relative">
                <input
                  className="input-base pr-10"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Same password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms agreement */}
            <label className="flex items-start gap-2 cursor-pointer select-none" onClick={() => setAgreedToTerms(!agreedToTerms)}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                agreedToTerms ? "bg-accent border-accent" : "border-border bg-surface"
              }`}>
                {agreedToTerms && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs text-text-2 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-accent hover:underline" onClick={e => e.stopPropagation()}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-accent hover:underline" onClick={e => e.stopPropagation()}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            {error && (
              <p className="text-xs text-brand-red bg-brand-red/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" fullWidth loading={loading} className="mt-1">
              Create account →
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-2 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
