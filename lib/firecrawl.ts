import { Firecrawl } from "firecrawl";
import type { ScrapedListing } from "@/lib/types";

const CHALLENGE =
  /checking your browser|experiencing heavy traffic|verify you are human|just a moment|attention required|enable javascript and cookies|cf-browser-verification|challenges\.cloudflare|turnstile|ddos protection/i;

type PageMeta = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogSiteName?: string;
  keywords?: string | string[];
  favicon?: string;
  ogImage?: string;
};

type SearchHit = {
  url?: string;
  title?: string;
  description?: string;
};

/**
 * Drops image markdown, CDN asset URLs, and leftover markup so listing
 * copy stays readable text — never `![](https://...webp)`.
 */
export function scrubScrapedText(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/!\[[^\]]*\]/g, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+\.(?:png|jpe?g|webp|gif|svg|avif|ico)(?:[?#]\S*)?/gi, " ")
    .replace(/https?:\/\/\S*cdn-cgi\/image\S*/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[*_`>#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanListingCopy(listing: ScrapedListing): ScrapedListing {
  return {
    ...listing,
    tagline: scrubScrapedText(listing.tagline),
    description: scrubScrapedText(listing.description),
    offerSummary: scrubScrapedText(listing.offerSummary),
  };
}

export function getFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  return new Firecrawl(apiKey ? { apiKey } : {});
}

export async function scrapeWebsite(url: string) {
  const firecrawl = getFirecrawl();
  const scraped = await firecrawl.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
    waitFor: 2500,
    timeout: 60_000,
    proxy: "stealth",
    maxAge: 0,
  });

  const metadata = scraped.metadata as PageMeta | undefined;
  const markdown = scraped.markdown ?? "";
  const favicon = metadata?.favicon?.trim() || metadata?.ogImage?.trim() || "";

  if (!isChallengePage(metadata?.title, markdown) && (markdown.trim() || metadata?.title)) {
    const listing = listingFromPage(metadata, markdown, url);
    return {
      markdown: scrubScrapedText(markdown).slice(0, 14000),
      favicon,
      listing: cleanListingCopy(listing),
    };
  }

  const indexed = await listingFromSearch(firecrawl, url);
  if (indexed) {
    return {
      markdown: indexed.markdown.slice(0, 14000),
      favicon,
      listing: indexed.listing,
    };
  }

  throw new Error(
    "That site blocked the scrape with a bot check. We did not invent a listing from it — try again in a moment.",
  );
}

function isChallengePage(title: string | undefined, markdown: string) {
  return CHALLENGE.test(`${title ?? ""}\n${markdown}`);
}

async function listingFromSearch(firecrawl: Firecrawl, pageUrl: string) {
  const host = hostname(pageUrl);
  if (!host) return null;

  const result = await firecrawl.search(`site:${host}`, { limit: 8 });
  const hits = ((result.web ?? []) as SearchHit[]).filter(
    (hit) => hit.title || hit.description,
  );
  if (hits.length === 0) return null;

  const home =
    hits.find((hit) => sameHostPath(hit.url, pageUrl)) ??
    hits.find((hit) => {
      try {
        return new URL(hit.url ?? "").pathname === "/";
      } catch {
        return false;
      }
    }) ??
    hits[0];

  const { name, remainder } = splitBrandTitle(home.title ?? prettyBrand(host));
  const extra = hits
    .filter((hit) => hit !== home)
    .find(
      (hit) => !/privacy|terms|cookie|legal/i.test(`${hit.url ?? ""} ${hit.title ?? ""}`),
    );
  const description = [home.description, extra?.description]
    .filter(Boolean)
    .join(" ");

  const listing: ScrapedListing = {
    name: name || prettyBrand(host),
    tagline: scrubScrapedText(remainder || firstSentence(home.description ?? "") || name),
    description: scrubScrapedText(description || remainder),
    category: guessCategory(`${home.title ?? ""} ${description}`, []),
    tags: keywordsToTags(`${home.title ?? ""}, ${home.description ?? ""}`),
    targetAudience: "",
    offerSummary: firstSentence(scrubScrapedText(home.description || remainder || description)),
  };

  return {
    listing: cleanListingCopy(listing),
    markdown: scrubScrapedText(
      [`# ${listing.name}`, listing.tagline, "", listing.description]
        .filter(Boolean)
        .join("\n"),
    ),
  };
}

function listingFromPage(metadata: PageMeta | undefined, markdown: string, pageUrl: string): ScrapedListing {
  const brand = prettyBrand(hostname(pageUrl));
  const metaTitle = cleanTitle(
    metadata?.ogSiteName || metadata?.ogTitle || metadata?.title || "",
  );
  const { name: titleName, remainder } = splitBrandTitle(metaTitle);
  const heading = firstHeading(markdown);
  const blurb = scrubScrapedText(metadata?.ogDescription || metadata?.description || "");
  const body = firstParagraphs(markdown);
  const name = pickName(titleName, heading, brand);
  const description = [blurb, body].filter(Boolean).join(" ") || remainder;
  const tagline = remainder || firstSentence(blurb || description) || name;
  const tags = keywordsToTags(metadata?.keywords);

  return {
    name,
    tagline: scrubScrapedText(tagline),
    description: scrubScrapedText(description),
    category: guessCategory(`${markdown}\n${tags.join(" ")}`, tags),
    tags,
    targetAudience: "",
    offerSummary: scrubScrapedText(firstSentence(description) || tagline),
  };
}

function pickName(titleName: string, heading: string, brand: string) {
  if (titleName && !isChallengePage(titleName, "") && titleName.length <= 48) {
    return titleName;
  }
  if (heading && !isChallengePage(heading, "") && heading.length <= 40) {
    return heading;
  }
  return brand;
}

function splitBrandTitle(title: string) {
  const cleaned = cleanTitle(title);
  const parts = cleaned.split(/\s[|–—]\s|\s-\s/);
  if (parts.length >= 2) {
    return { name: parts[0].trim(), remainder: parts.slice(1).join(" — ").trim() };
  }
  return { name: cleaned, remainder: "" };
}

function firstHeading(markdown: string) {
  const match = markdown.match(/^#{1,2}\s+(.+)$/m);
  return scrubScrapedText(match?.[1]?.replace(/[*_`]/g, "") ?? "");
}

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function firstSentence(value: string) {
  const match = value.trim().match(/^[^.!?]+[.!?]?/);
  return match?.[0]?.trim() ?? "";
}

function firstParagraphs(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => scrubScrapedText(line.replace(/^#+\s*/, "")))
    .filter(
      (line) =>
        line.length > 40 &&
        !line.startsWith("|") &&
        !CHALLENGE.test(line),
    )
    .slice(0, 3)
    .join(" ");
}

function keywordsToTags(keywords: string | string[] | undefined) {
  const raw = Array.isArray(keywords) ? keywords.join(",") : (keywords ?? "");
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "your",
    "you",
    "are",
    "can",
    "all",
    "one",
    "into",
    "so",
    "right",
    "handles",
    "connects",
    "focus",
  ]);
  return raw
    .toLowerCase()
    .split(/[^a-z0-9/+]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 3 && tag.length < 24 && !stop.has(tag))
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 8);
}

function guessCategory(haystack: string, tags: string[]) {
  const text = `${haystack}\n${tags.join(" ")}`.toLowerCase();
  if (/\bagenc(y|ies)\b/.test(text)) return "agency";
  if (/\bfreelanc/.test(text)) return "freelancer";
  if (/\b(saas|software|app|platform|marketplace)\b/.test(text)) return "software";
  if (/\b(service|consult)/.test(text)) return "service";
  return "";
}

function hostname(pageUrl: string) {
  try {
    return new URL(
      /^https?:\/\//i.test(pageUrl) ? pageUrl : `https://${pageUrl}`,
    ).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function prettyBrand(host: string) {
  const name = host.split(".")[0] ?? "";
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function sameHostPath(candidate: string | undefined, pageUrl: string) {
  if (!candidate) return false;
  try {
    const a = new URL(candidate);
    const b = new URL(/^https?:\/\//i.test(pageUrl) ? pageUrl : `https://${pageUrl}`);
    const pathA = a.pathname.replace(/\/$/, "") || "/";
    const pathB = b.pathname.replace(/\/$/, "") || "/";
    return a.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "") && pathA === pathB;
  } catch {
    return false;
  }
}
