import { Firecrawl } from "firecrawl";

export function getFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  return new Firecrawl(apiKey ? { apiKey } : {});
}

export async function scrapeWebsite(url: string) {
  const firecrawl = getFirecrawl();
  const result = await firecrawl.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
  });

  const markdown = result.markdown ?? "";
  const title = result.metadata?.title ?? "";

  if (!markdown.trim()) {
    throw new Error("Firecrawl did not return page content");
  }

  return {
    markdown: markdown.slice(0, 14000),
    title,
  };
}
