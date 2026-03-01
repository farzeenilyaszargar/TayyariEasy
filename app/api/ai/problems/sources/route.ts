import { NextRequest, NextResponse } from "next/server";

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

type ImageResult = {
  title: string;
  imageUrl: string;
  pageUrl: string;
  source: string;
};

const STOP_WORDS = new Set([
  "the",
  "is",
  "are",
  "a",
  "an",
  "of",
  "to",
  "for",
  "and",
  "or",
  "in",
  "on",
  "at",
  "with",
  "by",
  "from",
  "how",
  "why",
  "what",
  "when",
  "where",
  "which",
  "jee",
  "main",
  "advanced"
]);

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function truncate(input: string, max = 220) {
  if (input.length <= max) {
    return input;
  }
  return `${input.slice(0, max - 1).trim()}…`;
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 2 && !STOP_WORDS.has(x));
}

function scoreRelevance(queryTokens: string[], text: string) {
  if (queryTokens.length === 0) {
    return 0;
  }
  const lower = text.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) {
      score += 1;
    }
  }
  return score;
}

async function fetchWikipediaSearch(query: string): Promise<SearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srlimit=5&format=json&utf8=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": "TayyariDoubtsBot/1.0" },
    cache: "no-store"
  });
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    query?: {
      search?: Array<{
        title?: string;
        pageid?: number;
        snippet?: string;
      }>;
    };
  };

  const rows = payload.query?.search || [];
  return rows
    .filter((row) => row.title && row.pageid)
    .map((row) => ({
      title: String(row.title),
      url: `https://en.wikipedia.org/?curid=${row.pageid}`,
      snippet: truncate(stripHtml(String(row.snippet || ""))),
      source: "Wikipedia"
    }));
}

async function fetchCommonsImages(query: string): Promise<ImageResult[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&format=json&utf8=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": "TayyariDoubtsBot/1.0" },
    cache: "no-store"
  });
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{ url?: string; descriptionurl?: string }>;
        }
      >;
    };
  };

  const pages = Object.values(payload.query?.pages || {});
  return pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      const imageUrl = info?.url;
      const pageUrl = info?.descriptionurl;
      if (!page.title || !imageUrl || !pageUrl) {
        return null;
      }
      return {
        title: String(page.title).replace(/^File:/, ""),
        imageUrl: String(imageUrl),
        pageUrl: String(pageUrl),
        source: "Wikimedia Commons"
      } satisfies ImageResult;
    })
    .filter((item): item is ImageResult => Boolean(item));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const queryTokens = tokenize(prompt);

    const [results, images] = await Promise.all([
      fetchWikipediaSearch(prompt).catch(() => []),
      fetchCommonsImages(prompt).catch(() => [])
    ]);

    const rankedResults = results
      .map((item) => ({
        ...item,
        relevance: scoreRelevance(queryTokens, `${item.title} ${item.snippet}`)
      }))
      .filter((item) => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3)
      .map(({ relevance: _relevance, ...item }) => item);

    const rankedImages = images
      .map((item) => ({
        ...item,
        relevance: scoreRelevance(queryTokens, item.title)
      }))
      .filter((item) => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 2)
      .map(({ relevance: _relevance, ...item }) => item);

    return NextResponse.json({
      results: rankedResults.length > 0 ? rankedResults : results.slice(0, 2),
      images: rankedImages.length > 0 ? rankedImages : images.slice(0, 1)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch web sources.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
