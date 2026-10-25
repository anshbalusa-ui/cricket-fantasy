import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/auth/validation";

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const failure = (reason: string) => NextResponse.redirect(new URL(`/sign-in?error=${reason}&next=${encodeURIComponent(next)}`, request.url));
  if (!isSupabaseConfigured()) return failure("setup");
  if (!tokenHash || tokenHash.length > 256) return failure("confirmation");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (error) return failure("confirmation");
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return failure("confirmation");
  }
}
