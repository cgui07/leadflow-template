import { z } from "zod";
import { env } from "@/lib/env";
import { NextRequest } from "next/server";
import { requireAuth, json, handleError } from "@/lib/api";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
  "audio/wav",
  "application/pdf",
] as const;

const schema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_TYPES),
});

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = schema.parse(await req.json());

    const ext = body.filename.split(".").pop() ?? "bin";
    const key = `${user.id}/bot-flow/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ContentType: body.contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 600 });
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return json({ url, publicUrl, key });
  } catch (err) {
    return handleError(err);
  }
}
