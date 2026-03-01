const APP_BASE_URL = process.env.APP_BASE_URL;
const INTERNAL_INGEST_TOKEN = process.env.INTERNAL_INGEST_TOKEN;

function assertEnv() {
  if (!APP_BASE_URL || !INTERNAL_INGEST_TOKEN) {
    throw new Error("Missing worker env APP_BASE_URL or INTERNAL_INGEST_TOKEN.");
  }
}

export async function callInternal(path, body) {
  assertEnv();
  const response = await fetch(`${APP_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": INTERNAL_INGEST_TOKEN
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Internal call failed: ${path}`);
  }
  return payload;
}
