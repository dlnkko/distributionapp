import Link from "next/link";

export default function BusinessLandingPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pb-24">
      <p className="text-xs uppercase tracking-[0.24em] text-ember">For businesses</p>
      <h1 className="font-display mt-6 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
        Pay for exposure. Show up when someone is already looking for you.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-paper-dim">
        $49 a month puts your software, service, product, or practice in the
        matching catalog. We scrape your site, you add the details only you know,
        and the intake interview does the rest.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/signup?intent=business&next=/business/subscribe"
          className="rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink"
        >
          Get listed
        </Link>
        <Link
          href="/login?intent=business&next=/business/subscribe"
          className="rounded-full border border-line px-6 py-3 text-sm"
        >
          I already have an account
        </Link>
      </div>
    </section>
  );
}
