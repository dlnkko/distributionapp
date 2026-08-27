import Link from "next/link";
import { ListingNavLink } from "@/components/listing-nav-link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isBusiness = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, subscription_status")
      .eq("id", user.id)
      .maybeSingle();
    isBusiness =
      profile?.role === "business" || profile?.subscription_status === "active";
  }

  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <Link href="/" className="font-display text-xl tracking-tight text-paper">
        distribute
        <span className="text-ember">.</span>
        to
      </Link>
      <nav className="flex items-center gap-6 text-base text-paper-dim md:gap-8 md:text-lg">
        {isBusiness ? (
          <Link
            href="/business/dashboard"
            className="transition-colors hover:text-paper"
          >
            Dashboard
          </Link>
        ) : (
          <ListingNavLink />
        )}
        {user ? (
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="transition-colors hover:text-paper"
            >
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/login" className="transition-colors hover:text-paper">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
