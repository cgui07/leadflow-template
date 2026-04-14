import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const RegisterSchema = z.object({
  inviteToken: z.string().min(1, "Token de convite é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  phone: z.string().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
});

export const CreateLeadSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().optional(),
  value: z.number().optional(),
  region: z.string().optional(),
  propertyType: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateLeadSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().nullable().optional(),
    status: z.string().optional(),
    score: z.number().optional(),
    value: z.number().nullable().optional(),
    region: z.string().nullable().optional(),
    priceMin: z.number().nullable().optional(),
    priceMax: z.number().nullable().optional(),
    propertyType: z.string().nullable().optional(),
    purpose: z.string().nullable().optional(),
    timeline: z.string().nullable().optional(),
    bedrooms: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    pipelineStageId: z.string().nullable().optional(),
  })
  .passthrough();

export const SendMessageSchema = z.object({
  content: z.string().min(1, "Conteúdo da mensagem é obrigatório"),
});

export const UpdateConversationStatusSchema = z.object({
  status: z.enum(["bot", "human"], {
    error: "Status deve ser 'bot' ou 'human'",
  }),
});

export const CreateStageSchema = z.object({
  name: z.string().min(1, "Nome da etapa é obrigatório"),
  color: z.string().optional(),
});

export const UpdateStageSchema = z
  .object({
    name: z.string().optional(),
    color: z.string().optional(),
  })
  .refine((data) => data.name || data.color, {
    message: "Pelo menos um campo deve ser informado",
  });

export const MoveLeadSchema = z.object({
  leadId: z.string().min(1, "ID do lead é obrigatório"),
  stageId: z.string().min(1, "ID da etapa é obrigatório"),
});

export const ReorderStagesSchema = z.object({
  stageIds: z.array(z.string()).min(1, "Lista de etapas é obrigatória"),
});

export const UpdateSettingsSchema = z
  .object({
    aiProvider: z.string().optional(),
    aiApiKey: z.string().nullable().optional(),
    openaiTranscriptionKey: z.string().nullable().optional(),
    aiModel: z.string().optional(),
    campaignOutreachMessage: z.string().nullable().optional(),
    campaignOutreachImageUrl: z.string().nullable().optional(),
    campaignSecondMessage: z.string().nullable().optional(),
    campaignSecondImageUrl: z.string().nullable().optional(),
    autoReplyEnabled: z.boolean().optional(),
    autoReplyDelaySeconds: z.number().optional(),
    followUpEnabled: z.boolean().optional(),
    followUpDelayHours: z.number().optional(),
    maxFollowUps: z.number().optional(),
    facebookAutoOutreach: z.boolean().optional(),
    elevenlabsVoiceId: z.string().nullable().optional(),
    voiceReplyEnabled: z.boolean().optional(),
    voiceReplyMonthlyLimit: z.number().optional(),
  })
  .passthrough();

export const CreateTenantSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z
    .string()
    .min(1, "Slug é obrigatório")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  logoUrl: z.string().nullable().optional(),
  colorPrimary: z.string().nullable().optional(),
  colorSecondary: z.string().nullable().optional(),
  featureFlags: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const UpdateTenantCustomizationSchema = z.object({
  name: z.string().min(1, "Nome da marca é obrigatório"),
  logoUrl: z.string().nullable().optional(),
  colorPrimary: z.string().nullable().optional(),
  colorSecondary: z.string().nullable().optional(),
  featureFlags: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const CreatePropertySchema = z.object({
  rawText: z.string().min(10, "Texto deve ter pelo menos 10 caracteres"),
});

export const CreateLeadActionSchema = z.object({
  type: z.enum(["visit", "proposal", "financing"]),
  status: z.enum(["pending", "awaiting_schedule", "scheduled", "done", "completed", "cancelled"]).optional(),
  title: z.string().max(500).optional(),
  notes: z.string().max(5000).nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  reminderAt: z.string().nullable().optional(),
});

export const CreateAppointmentSchema = z.object({
  leadId: z.string().min(1, "ID do lead é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  scheduledAt: z.string().min(1, "Data é obrigatória"),
  leadActionId: z.string().nullable().optional(),
  durationMinutes: z.number().positive().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
