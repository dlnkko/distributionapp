"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ListingNavLink() {
  const pathname = usePathname();
  const onBusiness = pathname === "/business" || pathname.startsWith("/business/");

  if (onBusiness) {
    return (
      <Link href="/" className="transition-colors hover:text-paper">
        Home
      </Link>
    );
  }

  return (
    <Link href="/business" className="transition-colors hover:text-paper">
      Get listed
    </Link>
  );
}
