const BUCKET = "property-pdfs";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
  }
  return { url, key };
}

function headers(key: string, contentType?: string): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${key}`,
  };
  if (contentType) h["Content-Type"] = contentType;
  return h;
}

export async function uploadPropertyPdf(
  userId: string,
  propertyId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { url, key } = getSupabaseConfig();
  const path = `${userId}/${propertyId}.pdf`;

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      ...headers(key, contentType),
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase Storage upload failed: ${err}`);
  }

  return path;
}

export async function deletePropertyPdf(storagePath: string): Promise<void> {
  const { url, key } = getSupabaseConfig();

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: headers(key, "application/json"),
    body: JSON.stringify({ prefixes: [storagePath] }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[storage] Delete failed:", err);
  }
}

export async function getPropertyPdfUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { url, key } = getSupabaseConfig();

  const res = await fetch(
    `${url}/storage/v1/object/sign/${BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: headers(key, "application/json"),
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase Storage sign failed: ${err}`);
  }

  const data = await res.json();
  return `${url}/storage/v1${data.signedURL}`;
}
