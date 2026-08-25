import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ClickResult = {
  ok?: boolean;
  url?: string;
  error?: string;
};

function safeHttpUrl(value: string) {
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("intent", "search");
    login.searchParams.set("next", `/api/go/${id}`);
    return NextResponse.redirect(login);
  }

  const { data, error } = await supabase.rpc("record_listing_click", {
    p_business_id: id,
  });

  const result = (data ?? {}) as ClickResult;
  const dest = result.url ? safeHttpUrl(result.url) : null;
  if (error || !result.ok || !dest) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.redirect(dest);
}
