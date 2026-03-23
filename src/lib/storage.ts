import { env } from "./env";
import { logger } from "./logger";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = env.R2_BUCKET;

function getR2Client() {
  const endpoint = env.R2_ENDPOINT;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2_ENDPOINT, R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY env vars");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function deletePropertyPdf(storagePath: string): Promise<void> {
  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: storagePath }),
    );
  } catch (err) {
    logger.error("Delete failed", { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function getPropertyPdfUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const client = getR2Client();

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: storagePath });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function createPresignedUploadUrl(
  userId: string,
  propertyId: string,
  filename: string,
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const key = `${userId}/${propertyId}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: "application/pdf",
  });

  const url = await getSignedUrl(client, command, { expiresIn: 600 });
  return { key, url };
}

export async function verifyUploadExists(key: string): Promise<number> {
  const client = getR2Client();

  const head = await client.send(
    new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
  );

  return head.ContentLength ?? 0;
}
