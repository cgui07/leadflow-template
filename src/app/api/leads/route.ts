import { NextRequest } from "next/server";
import { createLead, listLeads } from "@/features/leads/server";
import { error, handleError, json, requireAuth } from "@/lib/api";

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

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const lead = await createLead(
      user.id,
      (await req.json()) as Record<string, unknown>,
    );

    return json(lead, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "LEAD_NAME_PHONE_REQUIRED") {
      return error("Nome e telefone são obrigatórios", 400);
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
    }

    return handleError(err);
  }
}
