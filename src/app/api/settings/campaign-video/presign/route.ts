import { z } from "zod";
import { NextRequest } from "next/server";
import { requireAuth, json, handleError } from "@/lib/api";
import { createPresignedVideoUploadUrl } from "@/lib/storage";

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.literal("video/mp4"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = schema.parse(await req.json());

    const { key, url, publicUrl } = await createPresignedVideoUploadUrl(
      user.id,
      "campaign/outreach",
      body.filename,
      body.contentType,
    );

    return json({ key, url, publicUrl });
  } catch (err) {
    return handleError(err);
  }
}
