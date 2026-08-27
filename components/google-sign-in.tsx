"use client";

import { useState } from "react";
import type { AuthIntent } from "@/lib/auth";
import { setClientAuthCookies } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

type Props = {
  nextPath: string;
  intent?: AuthIntent;
};

export function GoogleSignIn({ nextPath, intent = "search" }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setError("");
    setLoading(true);
    setClientAuthCookies(nextPath, intent);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: signError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (signError) {
      setError(signError.message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <button
        type="button"
        onClick={() => void signIn()}
        disabled={loading}
        className="btn btn-paper flex w-full gap-3 px-6 py-3 text-sm"
      >
        <GoogleMark />
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>
      {error ? <p className="mt-4 text-sm text-ember">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
