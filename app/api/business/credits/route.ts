import { NextResponse } from "next/server";
import { MAX_CREDIT_PURCHASE_USD, MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

type Body = {
  amount?: number;
  listingId?: string;
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
  const listingId = body.listingId?.trim() || "";

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

  const fullName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, prepaid_listing_credits")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profilePayload = {
    role: "business" as const,
    subscription_status: "active" as const,
  };

  if (listingId) {
    const { data: listing, error: listingError } = await supabase
      .from("businesses")
      .select("id, credit_balance")
      .eq("id", listingId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (listingError || !listing) {
      return NextResponse.json({ error: "That listing was not found." }, { status: 404 });
    }

    const { error: creditError } = await supabase
      .from("businesses")
      .update({ credit_balance: Number(listing.credit_balance ?? 0) + rounded })
      .eq("id", listing.id)
      .eq("owner_id", user.id);

    if (creditError) {
      return NextResponse.json({ error: creditError.message }, { status: 500 });
    }
  } else {
    const nextPrepaid = Number(profile?.prepaid_listing_credits ?? 0) + rounded;
    const query = profile
      ? supabase
          .from("profiles")
          .update({
            ...profilePayload,
            prepaid_listing_credits: nextPrepaid,
          })
          .eq("id", user.id)
      : supabase.from("profiles").insert({
          id: user.id,
          ...profilePayload,
          prepaid_listing_credits: nextPrepaid,
          full_name: fullName,
        });

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, demo: true, added: rounded });
  }

  if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      ...profilePayload,
      full_name: fullName,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, demo: true, added: rounded });
}
