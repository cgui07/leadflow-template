# CLAUDE.md — LeadFlow

Guia completo do projeto para assistentes de IA. Cobre arquitetura, convenções, fluxos e padrões chave.

---

## O que é o projeto

**LeadFlow** é um SaaS multi-tenant de CRM voltado para corretores de imóveis brasileiros. Cada corretor tem seu próprio login, base de leads, conversas e configurações isoladas. A IA responde automaticamente no WhatsApp em nome do corretor, com suporte a respostas em áudio via ElevenLabs.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript 5 |
| Banco | PostgreSQL via Supabase |
| ORM | Prisma 7 com `@prisma/adapter-pg` |
| CSS | Tailwind v4 (`tailwind.config.ts` + `@import "tailwindcss"` no CSS) |
| Auth | JWT em cookie HttpOnly + bcryptjs + Google OAuth |
| WhatsApp | Evolution API v2 (self-hosted) |
| IA | OpenAI (gpt-4o-mini padrão) ou Anthropic (claude-haiku padrão) |
| Voz | ElevenLabs (TTS + clone de voz instantâneo) |
| Email | Resend |
| Deploy | Vercel |
| Ícones | Lucide React |

---

## Estrutura de diretórios

```
leadflow-template/
├── src/
│   ├── app/
│   │   ├── (auth)/              # login, cadastro, recuperação de senha
│   │   ├── (dashboard)/         # área logada (leads, conversas, pipeline, settings...)
│   │   │   ├── layout.tsx
│   │   │   ├── leads/
│   │   │   ├── pipeline/
│   │   │   ├── conversations/
│   │   │   ├── tasks/
│   │   │   ├── properties/
│   │   │   ├── settings/
│   │   │   └── admin/
│   │   └── api/
│   │       ├── auth/            # login, register, logout, google, invite
│   │       ├── leads/           # CRUD + actions
│   │       ├── conversations/   # CRUD + messages + media + summary
│   │       ├── pipeline/        # stages + move
│   │       ├── tasks/           # CRUD
│   │       ├── settings/        # user & tenant settings + voice-clone
│   │       ├── properties/      # catálogo de imóveis
│   │       ├── dashboard/       # métricas + fila de atenção
│   │       ├── whatsapp/        # webhook, status, qrcode, connect
│   │       ├── facebook/        # webhook
│   │       ├── followup/        # processamento de follow-ups agendados
│   │       ├── cron/            # trigger de automações agendadas
│   │       └── admin/           # endpoints do painel de plataforma
│   ├── components/
│   │   ├── domain/              # componentes com lógica de negócio (LeadCard, chat...)
│   │   ├── forms/               # campos de formulário (TextField, SelectField, CheckboxField...)
│   │   ├── landing/             # seções da landing page
│   │   ├── layout/              # Sidebar, Topbar, NotificationBell
│   │   ├── ui/                  # genéricos: Button, Modal, Drawer, DataTable...
│   │   └── providers/           # BrandingProvider
│   ├── features/                # módulos por domínio (business logic + hooks + server actions)
│   │   ├── auth/
│   │   ├── leads/
│   │   ├── conversations/
│   │   ├── pipeline/
│   │   ├── tasks/
│   │   ├── properties/
│   │   ├── settings/            # server.ts, contracts.ts, hooks/, components/
│   │   ├── dashboard/
│   │   └── platform-admin/
│   ├── lib/                     # utilitários e clientes de serviços
│   │   ├── db.ts                # singleton do Prisma
│   │   ├── ai.ts                # geração de respostas, qualificação de leads
│   │   ├── auto-reply.ts        # orquestração do ciclo de resposta automática
│   │   ├── whatsapp.ts          # envio de mensagens texto, mídia e áudio PTT
│   │   ├── elevenlabs.ts        # TTS e clone de voz via ElevenLabs API
│   │   ├── voice-reply.ts       # decisão de quando usar áudio + controle de uso
│   │   ├── media.ts             # download e processamento de mídia (Whisper)
│   │   ├── evolution.ts         # cliente da Evolution API
│   │   ├── branding.ts          # helpers de branding de tenant
│   │   └── lead-*.ts            # utilitários de lead
│   └── generated/prisma/        # cliente Prisma gerado — NÃO editar
├── prisma/
│   └── schema.prisma            # fonte da verdade do banco
├── .github/workflows/
│   └── run-automations.yml      # cron via GitHub Actions (a cada 2h)
├── vercel.json                  # cron diário às 2h UTC
├── tailwind.config.ts
├── tsconfig.json                # alias: `@/*` → `./src/*`
└── next.config.ts
```

---

## Multi-tenancy

- Cada `User` tem um `UserSettings` (1:1) com todas as suas configurações
- Leads, conversas e mensagens são sempre filtrados por `userId`
- **Nunca misturar dados entre usuários** — sempre usar `userId` nos queries
- `tenantId` agrupa usuários de uma mesma empresa (planos corporativos)
- Branding customizado por tenant (cores, logo) via `BrandingProvider`
- Feature flags ficam no modelo `Tenant`

---

## Fluxo principal — WhatsApp + IA + Voz

```
Mensagem chega via Evolution API
  → POST /api/whatsapp/webhook
  → processIncomingMessage() [whatsapp.ts]
  → Cria/atualiza Lead + Conversation + Message
  → Agenda auto-reply com delay configurável
  → processScheduledAutoReply() [auto-reply.ts]
    → Enriquece mídia (transcreve áudio Whisper, embute imagem)
    → generateAutoReply() [ai.ts] → gera texto
    → Avalia shouldUseVoiceReply() [voice-reply.ts]
      → Se sim: generateSpeechBase64() [elevenlabs.ts] → sendAndSaveAudioPTT()
      → Se não: sendAndSaveMessage() texto normal
    → qualifyLead() a cada N mensagens
```

---

## Arquivos-chave

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/ai.ts` | Geração de respostas IA, qualificação, extração de dados |
| `src/lib/auto-reply.ts` | Orquestração do ciclo de resposta automática |
| `src/lib/whatsapp.ts` | Envio texto, mídia e áudio PTT via Evolution API |
| `src/lib/elevenlabs.ts` | TTS e clone de voz via ElevenLabs |
| `src/lib/voice-reply.ts` | Decisão de quando usar áudio + controle de uso mensal |
| `src/lib/media.ts` | Download/processamento de mídia, transcrição Whisper |
| `src/lib/evolution.ts` | Cliente da Evolution API (instâncias, QR code, webhook) |
| `src/features/settings/` | CRUD de configurações (server, contracts, hooks, components) |
| `prisma/schema.prisma` | Fonte da verdade do banco de dados |
| `db-migrations.local.txt` | SQL canônico para criar o banco do zero (não commitado) |

---

## Banco de dados

Schema em `prisma/schema.prisma`. Cliente gerado em `src/generated/prisma`.

| Tabela | Descrição |
|--------|-----------|
| `users` | Corretores/usuários da plataforma |
| `user_settings` | Configurações por usuário (IA, WhatsApp, voz, follow-up) |
| `tenants` | Empresas/workspaces para multi-tenant |
| `invite_tokens` | Convites de equipe por email |
| `leads` | Leads com score, qualificação e pipeline |
| `conversations` | Uma conversa por lead |
| `messages` | Mensagens (inbound/outbound, text/audio/image/document) |
| `activities` | Log de auditoria por lead |
| `tasks` | Tarefas e lembretes |
| `lead_actions` | Ações detectadas pela IA (visita, proposta, financiamento) |
| `pipeline_stages` | Etapas do funil por usuário |
| `properties` | Catálogo de imóveis (usado pela IA nas respostas) |
| `facebook_page_mappings` | Páginas Facebook conectadas por usuário |
| `voice_reply_usage` | Controle de uso mensal de áudio por usuário |

**Convenções:**
- UUIDs como chaves primárias (`gen_random_uuid()`)
- `created_at` / `updated_at` em todos os modelos
- JSON/JSONB para metadata flexível
- Cascade delete para integridade referencial

---

## Feature de áudio com IA (ElevenLabs)

- **API Key**: `ELEVENLABS_API_KEY` no `.env` — uma chave compartilhada entre todos os usuários
- **Voice ID**: por usuário em `user_settings.elevenlabs_voice_id`
- **Ativação**: `user_settings.voice_reply_enabled = true`
- **Limite mensal**: `user_settings.voice_reply_monthly_limit` — definido por admin via SQL
- **Uso registrado**: tabela `voice_reply_usage` (user_id + month + count)

### Quando usa áudio (`voice-reply.ts`)
1. Sempre na **primeira resposta** da conversa
2. Lead demonstra **intenção**: preço, localização, quartos, visita, decisão de compra
3. **Não usa** se: áudio recente nas últimas 3 mensagens, resposta < 40 chars, limite atingido

### Clone de voz
- Corretor grava ~30s na tela de Configurações (`VoiceCloneRecorder`)
- Sistema envia para `POST /v1/voices/add` do ElevenLabs
- Voice ID salvo automaticamente em `user_settings`
- Rota: `POST /api/settings/voice-clone`

---

## Autenticação

- JWT em cookie HTTP-only via `cookies-next`
- Hashing com bcryptjs
- Google OAuth (callback em `/api/auth/google/callback`)
- Reset de senha via token enviado por Resend

**Padrão nas API routes:**
```typescript
import { requireAuth } from "@/lib/api";

export async function GET() {
  const user = await requireAuth(); // lança erro se não autenticado
  // user.id, user.role, user.tenantId
}
```

---

## Convenções de API routes

1. **Autenticação** no topo de cada handler com `requireAuth()`
2. **Validação de input** antes de queries no banco
3. **Prisma** sempre via singleton `prisma` de `@/lib/db`
4. Usar helpers `json()`, `error()`, `handleError()` de `@/lib/api`

---

## Convenções de componentes

- **`src/components/ui/`** — genéricos, sem lógica de negócio
- **`src/components/domain/`** — conhecem leads, conversas, etc.
- **`src/components/forms/`** — campos com estilo consistente
- **`src/features/<domain>/`** — toda lógica de negócio, hooks e server actions
- **Nunca use tags HTML nuas** — sempre use componentes do projeto. Nunca `<button>`, `<input>`, `<textarea>` direto. Use `Button`, `TextField`, `TextareaField`, etc. de `src/components/ui/` ou `src/components/forms/`
- **Delete confirmations** — use `DeleteConfirmationModal` de `src/components/ui/DeleteConfirmationModal` em vez de `window.confirm()`. É mais estético e segue o padrão visual do projeto

---

## Cron & Automações

| Trigger | Schedule | Endpoint |
|---------|----------|----------|
| Vercel cron | Diário às 2h UTC | `POST /api/cron` |
| GitHub Actions | A cada 2 horas | `POST /api/cron` |

O endpoint exige header `Authorization: Bearer <CRON_SECRET>`.

---

## Convenções críticas

- **Nunca rodar `prisma migrate` automaticamente** — gerar SQL e deixar o usuário rodar no Supabase
- Após alterar `schema.prisma`: rodar `npx prisma generate` (só regenera o client)
- SQL canônico fica em `db-migrations.local.txt` (no .gitignore, não commitado)
- Instâncias WhatsApp seguem o padrão `lf-<userId>`
- Path alias: sempre usar `@/` em vez de caminhos relativos entre módulos
- Arquivos de componente: PascalCase (`LeadCard.tsx`)
- Arquivos de lib/util: kebab-case (`auto-reply.ts`)

---

## Como rodar localmente

```bash
npm run dev          # Next.js em localhost:3000
npx ngrok http 3000  # Túnel público (terminal separado, necessário para webhook WhatsApp)
```

---

## Variáveis de ambiente

```
DATABASE_URL              → Supabase pooler (pgbouncer)
DIRECT_URL                → Supabase direto (para operações admin/migrate)
JWT_SECRET                → Assina sessões
CRON_SECRET               → Protege /api/cron
NEXT_PUBLIC_APP_URL       → URL pública do frontend
APP_URL                   → URL base do servidor
EVOLUTION_API_URL         → URL da Evolution API
EVOLUTION_API_KEY         → Chave da Evolution API
ELEVENLABS_API_KEY        → Chave ElevenLabs (compartilhada entre usuários)
RESEND_API_KEY            → Emails transacionais
EMAIL_FROM                → Remetente dos emails
GOOGLE_CLIENT_ID          → OAuth Google
GOOGLE_CLIENT_SECRET      → OAuth Google
PLATFORM_ADMIN_EMAILS     → Emails com acesso ao painel interno de clientes
OPENAI_TRANSCRIPTION_KEY  → Whisper (fallback quando provedor não é OpenAI)
```

---

## Gotchas conhecidos

1. **Prisma singleton** — sempre importar de `@/lib/db`, nunca instanciar `PrismaClient` diretamente
2. **Isolamento de dados** — nunca esquecer de filtrar por `userId`; vazamento entre usuários é bug crítico
3. **Build** — `prisma generate` deve rodar antes de `next build` (já está no script `build`)
4. **Tailwind v4** — usa `@import "tailwindcss"` no CSS, não as diretivas `@tailwind base/components/utilities`
5. **Evolution API** — cada usuário tem sua própria instância WhatsApp; nome: `lf-<userId>`
6. **Sem testes** — não há framework de testes no projeto atualmente
