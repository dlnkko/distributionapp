import { redirect } from "next/navigation";
import { MatchReveal } from "@/components/match-reveal";
import { createClient } from "@/lib/supabase/server";

export default async function MatchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=search&next=/match");

  return <MatchReveal />;
}
