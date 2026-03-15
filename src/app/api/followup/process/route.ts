import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { processFollowUps } from "@/lib/followup";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return error("Unauthorized", 401);
  }

  try {
    const results = await processFollowUps();
    return json({ processed: results.length, results });
  } catch (err) {
    console.error("Follow-up processing error:", err);
    return error("Erro ao processar follow-ups", 500);
  }
}
