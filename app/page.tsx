import { PainSearch } from "@/components/pain-search";
import { RotatingWord } from "@/components/rotating-word";

export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pb-24 pt-10">
      <p className="text-xs uppercase tracking-[0.24em] text-paper-dim">
        Exposure, then the right introduction
      </p>
      <h1 className="font-display mt-6 max-w-4xl text-4xl leading-[1.05] sm:text-6xl">
        Type your pain point and find a <RotatingWord /> that might be your
        solution
      </h1>
      <div className="mt-14">
        <PainSearch />
      </div>
    </section>
  );
}
