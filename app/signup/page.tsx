import { AuthForm } from "@/components/auth-form";

type Props = {
  searchParams: Promise<{ next?: string; intent?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const intent = params.intent;
  const nextPath =
    params.next ?? (intent === "business" ? "/business/subscribe" : "/");

  return (
    <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-20">
      <h1 className="font-display mb-10 text-5xl">
        {intent === "business" ? "List your offer." : "Create an account."}
      </h1>
      <AuthForm mode="signup" nextPath={nextPath} intent={intent} />
    </section>
  );
}
