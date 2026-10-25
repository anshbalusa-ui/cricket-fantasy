export type SupabaseConfig = { url: string; key: string };

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export function getPreviewSiteOrigin(vercelEnv = process.env.VERCEL_ENV, vercelUrl = process.env.VERCEL_URL): string | null {
  if (vercelEnv !== "preview" || !vercelUrl || /[/?#@\\\s]/.test(vercelUrl)) return null;
  try {
    const parsed = new URL(`https://${vercelUrl}`);
    if (parsed.hostname !== vercelUrl.toLowerCase() || !parsed.hostname.endsWith(".vercel.app")) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}
