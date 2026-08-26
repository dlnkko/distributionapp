import { redirect } from "next/navigation";
import { QuestionFlow } from "@/components/question-flow";
import { findPathForPain } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function FindPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const painPoint = q?.trim() ?? "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const next = painPoint ? findPathForPain(painPoint) : "/";
  if (!user) {
    redirect(
      painPoint
        ? `/login?intent=search&next=/find&q=${encodeURIComponent(painPoint)}`
        : `/login?intent=search&next=${encodeURIComponent(next)}`,
    );
  }

  if (painPoint.length < 8) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6">
        <h1 className="font-display text-4xl">Give the problem a little more room.</h1>
        <p className="mt-4 text-paper-dim">
          Write the pain in a full sentence, then we will walk it down with you.
        </p>
      </section>
    );
  }

  return <QuestionFlow painPoint={painPoint} />;
}
