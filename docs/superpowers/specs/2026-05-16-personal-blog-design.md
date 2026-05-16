# Personal Blog Design Spec

## Overview

Single-user personal blog with Markdown editing, comment moderation, visitor tracking (IP + geo), and a refined editorial-style UI. Built with Next.js, deployed on Vercel.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon / Vercel Postgres) |
| ORM | Prisma |
| Auth | Single-admin, `iron-session` sealed cookie |
| Markdown | `react-markdown` + `remark-gfm` |
| IP Geo | Free IP geo database (e.g., `@ip-location-db/geoip`) |
| Deployment | Vercel |

## Data Model

### Post

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | string | |
| slug | string | Unique, URL-friendly |
| content | text | Raw Markdown |
| excerpt | string? | Optional summary |
| coverImage | string? | Optional cover URL |
| published | boolean | false = draft |
| publishedAt | datetime? | |
| viewCount | int | Default 0 |
| createdAt | datetime | |
| updatedAt | datetime | |

### Comment

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| postId | uuid | FK → Post |
| nickname | string | User-chosen display name |
| email | string | Not shown publicly |
| content | text | |
| approved | boolean | Default false |
| ip | string | Commenter IP |
| createdAt | datetime | |

### Like

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| postId | uuid | FK → Post |
| ip | string | For dedup |
| createdAt | datetime | |

### VisitLog

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| postId | uuid? | Null for homepage |
| ip | string | |
| userAgent | string | |
| referer | string? | |
| geo | json? | Country/city from IP lookup |
| createdAt | datetime | |

## Routes

### Public

| Route | Purpose |
|-------|---------|
| `/` | Homepage — paginated published posts |
| `/posts/[slug]` | Article detail — rendered Markdown, like button, comments |
| `/login` | Admin login form |

### Admin (auth-protected)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — stats overview |
| `/admin/posts` | Post list (drafts + published) |
| `/admin/posts/new` | New post editor (Markdown + preview) |
| `/admin/posts/[id]/edit` | Edit post |
| `/admin/comments` | Comment moderation (approve/reject) |
| `/admin/visitors` | Visitor logs (IP, geo, page, time) |
| `/admin/settings` | Change password, blog name |

### API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/posts` | GET | Published posts (public) |
| `/api/posts/[slug]` | GET | Single post (public) |
| `/api/admin/posts` | GET/POST | Admin: list / create |
| `/api/admin/posts/[id]` | PUT/DELETE | Admin: update / delete |
| `/api/posts/[slug]/comments` | GET/POST | Public: list / submit comment |
| `/api/admin/comments` | GET | Admin: list all |
| `/api/admin/comments/[id]` | PUT | Admin: approve/reject |
| `/api/posts/[slug]/like` | POST | Like a post (IP-deduped) |
| `/api/posts/[slug]/view` | POST | Record a view |
| `/api/admin/visitors` | GET | Admin: visitor log |

## Rendering Strategy

- **Homepage & article pages**: ISR with `revalidate: 60`, on-demand revalidation on publish/update
- **Admin pages**: Dynamic (SSR), always fresh
- **API routes**: Standard route handlers

## Auth Design

- Credentials in env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`
- Login validates against env vars, creates `iron-session` cookie
- Middleware guards `/admin/*` routes and `/api/admin/*` routes
- Failed login: show error inline on the login card, no redirect

## Comment Flow

1. Visitor submits comment → stored with `approved: false`
2. Admin dashboard shows pending count badge
3. Admin reviews and clicks Approve or Reject
4. Approved comments appear on article page
5. Rejected comments are soft-deleted or flagged

## Visitor Tracking

1. Article page load triggers `POST /api/posts/[slug]/view`
2. Server reads IP from `x-forwarded-for` (Vercel header)
3. IP geo lookup returns country + city
4. Row inserted into VisitLog
5. Post `viewCount` incremented

## Security

### Credential & Session

- Admin password hashed with **bcrypt** (stored in env var `ADMIN_PASSWORD_HASH`), never in database
- `iron-session` cookie: `httpOnly`, `sameSite: "lax"`, `secure` (prod), strong 32-char+ seal password
- Session expires after 7 days of inactivity

### Rate Limiting

| Endpoint | Limit | Rationale |
|----------|-------|-----------|
| `POST /api/auth/login` | 5 req / min / IP | Brute force prevention |
| `POST /api/posts/[slug]/comments` | 3 req / min / IP | Spam prevention |
| `POST /api/posts/[slug]/like` | 10 req / min / IP | Abuse prevention |
| `POST /api/posts/[slug]/view` | 30 req / min / IP | View count manipulation |
| All API routes | 100 req / min / IP | General DoS mitigation |

Implementation: `@upstash/ratelimit` (backed by Vercel KV) or as fallback, in-memory `Map` with TTL (works within a single Vercel instance for a low-traffic blog).

### XSS Prevention

- **Comment content**: Strip all HTML tags server-side before storing. Plain text only.
- **Nickname**: Strip HTML tags, max 50 chars.
- **Email**: Validate format, never render as HTML or mailto link on page (admin only views it).
- **Markdown rendering**: `react-markdown` by default does not render raw HTML. Additionally use `rehype-sanitize` to strip any HTML that slips through.
- **Admin post editor**: Admin content trusted, but still rendered through `react-markdown` (no raw HTML execution).

### CSRF

- Next.js Server Actions have built-in CSRF protection via request header checks.
- API routes used for public endpoints (comments, likes, views) are read-only from the user's perspective — they don't mutate admin state. The `sameSite: "lax"` cookie setting plus proper CORS headers suffice.

### Input Validation (Zod)

All user-facing inputs validated with Zod schemas:

- **Login**: username 1-50 chars, password 8-100 chars
- **Comment**: nickname 1-50 chars (no HTML), email valid format, content 1-2000 chars (plain text)
- **Like**: postId valid UUID
- **View**: postId valid UUID (or null for homepage)
- **Post slug**: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, max 100 chars
- **Post create/edit**: title 1-200 chars, content 1-100000 chars (admin only, server-side validation)

### SQL Injection

Prisma ORM uses parameterized queries exclusively. No raw SQL. Safe by default.

### HTTP Security Headers

Set in `next.config.ts` headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Environment & Secrets

- `.env` in `.gitignore` — never committed
- `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` never exposed to client (no `NEXT_PUBLIC_` prefix)
- Neon DB connection string in env var only, with IP allowlist on Neon side
- Vercel env vars set via dashboard for production

### Dependency Security

- `npm audit` as pre-commit check
- Dependabot enabled on GitHub for automatic updates

## UI Design

- **Aesthetic**: Editorial + modern minimal. Warm white base (#fafaf8), serif headings (Georgia), amber accent (#c77d2c), subtle grain texture
- **Layout**: Centered narrow column (max 720px), responsive
- **Cards**: White surface, soft border, subtle hover lift
- **Admin**: Left sidebar nav, stats grid, data tables, Markdown split editor
- **Mobile**: Single column, collapsed nav, touch-friendly spacing

## Non-Goals

- Multi-user support
- Rich text / WYSIWYG editor
- RSS feed (can add later)
- Image upload / media library (can add later)
- Search (can add later)
- Dark mode (can add later)
