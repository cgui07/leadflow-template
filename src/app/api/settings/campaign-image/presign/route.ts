import { z } from "zod";
import { NextRequest } from "next/server";
import { requireAuth, json, handleError } from "@/lib/api";
import { createPresignedImageUploadUrl } from "@/lib/storage";

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  slot: z.enum(["outreach", "second"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = schema.parse(await req.json());

    const { key, url, publicUrl } = await createPresignedImageUploadUrl(
      user.id,
      `campaign/${body.slot}`,
      body.filename,
      body.contentType,
    );

    return json({ key, url, publicUrl });
  } catch (err) {
    return handleError(err);
  }
}
