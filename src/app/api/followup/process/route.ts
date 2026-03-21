import { logger } from "@/lib/logger";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { requireCronAuth } from "@/lib/cron";
import { processFollowUps } from "@/lib/followup";

export async function POST(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) {
    return authError;
  }

  try {
    const results = await processFollowUps();
    return json({ processed: results.length, results });
  } catch (err) {
    logger.error("Follow-up processing error", { error: err instanceof Error ? err.message : String(err) });
    return error("Erro ao processar follow-ups", 500);
  }
}
