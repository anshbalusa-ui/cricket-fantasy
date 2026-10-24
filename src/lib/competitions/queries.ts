import "server-only";
import { requireUser } from "@/lib/auth/session";

export async function getAvailableSeasons() {
  const { supabase } = await requireUser("/leagues/new");
  const { data, error } = await supabase.from("seasons").select("id,name,year,status,competition_id").order("year", { ascending: false });
  if (error) throw new Error(`Unable to load seasons: ${error.message}`);
  const { data: competitions, error: competitionsError } = await supabase.from("competitions").select("id,name,slug");
  if (competitionsError) throw new Error(`Unable to load competitions: ${competitionsError.message}`);
  const competitionsById = new Map((competitions ?? []).map((competition) => [competition.id, competition]));
  return (data ?? []).map((season) => {
    const competition = competitionsById.get(season.competition_id);
    if (!competition) throw new Error(`Season ${season.id} references a missing competition.`);
    return { ...season, competition };
  });
}
