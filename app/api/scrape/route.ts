import { NextResponse } from "next/server";
import { scrapeWebsite } from "@/lib/firecrawl";
import { faviconUrl } from "@/lib/cta";
import { createClient } from "@/lib/supabase/server";

type ScrapeBody = {
  url?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }

    const body = (await request.json()) as ScrapeBody;
    let url = body.url?.trim() ?? "";

    if (!url) {
      return NextResponse.json({ error: "A website URL is required." }, { status: 400 });
    }

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "That URL looks invalid." }, { status: 400 });
    }

    const scraped = await scrapeWebsite(url);

    return NextResponse.json({
      url,
      scrapedContent: scraped.markdown,
      logoUrl: faviconUrl(url, scraped.favicon),
      listing: scraped.listing,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scrape failed." },
      { status: 500 },
    );
  }
}
