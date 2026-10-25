import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/session";

export const getMyProfile = cache(async (next?: string) => {
  const { user, supabase } = await requireUser(next);
  const { data: profile, error } = await supabase.from("profiles").select("id,display_name,created_at").eq("id", user.id).single();
  if (error || !profile) throw new Error("Unable to load your account profile.");
  return { user, profile };
});
