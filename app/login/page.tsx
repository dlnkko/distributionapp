import { AuthForm } from "@/components/auth-form";

type Props = {
  searchParams: Promise<{ next?: string; intent?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const intent = params.intent;
  const nextPath =
    params.next ?? (intent === "business" ? "/business/subscribe" : "/");

  return (
    <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-20">
      <h1 className="font-display mb-10 text-5xl">Welcome back.</h1>
      {params.error ? (
        <p className="mb-6 text-sm text-ember">Could not finish sign-in. Try again.</p>
      ) : null}
      <AuthForm mode="login" nextPath={nextPath} intent={intent} />
    </section>
  );
}
