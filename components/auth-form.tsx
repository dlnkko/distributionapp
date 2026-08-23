"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  mode: "login" | "signup";
  nextPath: string;
  intent?: string;
};

export function AuthForm({ mode, nextPath, intent }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    try {
      if (mode === "signup") {
        const { data, error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: fullName },
          },
        });
        if (signError) throw signError;
        if (data.session) {
          router.push(nextPath);
          router.refresh();
          return;
        }
        setMessage("Check your email to confirm the account, then come back.");
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signError) throw signError;
        router.push(nextPath);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}${intent ? `&intent=${intent}` : ""}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}${intent ? `&intent=${intent}` : ""}`;

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5">
      {mode === "signup" ? (
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
            Name
          </span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full border-b border-paper/25 bg-transparent py-3 text-lg outline-none"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
          Email
        </span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border-b border-paper/25 bg-transparent py-3 text-lg outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
          Password
        </span>
        <input
          required
          type="password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border-b border-paper/25 bg-transparent py-3 text-lg outline-none"
        />
      </label>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      {message ? <p className="text-sm text-paper-dim">{message}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ember py-3 text-sm font-medium text-ink disabled:opacity-60"
      >
        {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <p className="text-sm text-paper-dim">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href={signupHref} className="text-paper underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already listed or searching?{" "}
            <Link href={loginHref} className="text-paper underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
