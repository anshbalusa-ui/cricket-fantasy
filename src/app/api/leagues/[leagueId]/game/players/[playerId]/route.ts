import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leagueId: string; playerId: string }> },
) {
  if (!isSupabaseConfigured())
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  const { leagueId, playerId } = await params;
  if (!UUID.test(leagueId) || !UUID.test(playerId))
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: NO_STORE },
    );
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: NO_STORE },
      );
    const { data, error } = await supabase.rpc("get_player_history", {
      p_league_id: leagueId,
      p_player_id: playerId,
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("membership required") ||
        message.includes("not found")
      ) {
        return NextResponse.json(
          { error: "Not found" },
          { status: 404, headers: NO_STORE },
        );
      }
      if (message.includes("authentication required")) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers: NO_STORE },
        );
      }
      return NextResponse.json(
        { error: "Unable to load player history" },
        { status: 500, headers: NO_STORE },
      );
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: NO_STORE },
      );
    }
    return NextResponse.json(data, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { error: "Unable to load player history" },
      { status: 500, headers: NO_STORE },
    );
  }
}
