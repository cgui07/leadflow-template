# CLAUDE.md — LeadFlow Template

This file documents the codebase for AI assistants. It covers architecture, conventions, development workflows, and key patterns.

---

## Project Overview

**LeadFlow** is a multi-tenant SaaS platform for sales lead management and automation, focused on WhatsApp Business and Facebook Messenger integrations. It's built with Next.js App Router, Prisma/PostgreSQL, and supports multi-tenancy with isolated data and custom branding per tenant.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs + Google OAuth |
| Email | Resend |
| WhatsApp | Evolution API v2 |
| AI | OpenAI (gpt-4o-mini default) |
| Deployment | Vercel |
| Icons | Lucide React |

---

## Repository Structure

```
leadflow-template/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (dashboard)/            # Protected routes (auth-gated layout group)
│   │   │   ├── layout.tsx
│   │   │   ├── leads/
│   │   │   ├── pipeline/
│   │   │   ├── conversations/
│   │   │   ├── tasks/
│   │   │   ├── properties/
│   │   │   ├── settings/
│   │   │   └── admin/
│   │   ├── api/                    # API route handlers
│   │   │   ├── auth/               # login, register, logout, google, invite
│   │   │   ├── leads/              # CRUD + actions
│   │   │   ├── conversations/      # CRUD + messages + media + summary
│   │   │   ├── pipeline/           # stages + move
│   │   │   ├── tasks/              # CRUD
│   │   │   ├── settings/           # user & tenant settings
│   │   │   ├── properties/         # real estate listings
│   │   │   ├── dashboard/          # metrics + attention-queue
│   │   │   ├── whatsapp/           # webhook, status, qrcode, connect
│   │   │   ├── facebook/           # webhook
│   │   │   ├── followup/           # process scheduled follow-ups
│   │   │   ├── cron/               # scheduled automation trigger
│   │   │   └── admin/              # platform admin endpoints
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── landing.tsx             # Public landing page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── domain/                 # Domain-specific React components
│   │   │   ├── LeadCard.tsx
│   │   │   ├── PipelineStageCard.tsx
│   │   │   └── chat/
│   │   ├── forms/                  # Form field components (TextField, SelectField, CheckboxField, etc.)
│   │   ├── landing/                # Landing page sections
│   │   ├── layout/                 # Sidebar, Topbar, NotificationBell
│   │   ├── ui/                     # Reusable: Button, Modal, Drawer, DataTable, etc.
│   │   └── providers/              # BrandingProvider
│   ├── features/                   # Feature modules (business logic + hooks + server actions)
│   │   ├── auth/                   # server.ts, session.ts, oauth.ts, utils.ts
│   │   ├── leads/
│   │   ├── conversations/
│   │   ├── pipeline/
│   │   ├── tasks/
│   │   ├── properties/
│   │   ├── settings/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   └── platform-admin/
│   ├── lib/                        # Shared utilities and service clients
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── auth.ts                 # JWT helpers, password hashing
│   │   ├── evolution.ts            # Evolution API v2 client
│   │   ├── whatsapp.ts             # WhatsApp message logic
│   │   ├── email.ts                # Resend email service
│   │   ├── ai.ts                   # OpenAI integration
│   │   ├── branding.ts             # Tenant branding helpers
│   │   ├── tenant.ts               # Tenant resolution
│   │   └── lead-*.ts               # Lead-specific utilities
│   ├── types/                      # Global TypeScript interfaces/types
│   └── proxy.ts                    # Proxy config
├── prisma/
│   └── schema.prisma               # Database schema (source of truth)
├── eslint-plugins/                 # Custom ESLint plugins (import sorting)
├── .github/workflows/
│   └── run-automations.yml         # Cron automation via GitHub Actions (every 2h)
├── .claude/
│   └── settings.json               # Claude Code permissions
├── vercel.json                     # Vercel config with daily cron at 2 AM
├── tailwind.config.ts
├── tsconfig.json                   # Path alias: `@/*` → `./src/*`
├── prisma.config.ts
└── next.config.ts
```

---

## Database Schema (Prisma)

Schema file: `prisma/schema.prisma`. Prisma client is generated to `src/generated/prisma`.

**Key models:**

| Model | Purpose |
|---|---|
| `User` | System users; roles, Google OAuth, password reset tokens |
| `UserSettings` | Per-user WhatsApp, AI, email, follow-up configuration |
| `Tenant` | Multi-tenant record; branding, feature flags |
| `InviteToken` | Email-based team invitations |
| `Lead` | Core entity; scoring, pipeline stage, follow-up scheduling |
| `Conversation` | WhatsApp/Facebook conversation threads |
| `Message` | Individual messages with status and metadata |
| `PipelineStage` | User-defined sales pipeline stages |
| `Activity` | Audit log and activity timeline per lead |
| `Task` | User tasks and reminders |
| `LeadAction` | Scheduled actions on leads |
| `FacebookPageMapping` | Facebook page connections per user |
| `properties` | Real estate property listings |

**Conventions:**
- UUIDs as primary keys
- `createdAt` / `updatedAt` timestamps on all models
- JSON fields for flexible metadata
- Cascade deletes to maintain referential integrity

**After any schema change:**
```bash
npx prisma migrate dev --name <migration-name>
npx prisma generate
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev              # Runs: next dev

# Build for production
npm run build            # Runs: prisma generate && next build

# Start production server
npm run start

# Lint
npm run lint             # Runs: eslint

# Prisma
npx prisma studio        # Visual DB browser
npx prisma migrate dev   # Apply migrations in development
npx prisma generate      # Regenerate client after schema changes
```

---

## Environment Variables

Create `.env.local` for local development. Required variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db   # Direct connection (bypasses pooler)

# Auth
JWT_SECRET=your-jwt-secret

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-api-key

# Resend (Email)
RESEND_API_KEY=your-resend-key
EMAIL_FROM_DEV=LeadFlow <onboarding@resend.dev>
EMAIL_FROM=LeadFlow <noreply@yourdomain.com>

# OpenAI
OPENAI_TRANSCRIPTION_KEY=your-openai-key

# Facebook Integration
FACEBOOK_APP_SECRET=your-facebook-secret
FACEBOOK_VERIFY_TOKEN=your-verify-token

# Cron Auth
CRON_SECRET=your-cron-secret

# Platform Admin (comma-separated emails)
PLATFORM_ADMIN_EMAILS=admin@example.com

# Node environment
NODE_ENV=development
```

---

## Authentication & Session

- **Strategy:** JWT stored in HTTP-only cookies via `cookies-next`
- **Password hashing:** bcryptjs
- **OAuth:** Google OAuth2 (callback at `/api/auth/google/callback`)
- **Session helper:** `src/features/auth/session.ts` — call `getSession(req)` in any API route to get the current user
- **Password reset:** Token-based, sent via Resend email

**Auth flow for API routes:**
```typescript
import { getSession } from "@/features/auth/session";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return new Response("Unauthorized", { status: 401 });
  // session.userId, session.tenantId, session.role
}
```

---

## Multi-Tenancy

- Every `User` belongs to a `Tenant`
- Data isolation is enforced by always filtering queries by `tenantId` (sourced from the session)
- Custom branding per tenant (colors, logo) — served by `BrandingProvider`
- Feature flags are stored on the `Tenant` model
- Use `src/lib/tenant.ts` helpers for tenant resolution

**Critical:** Always include `tenantId` in database queries that touch tenant-scoped data.

---

## API Route Conventions

All API routes live under `src/app/api/`. Follow these patterns:

1. **Authentication check** at the top of every handler
2. **Input validation** before DB queries
3. **Prisma queries** use `src/lib/db.ts` singleton client
4. Return `Response` objects with appropriate HTTP status codes
5. Use `NextResponse.json()` for JSON responses

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/features/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db.lead.findMany({ where: { userId: session.userId } });
  return NextResponse.json(data);
}
```

---

## WhatsApp Integration

- Uses **Evolution API v2** as the WhatsApp Business gateway
- Client: `src/lib/evolution.ts`
- Webhook endpoint: `POST /api/whatsapp/webhook`
- Each user has their own Evolution API instance identified by `instanceId` stored in `UserSettings`
- QR code pairing and pairing code flows are both supported
- Incoming message webhook handler is at `src/app/api/whatsapp/webhook/route.ts` (~281 lines)

---

## AI Features

- Provider: OpenAI (default model: `gpt-4o-mini`)
- Client wrapper: `src/lib/ai.ts`
- Transcription key stored per user in `UserSettings.openaiTranscriptionKey`
- Features: conversation summarization, auto-reply generation, audio transcription
- AI model and API key are user-configurable via settings

---

## Cron & Automation

| Trigger | Schedule | Endpoint |
|---|---|---|
| Vercel cron | Daily at 2 AM UTC | `POST /api/cron` |
| GitHub Actions | Every 2 hours | `POST /api/cron` |

The cron endpoint requires `Authorization: Bearer <CRON_SECRET>` header.

Follow-up processing: `POST /api/followup/process` — handles scheduled lead follow-ups.

---

## File & Import Conventions

- **Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`)
- **Always use** `@/` imports instead of relative paths across module boundaries
- **ESLint** enforces import ordering via a custom plugin in `eslint-plugins/`
- Component files use PascalCase: `LeadCard.tsx`, `Button.tsx`
- Utility/lib files use kebab-case or camelCase: `lead-utils.ts`, `auth.ts`
- Feature modules follow the pattern: `src/features/<domain>/`

---

## Component Architecture

- **`src/components/ui/`** — Fully generic, reusable components (no business logic)
- **`src/components/domain/`** — Domain-aware components (know about leads, conversations, etc.)
- **`src/components/forms/`** — Form field wrappers with consistent styling
- **`src/components/layout/`** — App shell components (Sidebar, Topbar)
- **`src/features/<domain>/`** — Business logic, hooks, and server actions per feature

Keep UI components pure. Move business logic into `features/` modules.

---

## Deployment (Vercel)

- `vercel.json` defines the cron schedule
- Build command: `prisma generate && next build`
- Required env vars must be set in Vercel project settings
- Uses `@prisma/adapter-pg` for connection pooling (important for serverless)
- `DIRECT_URL` is used by Prisma for migrations; `DATABASE_URL` uses the pooler

---

## Known Patterns & Gotchas

1. **Prisma singleton:** Always import `db` from `@/lib/db` — never instantiate `PrismaClient` directly
2. **Tenant isolation:** Never forget to scope queries by `tenantId`; data leaks between tenants are a critical bug
3. **Evolution API instances:** Each user creates their own WhatsApp instance; instance names follow the pattern `lf-<uuid>`
4. **Cookies in API routes:** Use `cookies-next` or Next.js `cookies()` — not raw `document.cookie`
5. **Build step:** `prisma generate` must run before `next build`; this is handled in the build script
6. **No test framework:** There are no unit or integration tests in this repo currently
7. **Facebook webhooks:** Require `FACEBOOK_APP_SECRET` for signature verification and `FACEBOOK_VERIFY_TOKEN` for handshake
