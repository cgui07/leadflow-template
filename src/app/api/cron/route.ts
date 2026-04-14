import { logger } from "@/lib/logger";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { requireCronAuth } from "@/lib/cron";
import { processEscalations } from "@/lib/alerts";
import { processFollowUps } from "@/lib/followup";
import { processAllGmailLeads } from "@/lib/gmail";
import { processVisitConfirmations } from "@/lib/visit-confirmations";

export async function POST(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) {
    return authError;
  }

  try {
    const [followUpResults, escalationResults, visitConfirmationResults, gmailResults] =
      await Promise.all([
        processFollowUps(),
        processEscalations(),
        processVisitConfirmations(),
        processAllGmailLeads(),
      ]);

    return json({
      followUps: { processed: followUpResults.length },
      escalations: { processed: escalationResults.length },
      visitConfirmations: { processed: visitConfirmationResults.length },
      gmailLeads: { processed: gmailResults.reduce((acc, r) => acc + r.processed, 0) },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Cron processing error", { error: err instanceof Error ? err.message : String(err) });
    return error("Erro ao processar automações", 500);
  }
}

