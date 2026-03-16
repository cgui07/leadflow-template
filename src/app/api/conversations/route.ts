import { NextRequest } from "next/server";
import { handleError, json, requireAuth } from "@/lib/api";
import { listConversations } from "@/features/conversations/server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const conversations = await listConversations(
      user.id,
      req.nextUrl.searchParams.get("search"),
    );

    return json(conversations);
  } catch (err) {
    return handleError(err);
  }
}
