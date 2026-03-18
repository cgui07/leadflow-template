import { prisma } from "./db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function getGoogleCalendarAuthUrl(userId: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/settings/google-calendar/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: userId,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCalendarCode(
  code: string,
  userId: string,
): Promise<void> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/settings/google-calendar/callback`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(
      `Failed to exchange code: ${data.error_description ?? data.error}`,
    );
  }

  const expiresAt = new Date(Date.now() + (data.expires_in as number) * 1000);

  await prisma.calendarConnection.upsert({
    where: { userId_provider: { userId, provider: "google" } },
    create: {
      userId,
      provider: "google",
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) ?? null,
      tokenExpiresAt: expiresAt,
      calendarId: "primary",
    },
    update: {
      accessToken: data.access_token as string,
      ...(data.refresh_token
        ? { refreshToken: data.refresh_token as string }
        : {}),
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    },
  });
}

async function refreshGoogleToken(connection: {
  id: string;
  refreshToken: string | null;
}): Promise<string> {
  if (!connection.refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: connection.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(`Token refresh failed: ${data.error as string}`);
  }

  const expiresAt = new Date(Date.now() + (data.expires_in as number) * 1000);

  await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: data.access_token as string,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    },
  });

  return data.access_token as string;
}

async function getValidAccessToken(
  userId: string,
): Promise<{ token: string; calendarId: string } | null> {
  const connection = await prisma.calendarConnection.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
  });

  if (!connection?.accessToken) return null;

  // Refresh if expiring within 5 minutes
  const isExpiring = connection.tokenExpiresAt
    ? connection.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)
    : true;

  let token = connection.accessToken;

  if (isExpiring) {
    try {
      token = await refreshGoogleToken(connection);
    } catch (err) {
      console.error("[google-calendar] Token refresh failed:", err);
      return null;
    }
  }

  return { token, calendarId: connection.calendarId };
}

export async function getCalendarConnection(userId: string) {
  return prisma.calendarConnection.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
    select: { id: true, calendarId: true, createdAt: true },
  });
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await prisma.calendarConnection.deleteMany({
    where: { userId, provider: "google" },
  });
}

export interface CalendarAvailability {
  isAvailable: boolean;
  conflictingEvents: Array<{ summary: string; start: string; end: string }>;
}

export async function checkCalendarAvailability(
  userId: string,
  startTime: Date,
  endTime: Date,
): Promise<CalendarAvailability> {
  const auth = await getValidAccessToken(userId);

  if (!auth) {
    // No calendar connected — assume available
    return { isAvailable: true, conflictingEvents: [] };
  }

  const params = new URLSearchParams({
    timeMin: startTime.toISOString(),
    timeMax: endTime.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(auth.calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  );

  if (!res.ok) {
    console.error("[google-calendar] checkAvailability failed:", res.status);
    return { isAvailable: true, conflictingEvents: [] };
  }

  const data = (await res.json()) as {
    items?: Array<{
      status?: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  const conflicting = (data.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .map((e) => ({
      summary: e.summary ?? "Compromisso",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
    }));

  return { isAvailable: conflicting.length === 0, conflictingEvents: conflicting };
}

export interface CalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  reminderMinutes?: number;
}

export async function createCalendarEvent(
  userId: string,
  eventData: CalendarEventData,
): Promise<{ eventId: string; calendarId: string } | null> {
  const auth = await getValidAccessToken(userId);
  if (!auth) return null;

  const body = {
    summary: eventData.summary,
    description: eventData.description ?? "",
    location: eventData.location ?? "",
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: eventData.reminderMinutes ?? 30 },
        { method: "email", minutes: 60 * 24 },
      ],
    },
  };

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(auth.calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    console.error("[google-calendar] createEvent failed:", res.status, await res.text());
    return null;
  }

  const created = (await res.json()) as { id: string };
  return { eventId: created.id, calendarId: auth.calendarId };
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  calendarId: string,
  eventData: Partial<CalendarEventData>,
): Promise<boolean> {
  const auth = await getValidAccessToken(userId);
  if (!auth) return false;

  const body: Record<string, unknown> = {};
  if (eventData.summary) body.summary = eventData.summary;
  if (eventData.description) body.description = eventData.description;
  if (eventData.location) body.location = eventData.location;
  if (eventData.startTime) {
    body.start = {
      dateTime: eventData.startTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    };
  }
  if (eventData.endTime) {
    body.end = {
      dateTime: eventData.endTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    };
  }

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  return res.ok;
}

export async function deleteCalendarEvent(
  userId: string,
  eventId: string,
  calendarId: string,
): Promise<boolean> {
  const auth = await getValidAccessToken(userId);
  if (!auth) return false;

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    },
  );

  return res.ok || res.status === 404;
}

export async function suggestAlternativeSlots(
  userId: string,
  preferredDate: Date,
  durationMinutes: number,
): Promise<Date[]> {
  const slots: Date[] = [];

  const candidates: Date[] = [];
  for (const offsetHours of [0.5, 1, 2, 3]) {
    const candidate = new Date(
      preferredDate.getTime() + offsetHours * 60 * 60 * 1000,
    );
    if (candidate.getHours() >= 8 && candidate.getHours() < 19) {
      candidates.push(candidate);
    }
  }

  // Same time next day
  const nextDay = new Date(preferredDate);
  nextDay.setDate(nextDay.getDate() + 1);
  candidates.push(nextDay);

  // Next day +1h
  const nextDayPlus = new Date(nextDay);
  nextDayPlus.setHours(Math.min(nextDay.getHours() + 1, 18));
  candidates.push(nextDayPlus);

  for (const candidate of candidates) {
    const endTime = new Date(candidate.getTime() + durationMinutes * 60 * 1000);
    const { isAvailable } = await checkCalendarAvailability(
      userId,
      candidate,
      endTime,
    );
    if (isAvailable) {
      slots.push(candidate);
      if (slots.length >= 3) break;
    }
  }

  return slots;
}
