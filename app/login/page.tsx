import { GoogleSignIn } from "@/components/google-sign-in";
import { safeNextPath } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ next?: string; intent?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const intent = params.intent;
  const nextPath = safeNextPath(
    params.next ?? (intent === "business" ? "/business" : "/"),
  );

  const title =
    intent === "business"
      ? "List your offer."
      : intent === "search"
        ? "Find your match."
        : "Sign in.";

  const copy =
    intent === "business"
      ? "Buy credits and publish a listing."
      : intent === "search"
        ? "Google first. Then we walk the pain down and introduce you to one listing."
        : "One Google account for people searching and for businesses getting listed.";

  return (
    <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-20">
      <h1 className="font-display mb-4 text-5xl">{title}</h1>
      <p className="mb-10 text-paper-dim">{copy}</p>
      {params.error ? (
        <p className="mb-6 text-sm text-ember">Could not finish sign-in. Try again.</p>
      ) : null}
      <GoogleSignIn nextPath={nextPath} />
    </section>
  );
}
