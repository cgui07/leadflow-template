/**
 * Configura CORS no bucket R2 para permitir uploads diretos do browser.
 * Execute uma vez: node scripts/configure-r2-cors.mjs
 *
 * Requer as variáveis: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *                      R2_BUCKET, NEXT_PUBLIC_APP_URL
 */

import { readFileSync } from "fs";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

// Load .env.local manually (no dotenv dependency needed)
function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // file may not exist in CI / production
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET || "lospeflow-pdfs";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "*";

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error("❌ Variáveis R2_ENDPOINT, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY são obrigatórias.");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

const corsRule = {
  AllowedOrigins: [appUrl],
  AllowedMethods: ["PUT", "GET", "HEAD"],
  AllowedHeaders: ["Content-Type", "Content-Length", "x-amz-checksum-crc32"],
  ExposeHeaders: ["ETag"],
  MaxAgeSeconds: 3600,
};

console.log(`\nConfigurando CORS no bucket: ${bucket}`);
console.log(`Origem permitida: ${appUrl}`);
console.log(`Endpoint: ${endpoint}\n`);

try {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: [corsRule] },
    })
  );

  // Verify
  const result = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log("✅ CORS configurado com sucesso!");
  console.log("Regras aplicadas:", JSON.stringify(result.CORSRules, null, 2));
} catch (err) {
  console.error("❌ Erro ao configurar CORS:", err.message);
  console.error("\nVerifique se o token R2 tem permissão de Admin Read & Write (não apenas Object Read & Write).");
  process.exit(1);
}
