import { createClient } from "@supabase/supabase-js";

const BUCKET = "property-pdfs";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function uploadPropertyPdf(
  userId: string,
  propertyId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  const path = `${userId}/${propertyId}/${Date.now()}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return path;
}

export async function deletePropertyPdf(storagePath: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("[storage] Delete failed:", error.message);
  }
}

export async function getPropertyPdfUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Supabase Storage sign failed: ${error?.message}`);
  }

  return data.signedUrl;
}
