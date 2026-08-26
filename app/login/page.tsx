import { GoogleSignIn } from "@/components/google-sign-in";
import {
  authIntentFrom,
  findPathForPain,
  safeNextPath,
} from "@/lib/auth";

type Props = {
  searchParams: Promise<{
    next?: string;
    intent?: string;
    error?: string;
    q?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const intentParam = params.intent;
  const pain = params.q?.trim() ?? "";
  const nextPath =
    intentParam === "search" && pain.length >= 8
      ? findPathForPain(pain)
      : safeNextPath(
          params.next ?? (intentParam === "business" ? "/business/subscribe" : "/"),
        );
  const intent = authIntentFrom(intentParam, nextPath);

  const title =
    intentParam === "business"
      ? "List your offer."
      : intentParam === "search"
        ? "Your problem, solved."
        : "Sign in.";

  const copy =
    intentParam === "business"
      ? "Buy credits and publish a listing."
      : intentParam === "search"
        ? null
        : "One Google account for people searching and for businesses getting listed.";

  return (
    <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-20">
      <h1 className={`font-display text-5xl ${copy || pain.length >= 8 ? "mb-4" : "mb-10"}`}>{title}</h1>
      {copy ? <p className="mb-10 text-paper-dim">{copy}</p> : null}
      {intentParam === "search" && pain.length >= 8 ? (
        <p className="mb-8 text-paper-dim">You said: “{pain}”</p>
      ) : null}
      {params.error ? (
        <p className="mb-6 text-sm text-ember">Could not finish sign-in. Try again.</p>
      ) : null}
      <GoogleSignIn nextPath={nextPath} intent={intent} />
    </section>
  );
}
