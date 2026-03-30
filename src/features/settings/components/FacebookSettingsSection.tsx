import { Megaphone } from "lucide-react";
import type { UserSettings } from "../contracts";
import { CheckboxField, TextField } from "@/components/forms";
import { SectionContainer } from "@/components/layout/SectionContainer";

interface FacebookSettingsSectionProps {
  form: UserSettings;
  saveError: string | null;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function FacebookSettingsSection({
  form,
  saveError,
  update,
}: FacebookSettingsSectionProps) {
  return (
    <>
      {saveError && (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionContainer
          title="Facebook / Instagram Ads"
          icon={<Megaphone className="h-5 w-5 text-secondary" />}
        >
          <div className="space-y-4">
            <TextField
              label="Page ID"
              value={form.facebookPageId || ""}
              onChange={(event) => update("facebookPageId", event.target.value || null)}
              placeholder="Ex: 123456789012345"
            />

            <TextField
              label="Token de acesso da Meta"
              type="password"
              value={form.facebookPageAccessToken || ""}
              onChange={(event) => update("facebookPageAccessToken", event.target.value)}
              placeholder="Cole o token da Página ou do Usuário"
              description="Use o token da Página que publicou o formulário ou de um usuário com acesso à Página e à conta de anúncios. Esse campo não recebe o campaign_id."
            />

            <CheckboxField
              variant="switch"
              label="Envio automático via WhatsApp"
              checked={form.facebookAutoOutreach}
              onChange={(checked) => update("facebookAutoOutreach", checked)}
            />

            <p className="text-xs text-neutral">
              Quando ativado, novos leads de campanhas recebem automaticamente a mensagem de saudação via WhatsApp.
            </p>
          </div>
        </SectionContainer>

        <SectionContainer title="Como configurar">
          <div className="space-y-3 text-sm text-neutral">
            <p>1. Crie um App em developers.facebook.com (tipo Business)</p>
            <p>2. Adicione o produto Webhooks, assine o objeto page e o campo leadgen</p>
            <p>
              3. URL do webhook:{" "}
              <code className="rounded bg-surface-alt px-1.5 py-0.5 text-xs">
                https://seu-dominio/api/facebook/webhook
              </code>
            </p>
            <p>4. Use a Página que publicou o formulário e copie o Page ID dela</p>
            <p>
              5. Gere um token com <code>ads_management</code>,{" "}
              <code>leads_retrieval</code>, <code>pages_show_list</code>,{" "}
              <code>pages_read_engagement</code> e <code>pages_manage_ads</code>
            </p>
            <p>
              6. Se usar webhook, inclua também a permissão{" "}
              <code>pages_manage_metadata</code>
            </p>
            <p>7. Cole o Page ID e o token nos campos ao lado</p>
          </div>
        </SectionContainer>
      </div>
    </>
  );
}
