import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { confirmationCredential, safeNextPath } from "@/lib/auth/validation";

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const credential = confirmationCredential(
    request.nextUrl.searchParams.get("code"),
    request.nextUrl.searchParams.get("token_hash"),
  );
  const failure = (reason: string) =>
    NextResponse.redirect(
      new URL(
        `/sign-in?error=${reason}&next=${encodeURIComponent(next)}`,
        request.url,
      ),
    );
  if (!isSupabaseConfigured()) return failure("setup");
  if (!credential) return failure("confirmation");
  try {
    const supabase = await createClient();
    const { error } =
      credential.kind === "pkce"
        ? await supabase.auth.exchangeCodeForSession(credential.value)
        : await supabase.auth.verifyOtp({
            token_hash: credential.value,
            type: "email",
          });
    if (error) return failure("confirmation");
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return failure("confirmation");
  }
}
