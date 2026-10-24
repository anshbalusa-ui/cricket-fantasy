import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
}

export async function requireUser(next?: string) {
  if (!isSupabaseConfigured()) redirect("/sign-in");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const target = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/sign-in${target}`);
  }
  return { user: data.user, supabase };
}
