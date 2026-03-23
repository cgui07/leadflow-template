"use client";

import { useState } from "react";
import { Bell, Bot, Mic2 } from "lucide-react";
import type { UserSettings } from "../contracts";
import { AI_PROVIDER_OPTIONS } from "@/lib/ai-models";
import { VoiceCloneRecorder } from "./VoiceCloneRecorder";
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

function parseInteger(value: string, fallback: number): number {
  const nextValue = Number.parseInt(value, 10);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

export function AutomationSettingsSection({
  form,
  modelOptions,
  saveError,
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

            {form.followUpEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Intervalo entre follow-ups"
                    type="number"
                    value={String(form.followUpDelayHours)}
                    onChange={(event) =>
                      update(
                        "followUpDelayHours",
                        parseInteger(
                          event.target.value,
                          form.followUpDelayHours,
                        ),
                      )
                    }
                    min={1}
                    max={168}
                    description="Em horas (ex: 24 = 1 dia)"
                  />
                  <TextField
                    label="Máximo de follow-ups"
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
                    description="Por lead"
                  />
                </div>

                {!!form.followUpCustomInstructions && (
                  <div className="text-xs text-neutral">
                    Os campos acima sempre prevalecem sobre o roteiro — o
                    sistema controla <strong>quando</strong> e{" "}
                    <strong>quantas vezes</strong> envia. O roteiro controla
                    apenas o <strong>conteúdo</strong> de cada mensagem.
                  </div>
                )}

                <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Roteiro personalizado
                      </div>
                      <div className="mt-0.5 text-xs text-neutral">
                        Descreva em texto livre como você quer que a IA faça os
                        follow-ups. Ela vai seguir exatamente o que você
                        escrever.
                      </div>
                    </div>
                    <CheckboxField
                      variant="switch"
                      label=""
                      checked={!!form.followUpCustomInstructions}
                      onChange={(checked) =>
                        update(
                          "followUpCustomInstructions",
                          checked ? " " : null,
                        )
                      }
                    />
                  </div>

                  {!!form.followUpCustomInstructions && (
                    <div className="space-y-2">
                      <TextareaField
                        label=""
                        value={
                          form.followUpCustomInstructions === " "
                            ? ""
                            : form.followUpCustomInstructions
                        }
                        onChange={(event) =>
                          update(
                            "followUpCustomInstructions",
                            event.target.value || null,
                          )
                        }
                        rows={5}
                        placeholder={`Exemplos do que você pode escrever:

"Faça no máximo 3 follow-ups. No primeiro, mencione o apartamento que o cliente viu e pergunte se ele ainda tem interesse. No segundo, ofereça agendar uma visita no fim de semana. No terceiro, informe que o imóvel está com alta procura."`}
                      />
                      <div className="text-xs text-neutral">
                        A IA mantém o tom natural de WhatsApp e nunca se revela
                        como robô — só o conteúdo muda.
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
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
                    onChange={(e) =>
                      update("elevenlabsVoiceId", e.target.value || null)
                    }
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
