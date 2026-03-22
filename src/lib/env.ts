import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  DIRECT_URL: z.string().optional(),

  JWT_SECRET: z.string().min(1, "JWT_SECRET é obrigatório"),
  CRON_SECRET: z.string().optional(),

  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL é obrigatório"),
  APP_URL: z.string().optional(),

  EVOLUTION_API_URL: z
    .string()
    .optional()
    .default("http://localhost:8080"),
  EVOLUTION_API_KEY: z.string().optional().default(""),

  ELEVENLABS_API_KEY: z.string().optional().default(""),

  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("LospeFlow <noreply@lospeflow.com>"),
  EMAIL_FROM_DEV: z
    .string()
    .optional()
    .default("LeadFlow <onboarding@resend.dev>"),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),

  PLATFORM_ADMIN_EMAILS: z.string().optional().default(""),

  OPENAI_TRANSCRIPTION_KEY: z.string().optional().default(""),

  UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),

  FACEBOOK_APP_SECRET: z.string().optional().default(""),
  FACEBOOK_VERIFY_TOKEN: z.string().optional().default(""),

  R2_ENDPOINT: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET: z.string().optional().default("lospeflow-pdfs"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${formatted}`);
  }

  return result.data;
}

export const env = loadEnv();
