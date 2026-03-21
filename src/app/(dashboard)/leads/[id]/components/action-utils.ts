export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;

  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDatetimeLocal(dateStr: string | null | undefined) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
}

export function isOverdue(action: { scheduledAt?: string | null; status: string }) {
  if (!action.scheduledAt) return false;

  const finishedStatuses = ["completed", "cancelled"];
  if (finishedStatuses.includes(action.status)) return false;

  return new Date(action.scheduledAt) < new Date();
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function getResponseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) {
      return data.error;
    }
  } catch {
    // Ignore invalid JSON and keep the fallback message below.
  }

  return fallback;
}
