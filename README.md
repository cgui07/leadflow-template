This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Evolution API v2

The project is configured to work with Evolution API `v2.3.7` through [evolution-docker-compose.yml](./evolution-docker-compose.yml).

Use the local stack:

```bash
docker compose -f evolution-docker-compose.yml up -d
```

Required application env:

```env
EVOLUTION_API_URL="http://localhost:8080"
```

Webhook configuration on the Evolution instance:

- URL: `http://YOUR_APP_HOST/api/whatsapp/webhook`
- Events: `MESSAGES_UPSERT`

Message routing notes:

- Incoming messages may arrive with `key.remoteJid` as `@lid`.
- On Evolution API v2, when `key.remoteJidAlt` is available, the app uses it as the preferred reply JID.
- Outbound messages are still sent through `/message/sendText/{instance}` using the phone number in the `number` field, which is the expected v2 format.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
