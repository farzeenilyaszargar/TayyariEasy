import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
process.loadEnvFile?.(path.join(root, ".env.local"));
const datasetPath = path.join(root, "data", "jee-question-seed-90.json");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sourceUrl = "https://static.zollege.in/public/image/JEE_Main_2022_Btech_Question_Paper_Jul_29_Shift_2_ae275dd93906209f6c26d14195c71794.pdf";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.");
}

const dataset = JSON.parse(await fs.readFile(datasetPath, "utf8"));
const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json"
};

async function request(table, { method = "GET", query = "", body, prefer } = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
    method,
    headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`${method} ${table}${query}: ${response.status} ${await response.text()}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function fingerprint(question) {
  return crypto
    .createHash("sha256")
    .update(`${question.subject}|${question.item_code}|${question.stem_and_options_ocr}`)
    .digest("hex");
}

async function findOrCreateSource() {
  const query = `?select=id&name=eq.NTA%20JEE%20Main&base_url=eq.https%3A%2F%2Fjeemain.nta.nic.in%2F&limit=1`;
  const existing = await request("question_sources", { query });
  if (existing?.[0]?.id) return existing[0].id;
  const created = await request("question_sources", {
    method: "POST",
    prefer: "return=representation",
    body: [{
      name: "NTA JEE Main",
      base_url: "https://jeemain.nta.nic.in/",
      license_type: "official",
      is_active: true,
      robots_allowed: false,
      terms_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]
  });
  return created[0].id;
}

async function findOrCreateDocument(sourceId) {
  const existing = await request("source_documents", {
    query: `?select=id&url=eq.${encodeURIComponent(sourceUrl)}&limit=1`
  });
  if (existing?.[0]?.id) return existing[0].id;
  const created = await request("source_documents", {
    method: "POST",
    prefer: "return=representation",
    body: [{
      source_id: sourceId,
      url: sourceUrl,
      document_type: "pdf",
      published_year: 2022,
      exam: "JEE Main",
      paper_code: "2022-06-29-shift-2",
      fetched_at: new Date().toISOString(),
      parse_status: "parsed",
      updated_at: new Date().toISOString()
    }]
  });
  return created[0].id;
}

const sourceId = await findOrCreateSource();
const sourceDocumentId = await findOrCreateDocument(sourceId);
let imported = 0;
let skipped = 0;

for (const question of dataset.questions) {
  const dedupeFingerprint = fingerprint(question);
  const existing = await request("question_bank", {
    query: `?select=id&dedupe_fingerprint=eq.${dedupeFingerprint}&limit=1`
  });

  let questionId = existing?.[0]?.id;
  const payload = {
    question_type: question.section === "B" ? "integer" : "mcq_single",
    stem_markdown: question.stem_and_options_ocr,
    stem_latex: null,
    subject: question.subject,
    topic: "Unclassified",
    subtopic: null,
    difficulty: "medium",
    source_kind: "historical",
    exam_year: question.year,
    exam_phase: "Main",
    marks: 4,
    negative_marks: question.section === "B" ? 0 : 1,
    quality_score: 0,
    review_status: "needs_review",
    is_published: false,
    ai_vetted_at: null,
    ai_vetting_score: null,
    ai_vetting_notes: "Not AI-generated; OCR and answer/options normalization require human review.",
    dedupe_fingerprint: dedupeFingerprint,
    updated_at: new Date().toISOString()
  };

  if (questionId) {
    skipped += 1;
  } else {
    try {
      const created = await request("question_bank", {
        method: "POST",
        prefer: "return=representation",
        body: [payload]
      });
      questionId = created[0]?.id;
      imported += 1;
    } catch (error) {
      // Another run may have inserted the row between the lookup and POST.
      // Resolve the winner and continue rather than failing the whole import.
      if (!String(error).includes("409")) throw error;
      const existingAfterInsert = await request("question_bank", {
        query: `?select=id&dedupe_fingerprint=eq.${dedupeFingerprint}&limit=1`
      });
      questionId = existingAfterInsert?.[0]?.id;
      skipped += questionId ? 1 : 0;
    }
  }

  if (!questionId) continue;

  const provenance = await request("question_provenance", {
    query: `?select=id&question_id=eq.${questionId}&source_question_ref=eq.${encodeURIComponent(`ItemCode ${question.item_code}`)}&limit=1`
  });
  if (!provenance?.length) {
    await request("question_provenance", {
      method: "POST",
      prefer: "return=minimal",
      body: [{
        question_id: questionId,
        source_document_id: sourceDocumentId,
        source_question_ref: `ItemCode ${question.item_code}`,
        source_url: sourceUrl,
        extraction_confidence: 0
      }]
    });
  }
}

console.log(JSON.stringify({ dataset: dataset.dataset_id, imported, skipped, total: dataset.questions.length }, null, 2));
