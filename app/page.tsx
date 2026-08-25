import { PainSearch } from "@/components/pain-search";
import { RotatingWord } from "@/components/rotating-word";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pb-24 pt-10">
      <h1 className="font-display max-w-4xl text-4xl leading-[1.05] sm:text-6xl">
        Type your pain point and find a <RotatingWord /> that might be your
        solution
      </h1>
      <div className="mt-14">
        <PainSearch signedIn={Boolean(user)} />
      </div>
    </section>
  );
}
