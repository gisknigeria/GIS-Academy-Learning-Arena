# GIS Academy Learning Arena - Technical Architecture

## Frontend

Use React as a real multi-page application structure:

- `apps/web/src/layouts` for shared page shells.
- `apps/web/src/pages` for dashboard, learning, arena, classes, assessments, certificates, and reports.
- `apps/web/src/components` for reusable UI blocks.
- `apps/web/src/data` for temporary mock data before API integration.
- `apps/web/src/types` for shared frontend types.

The current app uses real browser routes through React Router:

- `/dashboard`
- `/learn`
- `/arena`
- `/classes`
- `/assessments`
- `/certificates`
- `/reports`

## Backend Recommendation

Use **NestJS + Node.js + PostgreSQL + Prisma**.

Reason:

- The platform is large and role-heavy.
- NestJS gives clear modules, controllers, services, guards, and decorators.
- It is better for permissions, assessments, competition logic, certificates, notifications, and analytics.
- Prisma gives a clean database schema and migration flow.

Plain Express is fine for small APIs, but this product is not small. NestJS will keep the backend more organized as we add LMS modules, live competition modes, Olympiad ranking, certificates, and reporting.

## Suggested Backend Modules

- Auth
- Users and Roles
- Schools and Organizations
- Courses and Packages
- Curriculum
- Lessons and Resources
- Classes and Attendance
- Assignments
- Assessments
- Competition Arena
- Olympiad
- Leaderboards and Achievements
- Certificates
- Notifications
- Reports and Analytics
- Admin Settings

The backend lives in `apps/api`. It currently exposes:

- `GET /api/health`
- `GET /api/platform/modules`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`

## Local Database Setup

Create `apps/api/.env` from `apps/api/.env.example`, then set `DATABASE_URL` to a local or hosted PostgreSQL database.

Useful commands:

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run dev:api`

## Business Configuration

- Registration: public/free registration is allowed.
- Access control: paid courses should block lesson access until payment status is `PAID` or `NOT_REQUIRED`.
- Payment provider: Paystack.
- Recommended starter email provider: Brevo free plan for SMTP/API transactional email, then move to a paid plan when volume grows.
- Alternate developer-friendly email provider: Resend.

Email environment variables:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

Do not commit real provider keys. If an API key is ever shared in chat or screenshots, rotate it before production.

## Data Layer

Use PostgreSQL as the main database. Use Prisma migrations for schema changes.

Use object storage later for videos, datasets, submissions, certificates, and generated share cards.
