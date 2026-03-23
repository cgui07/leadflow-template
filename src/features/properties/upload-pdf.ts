import type { PdfEntry } from "./types";

export async function uploadPdfDirect(
  propertyId: string,
  file: File,
): Promise<PdfEntry> {
  const presignRes = await fetch(`/api/properties/${propertyId}/pdf/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, size: file.size }),
  });

  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error(data.error ?? "Erro ao preparar upload.");
  }

  const { key, url, filename, size } = await presignRes.json();

  const uploadRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Erro ao enviar arquivo. Tente novamente.");
  }

  const confirmRes = await fetch(`/api/properties/${propertyId}/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, filename, size }),
  });

  if (!confirmRes.ok) {
    const data = await confirmRes.json().catch(() => ({}));
    throw new Error(data.error ?? "Erro ao confirmar upload.");
  }

  return confirmRes.json();
}
