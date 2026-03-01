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

function shouldFetchWebSources(prompt: string) {
  const text = prompt.toLowerCase();
  const nonSearchPatterns = [
    /revision/,
    /study plan/,
    /time table/,
    /timetable/,
    /motivation/,
    /routine/,
    /how should i study/,
    /how to improve rank/,
    /strategy/
  ];
  const isLikelyPlanning = nonSearchPatterns.some((pattern) => pattern.test(text));

  const conceptPatterns = [
    /explain/,
    /derive/,
    /prove/,
    /integration/,
    /reaction/,
    /mechanism/,
    /sn1/,
    /sn2/,
    /equation/,
    /formula/,
    /numerical/,
    /solve/
  ];
  const hasConceptIntent = conceptPatterns.some((pattern) => pattern.test(text));
  if (isLikelyPlanning && !hasConceptIntent) {
    return false;
  }
  return true;
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

async function imageExists(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const get = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "TayyariDoubtsBot/1.0",
        Accept: "image/*"
      },
      cache: "no-store"
    });
    const type = get.headers.get("content-type") || "";
    const ok = get.ok && type.toLowerCase().includes("image");
    get.body?.cancel();
    if (ok) {
      return true;
    }
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
  return false;
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
    if (!shouldFetchWebSources(prompt)) {
      return NextResponse.json({ results: [], images: [] });
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

    const rankedImagesCandidates = images
      .map((item) => ({
        ...item,
        relevance: scoreRelevance(queryTokens, item.title)
      }))
      .filter((item) => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 12);

    const verifiedImages: ImageResult[] = [];
    for (const item of rankedImagesCandidates) {
      const exists = await imageExists(item.imageUrl);
      if (exists) {
        const { relevance: _relevance, ...clean } = item;
        verifiedImages.push(clean);
      }
      if (verifiedImages.length >= 5) {
        break;
      }
    }

    if (verifiedImages.length < 4) {
      for (const fallbackImage of images) {
        if (verifiedImages.some((item) => item.imageUrl === fallbackImage.imageUrl)) {
          continue;
        }
        const exists = await imageExists(fallbackImage.imageUrl);
        if (exists) {
          verifiedImages.push(fallbackImage);
        }
        if (verifiedImages.length >= 5) {
          break;
        }
      }
    }

    return NextResponse.json({
      results: rankedResults.length > 0 ? rankedResults : results.slice(0, 2),
      images: verifiedImages.slice(0, 5)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch web sources.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
