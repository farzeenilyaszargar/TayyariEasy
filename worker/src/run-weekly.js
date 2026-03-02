import { callInternal } from "./http.js";

const SOURCE_CATALOG = [
  {
    sourceName: "NTA JEE Main",
    baseUrl: "https://jeemain.nta.ac.in",
    entryUrl: "https://jeemain.nta.ac.in/question-papers/",
    exam: "JEE Main",
    licenseType: "official"
  },
  {
    sourceName: "JEE Advanced Official",
    baseUrl: "https://jeeadv.ac.in",
    entryUrl: "https://jeeadv.ac.in/archive.html",
    exam: "JEE Advanced",
    licenseType: "official"
  }
];

function absolutize(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function guessDocumentType(url) {
  return /\.pdf(\?|#|$)/i.test(url) ? "pdf" : "html";
}

function extractLikelyQuestionLinks(baseUrl, html) {
  const hrefMatches = Array.from(html.matchAll(/href\s*=\s*["']([^"']+)["']/gi));
  const links = new Set();

  for (const match of hrefMatches) {
    const href = match[1];
    const absolute = absolutize(baseUrl, href);
    if (!absolute) {
      continue;
    }

    const normalized = absolute.toLowerCase();
    const looksRelevant =
      normalized.includes("question") ||
      normalized.includes("paper") ||
      normalized.includes("jee") ||
      normalized.includes("archive") ||
      normalized.includes(".pdf");
    if (!looksRelevant) {
      continue;
    }

    links.add(absolute);
  }

  return Array.from(links).slice(0, 60);
}

async function discoverAndRegisterSource(source) {
  const response = await fetch(source.entryUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch source entry ${source.entryUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const discovered = extractLikelyQuestionLinks(source.baseUrl, html);
  const allUrls = Array.from(new Set([source.entryUrl, ...discovered]));

  let registered = 0;
  for (const url of allUrls) {
    await callInternal("/internal/ingest/source-document", {
      sourceName: source.sourceName,
      baseUrl: source.baseUrl,
      licenseType: source.licenseType,
      robotsAllowed: true,
      url,
      documentType: guessDocumentType(url),
      exam: source.exam,
      parseStatus: "pending"
    });
    registered += 1;
  }

  return { discovered: discovered.length, registered };
}

async function registerOptionalBookReferences() {
  if (process.env.ALLOW_PROPRIETARY_BOOK_REFERENCES !== "true") {
    return { registered: 0, skipped: true };
  }

  // Metadata-only registration. Do not ingest proprietary content unless licensed by the operator.
  const refs = [
    { sourceName: "I.E. Irodov (licensed copy)", baseUrl: "book://irodov", url: "book://irodov/physics-problems" },
    { sourceName: "H.C. Verma (licensed copy)", baseUrl: "book://hc-verma", url: "book://hc-verma/concepts-of-physics" },
    { sourceName: "O.P. Tandon (licensed copy)", baseUrl: "book://op-tandon", url: "book://op-tandon/chemistry" },
    { sourceName: "Cengage Math (licensed copy)", baseUrl: "book://cengage-math", url: "book://cengage-math/jee-math" }
  ];

  for (const ref of refs) {
    await callInternal("/internal/ingest/source-document", {
      sourceName: ref.sourceName,
      baseUrl: ref.baseUrl,
      licenseType: "unknown",
      robotsAllowed: false,
      url: ref.url,
      documentType: "html",
      parseStatus: "pending"
    });
  }

  return { registered: refs.length, skipped: false };
}

export async function runWeeklySourceDiscovery() {
  let totalRegistered = 0;
  for (const source of SOURCE_CATALOG) {
    const result = await discoverAndRegisterSource(source);
    totalRegistered += result.registered;
    console.log(
      `[weekly-source] ${source.sourceName}: discovered=${result.discovered} registered=${result.registered}`
    );
  }

  const books = await registerOptionalBookReferences();
  totalRegistered += books.registered;
  if (books.skipped) {
    console.log("[weekly-source] proprietary book references skipped (set ALLOW_PROPRIETARY_BOOK_REFERENCES=true to register metadata).");
  } else {
    console.log(`[weekly-source] proprietary book metadata registered=${books.registered}`);
  }

  console.log(`Weekly source discovery completed. totalRegistered=${totalRegistered}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWeeklySourceDiscovery().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
