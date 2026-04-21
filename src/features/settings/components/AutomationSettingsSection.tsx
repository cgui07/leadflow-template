"use client";

import { Bot } from "lucide-react";
import type { UserSettings } from "../contracts";
import { AI_PROVIDER_OPTIONS } from "@/lib/ai-models";
import { CampaignImageUpload } from "./CampaignImageUpload";
import { CustomAudiosSection } from "./CustomAudiosSection";
import { FollowUpSettingsSection } from "./FollowUpSettingsSection";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { WhatsAppConnection } from "@/components/domain/WhatsAppConnection";
import {
  CheckboxField,
  DurationField,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/forms";

interface AutomationSettingsSectionProps {
  form: UserSettings;
  modelOptions: typeof AI_PROVIDER_OPTIONS;
  saveError: string | null;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
}

export function AutomationSettingsSection({
  form,
  modelOptions,
  saveError,
  update,
}: AutomationSettingsSectionProps) {
  return (
    <>
      {saveError && (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WhatsAppConnection />

        <SectionContainer
          title="Inteligência artificial"
          icon={<Bot className="h-5 w-5 text-secondary" />}
          actions={
            <CheckboxField
              variant="switch"
              checked={form.autoReplyEnabled}
              onChange={(checked) => update("autoReplyEnabled", checked)}
            />
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Provedor</label>
                <div className="flex h-10 items-center rounded-lg border border-border bg-surface-raised px-3 text-sm text-neutral cursor-not-allowed select-none">
                  OpenAI
                </div>
              </div>
              <SelectField
                label="Modelo"
                value={form.aiModel}
                options={modelOptions}
                onChange={(value) => update("aiModel", value)}
                placeholder="Selecione um modelo"
              />
            </div>
            <div className="space-y-1.5">
              <TextField
                label="API key"
                type="password"
                value={form.aiApiKey || ""}
                onChange={(event) => update("aiApiKey", event.target.value)}
                placeholder="sk-..."
              />
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Gerar chave no painel da OpenAI →
              </a>
            </div>

            <DurationField
              label="Tempo para responder"
              description="Defina quanto tempo a IA espera antes de responder uma nova mensagem do cliente."
              valueSeconds={form.autoReplyDelaySeconds}
              onChange={(seconds) => update("autoReplyDelaySeconds", seconds)}
            />
          </div>
        </SectionContainer>

        <SectionContainer title="Mensagem de campanha">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-foreground">Primeira mensagem</div>
              <div className="text-xs text-neutral">Enviada automaticamente quando um lead chega via Facebook ou Canal Pro. Use [NOME] para incluir o nome do lead.</div>
              <TextareaField
                label=""
                value={form.campaignOutreachMessage || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update("campaignOutreachMessage", e.target.value)}
                rows={5}
                placeholder={"Olá, [NOME], tudo bem?\n\nEstou retornando seu contato. 😉\n\n1- Quer receber por aqui mesmo ou\n2- Prefere que eu te ligue?"}
              />
              <CampaignImageUpload
                slot="outreach"
                value={form.campaignOutreachImageUrl}
                onChange={(url) => update("campaignOutreachImageUrl", url)}
                label="Imagem opcional (enviada junto com a primeira mensagem)"
              />
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="text-xs font-medium text-foreground">Segunda mensagem</div>
              <div className="text-xs text-neutral">Enviada automaticamente se o lead responder &quot;1&quot; (quer receber por WhatsApp). Se vazio, a IA assume direto.</div>
              <TextareaField
                label=""
                value={form.campaignSecondMessage || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update("campaignSecondMessage", e.target.value)}
                rows={4}
                placeholder={"Ótimo! Aqui estão as informações que você pediu..."}
              />
              <CampaignImageUpload
                slot="second"
                value={form.campaignSecondImageUrl}
                onChange={(url) => update("campaignSecondImageUrl", url)}
                label="Imagem opcional (enviada junto com a segunda mensagem)"
              />
            </div>
          </div>
        </SectionContainer>

        <FollowUpSettingsSection form={form} update={update} />

        <CustomAudiosSection />

        {/* Voice reply section hidden temporarily */}
      </div>
    </>
  );
}
