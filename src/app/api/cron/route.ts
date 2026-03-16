import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { requireCronAuth } from "@/lib/cron";
import { processEscalations } from "@/lib/alerts";
import { processFollowUps } from "@/lib/followup";

export async function POST(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) {
    return authError;
  }

  try {
    const [followUpResults, escalationResults] = await Promise.all([
      processFollowUps(),
      processEscalations(),
    ]);

    return json({
      followUps: { processed: followUpResults.length, results: followUpResults },
      escalations: { processed: escalationResults.length, results: escalationResults },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron processing error:", err);
    return error("Erro ao processar automações", 500);
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
