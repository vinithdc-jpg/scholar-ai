This is a [Next.js](https://nextjs.org) project with Firebase Authentication.

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for implemented API routes and the
planned endpoint inventory.

## Firebase Authentication

The sign-in page supports email/password registration and sign-in, Google sign-in, and sign-out. Set the following Firebase Web App configuration values in `.env.local`:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

In the Firebase Console, enable **Email/Password** and **Google** under **Authentication → Sign-in method**, and add your local/deployed hostnames under **Authentication → Settings → Authorized domains**.

## User profile persistence

After Firebase sign-in or registration, the app verifies the Firebase ID token on the server and inserts or updates the user's `firebase_uid`, `full_name`, and `email` in PostgreSQL. Email/password registration also saves the name in the Firebase profile; Google sign-in uses the name provided by Google.

Passwords are managed by Firebase Authentication and are intentionally not stored in PostgreSQL. Do not add a plaintext password column to the users table.

1. Create a PostgreSQL database and set `DATABASE_URL` in `.env.local`.
2. Keep the Firebase service-account JSON at `private/firebase-service-account.json` for local development. This backend-only file is ignored by Git. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./private/firebase-service-account.json` in `.env.local`.
3. For Vercel, set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete service-account JSON as a server-only environment variable. Do not use a `NEXT_PUBLIC_` prefix. This variable can also be used in environments where a credential file is unsuitable.
4. As an alternative, set `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY`. Escaped newlines (`\n`) in the private key are converted automatically. Never expose these variables to the browser.
5. Run `npm run db:migrate` to create/upgrade the schema and enable the pgvector extension. Run `npm run db:verify` to check the connection, migration tracking, and pgvector extension.

Firebase Admin reads credentials from `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH`, validates the required fields, and initializes one named Admin app for reuse. The `/api/users/me` endpoint verifies ID tokens before persisting a profile. Missing, invalid, and expired tokens are rejected with HTTP 401; missing server credentials produce HTTP 500.

The browser obtains tokens with Firebase `user.getIdToken()`, which refreshes expired tokens automatically, and sends them in the `Authorization: Bearer <token>` header.

## Roles and admin access

Roles are stored in PostgreSQL and are never accepted from browser input.
Protected API routes verify Firebase ID tokens and read the user's current
database role; scholarship and document mutations require the `content_admin`
role. Content admins can add and revoke other admin accounts in the Admin
workspace. For safety, admins cannot revoke their own access or remove the
last remaining admin.

Run `npm run db:migrate` to update existing installations. The migration converts existing `super_admin` accounts to `content_admin` and removes the `super_admin` role from the database constraint.

## Database and environment setup

The server validates `DATABASE_URL` during startup and before opening a PostgreSQL connection. Copy `.env.example` to `.env.local`, configure `DATABASE_URL` and the existing Firebase client/Admin settings, then apply migrations. Secret-bearing values must remain server-only.

The initial migration creates the application tables and enables `vector`. The embedding model and vector dimensions have not been selected yet, so `document_chunks.embedding` is dimension-flexible and its ANN index is intentionally deferred until the embedding provider is selected; this avoids locking the schema to an unsupported dimension.

The application currently uses the root `app/` App Router structure. Feature-specific folders will be added as each implementation phase needs them rather than scaffolding empty directories.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
