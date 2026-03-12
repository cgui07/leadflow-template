import { processFollowUps } from "@/lib/followup";
import { processEscalations } from "@/lib/alerts";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";

// Unified cron endpoint — call via Vercel Cron, external scheduler, or manually
// Runs: follow-ups + escalation rules + auto-close
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return error("Unauthorized", 401);
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

// Also support GET for Vercel Cron (which sends GET requests)
export async function GET(req: NextRequest) {
  return POST(req);
}
