import { NextResponse } from "next/server";
import { MAX_CREDIT_PURCHASE_USD, MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

type Body = {
  amount?: number;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const amount = Number(body.amount);

  if (
    !Number.isFinite(amount) ||
    amount < MIN_CREDIT_PURCHASE_USD ||
    amount > MAX_CREDIT_PURCHASE_USD
  ) {
    return NextResponse.json(
      {
        error: `Credits start at $${MIN_CREDIT_PURCHASE_USD} and top out at $${MAX_CREDIT_PURCHASE_USD}.`,
      },
      { status: 400 },
    );
  }

  const rounded = Math.round(amount * 100) / 100;
  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim();
  if (checkoutUrl) {
    return NextResponse.json({ checkoutUrl });
  }

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const fullName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null);

  const nextBalance = Number(profile?.credit_balance ?? 0) + rounded;

  const query = profile
    ? supabase
        .from("profiles")
        .update({
          role: "business",
          subscription_status: "active",
          credit_balance: nextBalance,
        })
        .eq("id", user.id)
    : supabase.from("profiles").insert({
        id: user.id,
        role: "business",
        subscription_status: "active",
        credit_balance: nextBalance,
        full_name: fullName,
      });

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, demo: true, added: rounded });
}
