import { NextRequest } from "next/server";
import { createLead, listLeads } from "@/features/leads/server";
import { handleError, json, requireAuth, withApiHandler } from "@/lib/api";
import { CreateLeadSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = req.nextUrl;
    const response = await listLeads(user.id, {
      status: url.searchParams.get("status"),
      search: url.searchParams.get("search"),
      sort: url.searchParams.get("sort") || "createdAt",
      order: url.searchParams.get("order") || "desc",
      page: Number.parseInt(url.searchParams.get("page") || "1", 10),
      limit: Number.parseInt(url.searchParams.get("limit") || "20", 10),
    });

    return json(response);
  } catch (err) {
    return handleError(err);
  }
}

export const POST = withApiHandler(CreateLeadSchema, async (user, data) => {
  const lead = await createLead(user.id, data as Record<string, unknown>);
  return json(lead, 201);
});
