const APP_BASE_URL = process.env.APP_BASE_URL;
const INTERNAL_INGEST_TOKEN = process.env.INTERNAL_INGEST_TOKEN;

function assertEnv() {
  if (!APP_BASE_URL || !INTERNAL_INGEST_TOKEN) {
    throw new Error("Missing worker env APP_BASE_URL or INTERNAL_INGEST_TOKEN.");
  }
}

export async function callInternal(path, body) {
  assertEnv();
  const url = `${APP_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": INTERNAL_INGEST_TOKEN
    },
    body: JSON.stringify(body)
  });

  const rawText = await response.text();
  let payload = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { raw: rawText };
    }
  }

  if (!response.ok) {
    const data = payload && typeof payload === "object" ? payload : {};
    const message =
      data.error ||
      data.raw ||
      `Internal call failed: ${path}`;
    throw new Error(`HTTP ${response.status} ${response.statusText} at ${url} -> ${String(message).slice(0, 500)}`);
  }
  return payload;
}
