"use client";

import { useState } from "react";
import { Bell, Bot, Mic2 } from "lucide-react";
import type { UserSettings } from "../contracts";
import { AI_PROVIDER_OPTIONS, type AIProvider } from "@/lib/ai-models";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { WhatsAppConnection } from "@/components/domain/WhatsAppConnection";
import {
  CheckboxField,
  DurationField,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/forms";
import { VoiceCloneRecorder } from "./VoiceCloneRecorder";

interface AutomationSettingsSectionProps {
  form: UserSettings;
  modelHelpText: string;
  modelOptions: typeof AI_PROVIDER_OPTIONS;
  saveError: string | null;
  selectedProvider: AIProvider;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
}

function parseInteger(value: string, fallback: number): number {
  const nextValue = Number.parseInt(value, 10);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

export function AutomationSettingsSection({
  form,
  modelHelpText,
  modelOptions,
  saveError,
  selectedProvider,
  update,
}: AutomationSettingsSectionProps) {
  const [hasVoiceId, setHasVoiceId] = useState(!!form.elevenlabsVoiceId);

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
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                label="Provedor"
                options={AI_PROVIDER_OPTIONS}
                value={selectedProvider}
                onChange={(value) => update("aiProvider", value)}
              />
              <SelectField
                label="Modelo"
                value={form.aiModel}
                options={modelOptions}
                onChange={(value) => update("aiModel", value)}
                placeholder="Selecione um modelo"
                searchable
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="text-xs text-neutral md:col-start-2">
                {modelHelpText}
              </div>
            </div>

            <TextField
              label="API key"
              type="password"
              value={form.aiApiKey || ""}
              onChange={(event) => update("aiApiKey", event.target.value)}
              placeholder="Chave de API"
            />

            {selectedProvider !== "openai" && (
              <TextField
                label="OpenAI API key (transcrição de áudio)"
                type="password"
                value={form.openaiTranscriptionKey || ""}
                onChange={(event) =>
                  update("openaiTranscriptionKey", event.target.value)
                }
                placeholder="Chave OpenAI para transcrever áudios"
                description="Necessária para transcrição de áudio ao usar Anthropic como provedor principal."
              />
            )}

            <CheckboxField
              variant="switch"
              label="Resposta automática"
              checked={form.autoReplyEnabled}
              onChange={(checked) => update("autoReplyEnabled", checked)}
            />

            <DurationField
              label="Tempo para responder"
              description="Defina quanto tempo a IA espera antes de responder uma nova mensagem do cliente."
              valueSeconds={form.autoReplyDelaySeconds}
              onChange={(seconds) => update("autoReplyDelaySeconds", seconds)}
            />
          </div>
        </SectionContainer>

        <SectionContainer title="Mensagem de saudação">
          <TextareaField
            label="Mensagem padrão para novos contatos quando a IA não estiver configurada"
            value={form.greetingMessage || ""}
            onChange={(event) => update("greetingMessage", event.target.value)}
            rows={4}
            placeholder="Olá! Obrigado pelo contato. Em breve um corretor especializado vai te atender."
          />
        </SectionContainer>

        <SectionContainer
          title="Follow-up automático"
          icon={<Bell className="h-5 w-5 text-accent" />}
        >
          <div className="space-y-4">
            <CheckboxField
              variant="switch"
              label="Ativar follow-ups automáticos"
              checked={form.followUpEnabled}
              onChange={(checked) => update("followUpEnabled", checked)}
            />
            <TextField
              label="Intervalo entre follow-ups (horas)"
              type="number"
              value={String(form.followUpDelayHours)}
              onChange={(event) =>
                update(
                  "followUpDelayHours",
                  parseInteger(event.target.value, form.followUpDelayHours),
                )
              }
              min={1}
              max={168}
            />
            <TextField
              label="Máximo de follow-ups por lead"
              type="number"
              value={String(form.maxFollowUps)}
              onChange={(event) =>
                update(
                  "maxFollowUps",
                  parseInteger(event.target.value, form.maxFollowUps),
                )
              }
              min={1}
              max={10}
            />
          </div>
        </SectionContainer>

        <SectionContainer
          title="Resposta em áudio"
          icon={<Mic2 className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-4">
            <CheckboxField
              variant="switch"
              label="Ativar respostas em áudio"
              checked={form.voiceReplyEnabled}
              onChange={(checked) => update("voiceReplyEnabled", checked)}
            />

            {form.voiceReplyEnabled && (
              <div className="space-y-3">
                <CheckboxField
                  variant="switch"
                  label="Já tenho o Voice ID do ElevenLabs"
                  checked={hasVoiceId}
                  onChange={(checked) => {
                    setHasVoiceId(checked);
                    if (!checked) update("elevenlabsVoiceId", null);
                  }}
                />

                {hasVoiceId ? (
                  <TextField
                    label="Voice ID"
                    value={form.elevenlabsVoiceId || ""}
                    onChange={(e) => update("elevenlabsVoiceId", e.target.value || null)}
                    placeholder="Ex: pNInz6obpgDQGcFmaJgB"
                    description="Cole o ID da voz do ElevenLabs."
                  />
                ) : (
                  <VoiceCloneRecorder
                    currentVoiceId={form.elevenlabsVoiceId}
                    onVoiceCloned={(voiceId) => {
                      update("elevenlabsVoiceId", voiceId);
                      setHasVoiceId(true);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </SectionContainer>
      </div>
    </>
  );
}
