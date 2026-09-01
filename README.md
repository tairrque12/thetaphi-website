# Theta Phi Website

Mobile-first digital chapter platform for the Theta Phi Chapter of Kappa Alpha Psi Fraternity, Inc.

- [Product blueprint](docs/product-blueprint.md)
- [Security policy and required branch rules](SECURITY.md)

## Local development

The application uses Next.js, TypeScript, Supabase, and Vitest.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and supply the project values before connecting to hosted Supabase or Resend.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Database tests require Docker:

```bash
npm run supabase:start
npm run supabase:test
```
