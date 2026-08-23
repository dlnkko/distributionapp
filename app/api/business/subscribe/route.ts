import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;
  if (checkoutUrl) {
    return NextResponse.json({ checkoutUrl });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role: "business",
      subscription_status: "active",
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, demo: true });
}
