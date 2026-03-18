import { handleError, json, requireAuth } from "@/lib/api";
import {
  disconnectGoogleCalendar,
  getCalendarConnection,
} from "@/lib/google-calendar";

export async function GET() {
  try {
    const user = await requireAuth();
    const connection = await getCalendarConnection(user.id);

    return json({
      connected: Boolean(connection),
      calendarId: connection?.calendarId ?? null,
      connectedAt: connection?.createdAt ?? null,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth();
    await disconnectGoogleCalendar(user.id);
    return json({ disconnected: true });
  } catch (err) {
    return handleError(err);
  }
}
