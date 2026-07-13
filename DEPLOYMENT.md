# GIS Konsult Knowledge Hub Deployment

## Vercel frontend

- Root Directory: `apps/web`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`

`apps/web/vercel.json` already includes the SPA rewrite, so refreshing `/login`, `/dashboard`, `/courses`, and other React routes should return `index.html` instead of a 404.

## Render backend

Recommended service type: Web Service.

- Root Directory: repository root
- Runtime: Node
- Node version: `22`
- Build Command: `npm install && npm --workspace apps/api run prisma:generate && npm --workspace apps/api run prisma:migrate:deploy && npm --workspace apps/api run build`
- Start Command: `npm --workspace apps/api run start`
- Health Check Path: `/api/health`

If Render is configured with `apps/api` as the root directory instead, use:

- Build Command: `npm install && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

## Render environment variables

Set these in Render. Do not commit real secrets to GitHub.

```env
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=1d
PORT=4000
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGINS=https://your-vercel-app.vercel.app
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=noreply@your-domain.com
BREVO_SENDER_NAME=GIS Konsult Knowledge Hub
UPLOAD_PROVIDER=cloudinary
```

For production course materials, use one persistent upload provider:

- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Supabase Storage: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET`
- S3: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, optional `AWS_S3_PUBLIC_URL`

Avoid `UPLOAD_PROVIDER=local` on Render for important course files because local Render disk storage is not a reliable long-term file store unless you have configured persistent disks.

## Production checklist

- Add the deployed Vercel URL to Render `FRONTEND_URL` and `CORS_ORIGINS`.
- Add the deployed Render URL to Vercel `VITE_API_BASE_URL`, ending with `/api`.
- Keep Neon `DATABASE_URL` and `DIRECT_DATABASE_URL` in Render only.
- Run Prisma migrations during Render build with `prisma:migrate:deploy`.
- Confirm `/api/health` returns `{"status":"ok"}` after deploy.
- Test login, trainer registration approval, course material upload, learner enrollment, lesson discussion, live session external link, and certificate verification.
