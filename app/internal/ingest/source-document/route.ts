import { NextRequest, NextResponse } from "next/server";
import { assertInternalIngestAuth } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

type SourceDocumentPayload = {
  sourceName: string;
  baseUrl: string;
  licenseType?: "official" | "open" | "unknown";
  robotsAllowed?: boolean;
  url: string;
  documentType: "pdf" | "html";
  publishedYear?: number;
  exam?: "JEE Main" | "JEE Advanced";
  paperCode?: string;
  storagePath?: string;
  contentHash?: string;
  parseStatus?: "pending" | "parsed" | "failed";
};

export async function POST(request: NextRequest) {
  try {
    if (!assertInternalIngestAuth(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as SourceDocumentPayload;
    if (!body.sourceName || !body.baseUrl || !body.url || !body.documentType) {
      return NextResponse.json({ error: "sourceName, baseUrl, url, and documentType are required." }, { status: 400 });
    }

    let sourceId = "";
    const existing = await supabaseRest<Array<{ id: string }>>(
      `question_sources?select=id&name=eq.${encodeURIComponent(body.sourceName)}&base_url=eq.${encodeURIComponent(body.baseUrl)}&limit=1`,
      "GET"
    );
    sourceId = existing[0]?.id || "";

    if (!sourceId) {
      const sourceRows = await supabaseRest<Array<{ id: string }>>(
        "question_sources",
        "POST",
        [
          {
            name: body.sourceName,
            base_url: body.baseUrl,
            license_type: body.licenseType || "unknown",
            is_active: true,
            robots_allowed: Boolean(body.robotsAllowed),
            terms_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        "return=representation"
      );
      sourceId = sourceRows[0]?.id || "";
    }

    if (!sourceId) {
      return NextResponse.json({ error: "Unable to resolve source id." }, { status: 500 });
    }

    await supabaseRest(
      "source_documents?on_conflict=url",
      "POST",
      [
        {
          source_id: sourceId,
          url: body.url,
          document_type: body.documentType,
          published_year: body.publishedYear || null,
          exam: body.exam || null,
          paper_code: body.paperCode || null,
          storage_path: body.storagePath || null,
          fetched_at: new Date().toISOString(),
          content_hash: body.contentHash || null,
          parse_status: body.parseStatus || "pending",
          updated_at: new Date().toISOString()
        }
      ],
      "resolution=merge-duplicates,return=minimal"
    );

    return NextResponse.json({ ok: true, sourceId });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to ingest source document."
      },
      { status: 500 }
    );
  }
}
