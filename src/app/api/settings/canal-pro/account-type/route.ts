import { z } from "zod";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { handleError, json, requireAuth } from "@/lib/api";

const schema = z.object({
  accountType: z.enum(["own", "company"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { accountType } = schema.parse(await req.json());

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, canalProAccountType: accountType },
      update: { canalProAccountType: accountType },
    });

    return json({ ok: true, accountType });
  } catch (err) {
    return handleError(err);
  }
}
