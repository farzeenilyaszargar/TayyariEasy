import { NextRequest, NextResponse } from "next/server";
import { fetchActiveBlueprints } from "@/lib/test-engine";
import { supabaseRest } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") || undefined) as "topic" | "subject" | "full_mock" | undefined;
    const subject = searchParams.get("subject") || undefined;
    const topic = searchParams.get("topic") || undefined;

    const blueprints = await fetchActiveBlueprints({ scope, subject, topic });

    const withCounts = await Promise.all(
      blueprints.map(async (blueprint) => {
        const filters: string[] = ["is_published=eq.true", "select=id"];
        if (blueprint.scope === "topic" && blueprint.subject && blueprint.topic) {
          filters.push(`subject=eq.${encodeURIComponent(blueprint.subject)}`);
          filters.push(`topic=eq.${encodeURIComponent(blueprint.topic)}`);
        } else if (blueprint.scope === "subject" && blueprint.subject) {
          filters.push(`subject=eq.${encodeURIComponent(blueprint.subject)}`);
        }

        const items = await supabaseRest<Array<{ id: string }>>(`question_bank?${filters.join("&")}`, "GET");
        return {
          ...blueprint,
          availableQuestions: items.length
        };
      })
    );

    return NextResponse.json({ items: withCounts });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load test catalog."
      },
      { status: 500 }
    );
  }
}
