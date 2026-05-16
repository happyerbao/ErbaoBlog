# Personal Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user personal blog with Markdown editing, comment moderation, visitor tracking (IP + geo), and a refined editorial-style UI.

**Architecture:** Next.js 15 App Router with Prisma ORM on Neon PostgreSQL. Public pages use ISR; admin pages are dynamic SSR. Auth via `iron-session` sealed cookie. API routes handle comments, likes, and view tracking. Rate limiting on all mutation endpoints.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma, PostgreSQL (Neon), iron-session, react-markdown, Zod, bcryptjs, @ip-location-db/geoip

---

## File Structure

```
ErbaoBlog/
├── .gitignore
├── .env.example
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma
├── src/
│   ├── middleware.ts              # Auth guard for /admin/* and /api/admin/*
│   ├── app/
│   │   ├── layout.tsx             # Root layout: fonts, metadata, grain texture
│   │   ├── globals.css            # Tailwind + custom editorial styles
│   │   ├── page.tsx               # Homepage — paginated post list (ISR)
│   │   ├── login/
│   │   │   └── page.tsx           # Admin login page
│   │   ├── posts/[slug]/
│   │   │   └── page.tsx           # Article detail (ISR)
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Admin layout with sidebar
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx       # Post list
│   │   │   │   ├── new/page.tsx   # New post editor
│   │   │   │   └── [id]/edit/page.tsx  # Edit post
│   │   │   ├── comments/page.tsx  # Comment moderation
│   │   │   ├── visitors/page.tsx  # Visitor log
│   │   │   └── settings/page.tsx  # Settings
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── posts/route.ts          # GET published posts
│   │       ├── posts/[slug]/route.ts   # GET single post
│   │       ├── posts/[slug]/comments/route.ts  # GET/POST comments
│   │       ├── posts/[slug]/like/route.ts      # POST like
│   │       ├── posts/[slug]/view/route.ts      # POST view
│   │       └── admin/
│   │           ├── posts/route.ts         # GET all, POST create
│   │           ├── posts/[id]/route.ts    # PUT, DELETE
│   │           ├── comments/route.ts      # GET all
│   │           ├── comments/[id]/route.ts # PUT approve/reject
│   │           └── visitors/route.ts      # GET
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # iron-session config + helpers
│   │   ├── validators.ts          # Zod schemas
│   │   ├── rate-limit.ts          # In-memory rate limiter
│   │   ├── ip-geo.ts              # IP geo lookup
│   │   └── sanitize.ts            # HTML strip helper
│   └── components/
│       ├── header.tsx             # Public nav
│       ├── footer.tsx             # Public footer
│       ├── article-card.tsx       # Homepage article card
│       ├── pagination.tsx         # Pagination
│       ├── comment-form.tsx       # Comment form (client)
│       ├── comment-list.tsx       # Comment list
│       ├── like-button.tsx        # Like button (client)
│       ├── admin-sidebar.tsx      # Admin sidebar nav
│       ├── stats-card.tsx         # Dashboard stat card
│       ├── markdown-editor.tsx    # Editor + preview (client)
│       └── login-form.tsx         # Login form (client)
│       ├── delete-post-button.tsx  # Delete post button (client)
│       └── comment-actions.tsx     # Comment approve/delete buttons (client)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.gitignore`, `.env.example`, `postcss.config.mjs`

- [ ] **Step 1: Initialize project with package.json**

```json
{
  "name": "erbao-blog",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "prisma": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "iron-session": "^8.0.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-sanitize": "^6.0.0",
    "zod": "^3.23.0",
    "bcryptjs": "^2.4.3",
    "@ip-location-db/geoip": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#fafaf8",
        surface: "#ffffff",
        border: "#e8e6e1",
        "border-hover": "#d4d0c8",
        text: "#1a1a1a",
        "text-secondary": "#6b6560",
        "text-muted": "#9c958d",
        accent: "#c77d2c",
        "accent-soft": "#fdf6ed",
      },
      fontFamily: {
        serif: ["Georgia", "Noto Serif SC", "STSong", "serif"],
        sans: ["Inter", "SF Pro Text", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Cascadia Code", "monospace"],
      },
      maxWidth: {
        content: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Create postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.next/
.env
.env.local
.env*.local
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 7: Create .env.example**

```
DATABASE_URL="postgresql://user:password@host/dbname"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="<bcrypt hash>"
SESSION_SECRET="<random 32+ char string>"
```

- [ ] **Step 8: Install dependencies and verify build**

Run: `npm install`
Run: `npx next build`
Expected: Build succeeds (empty pages are fine).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs .gitignore .env.example
git commit -m "chore: scaffold Next.js project with Tailwind and dependencies"
```

---

### Task 2: Prisma Schema & Database Setup

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Create Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id          String    @id @default(uuid())
  title       String
  slug        String    @unique
  content     String    @db.Text
  excerpt     String?
  coverImage  String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  viewCount   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  comments    Comment[]
  likes       Like[]
  visitLogs   VisitLog[]
}

model Comment {
  id        String   @id @default(uuid())
  postId    String
  nickname  String
  email     String
  content   String   @db.Text
  approved  Boolean  @default(false)
  ip        String
  createdAt DateTime @default(now())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
}

model Like {
  id        String   @id @default(uuid())
  postId    String
  ip        String
  createdAt DateTime @default(now())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, ip])
}

model VisitLog {
  id        String   @id @default(uuid())
  postId    String?
  ip        String
  userAgent String
  referer   String?
  geo       Json?
  createdAt DateTime @default(now())
  post      Post?    @relation(fields: [postId], references: [id], onDelete: SetNull)
}
```

- [ ] **Step 2: Generate Prisma client and push schema**

Run: `npx prisma generate`
Expected: Client generated without errors.

Run: `npx prisma db push`
Expected: Schema pushed to database.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Prisma schema with Post, Comment, Like, VisitLog models"
```

---

### Task 3: Core Libraries

**Files:**
- Create: `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/validators.ts`, `src/lib/rate-limit.ts`, `src/lib/ip-geo.ts`, `src/lib/sanitize.ts`

- [ ] **Step 1: Create Prisma client singleton — `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Create auth helpers — `src/lib/auth.ts`**

```typescript
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "a-very-long-secret-at-least-32-chars-for-dev",
  cookieName: "erbao-blog-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}
```

- [ ] **Step 3: Create Zod validators — `src/lib/validators.ts`**

```typescript
import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(8).max(100),
});

export const commentSchema = z.object({
  nickname: z.string().min(1).max(50),
  email: z.string().email().max(200),
  content: z.string().min(1).max(2000),
});

export const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens"),
  content: z.string().min(1).max(100000),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().max(500).optional().or(z.literal("")),
  published: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type PostInput = z.infer<typeof postSchema>;
```

- [ ] **Step 4: Create rate limiter — `src/lib/rate-limit.ts`**

```typescript
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}

// Periodically clean up expired entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(key);
    }
  }, 5 * 60 * 1000);
}
```

- [ ] **Step 5: Create IP geo lookup — `src/lib/ip-geo.ts`**

```typescript
export interface GeoInfo {
  country: string;
  city: string;
}

const geoCache = new Map<string, GeoInfo | null>();

export async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return null; // local/private IP
  }

  const cached = geoCache.get(ip);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
    const data = await response.json();
    if (data.status === "fail") {
      geoCache.set(ip, null);
      return null;
    }
    const result: GeoInfo = { country: data.country, city: data.city };
    geoCache.set(ip, result);
    return result;
  } catch {
    geoCache.set(ip, null);
    return null;
  }
}
```

- [ ] **Step 6: Create HTML sanitizer — `src/lib/sanitize.ts`**

```typescript
export function stripHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/
git commit -m "feat: add core libraries — prisma, auth, validators, rate-limit, ip-geo, sanitize"
```

---

### Task 4: Auth System (Login API + Middleware)

**Files:**
- Create: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/middleware.ts`

- [ ] **Step 1: Create login API route — `src/app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`login:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "输入格式不正确" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (username !== expectedUsername || !bcrypt.compareSync(password, expectedHash || "")) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create logout API route — `src/app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create middleware — `src/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

Note: The `middleware.ts` uses `getIronSession` directly (not the `getSession` helper) because middleware runs on the Edge runtime and needs the request/response pair.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/ src/middleware.ts
git commit -m "feat: add auth system — login/logout API, middleware guard for /admin routes"
```

---

### Task 5: Public API Routes (Posts, Comments, Likes, Views)

**Files:**
- Create: `src/app/api/posts/route.ts`, `src/app/api/posts/[slug]/route.ts`, `src/app/api/posts/[slug]/comments/route.ts`, `src/app/api/posts/[slug]/like/route.ts`, `src/app/api/posts/[slug]/view/route.ts`

- [ ] **Step 1: Create GET published posts — `src/app/api/posts/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = 10;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        viewCount: true,
        _count: { select: { likes: true, comments: { where: { approved: true } } } },
      },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);

  return NextResponse.json({
    posts,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}
```

- [ ] **Step 2: Create GET single post — `src/app/api/posts/[slug]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      viewCount: true,
      _count: { select: { likes: true, comments: { where: { approved: true } } } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json(post);
}
```

- [ ] **Step 3: Create GET/POST comments — `src/app/api/posts/[slug]/comments/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validators";
import { stripHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { postId: post.id, approved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, nickname: true, content: true, createdAt: true },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`comment:${ip}`, 3, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "评论过于频繁，请稍后再试" }, { status: 429 });
  }

  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "输入格式不正确" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      nickname: stripHtml(parsed.data.nickname),
      email: parsed.data.email,
      content: stripHtml(parsed.data.content),
      approved: false,
      ip,
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, id: comment.id, message: "评论已提交，审核通过后显示" });
}
```

- [ ] **Step 4: Create POST like — `src/app/api/posts/[slug]/like/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`like:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "操作过于频繁" }, { status: 429 });
  }

  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  try {
    await prisma.like.create({
      data: { postId: post.id, ip },
    });
    const count = await prisma.like.count({ where: { postId: post.id } });
    return NextResponse.json({ liked: true, count });
  } catch {
    // Unique constraint violation (already liked) — unlike
    await prisma.like.deleteMany({
      where: { postId: post.id, ip },
    });
    const count = await prisma.like.count({ where: { postId: post.id } });
    return NextResponse.json({ liked: false, count });
  }
}
```

- [ ] **Step 5: Create POST view — `src/app/api/posts/[slug]/view/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupGeo } from "@/lib/ip-geo";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`view:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ success: true }); // silently accept
  }

  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "文章不存在" }, { status: 404 });

  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || null;
  const geo = await lookupGeo(ip);

  await Promise.all([
    prisma.visitLog.create({
      data: { postId: post.id, ip, userAgent, referer, geo: geo ? (geo as any) : undefined },
    }),
    prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/posts/
git commit -m "feat: add public API routes — posts list/detail, comments, likes, views"
```

---

### Task 6: Admin API Routes

**Files:**
- Create: `src/app/api/admin/posts/route.ts`, `src/app/api/admin/posts/[id]/route.ts`, `src/app/api/admin/comments/route.ts`, `src/app/api/admin/comments/[id]/route.ts`, `src/app/api/admin/visitors/route.ts`

- [ ] **Step 1: Create admin posts list/create — `src/app/api/admin/posts/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validators";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, slug: true, published: true,
      publishedAt: true, viewCount: true, createdAt: true,
    },
  });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "输入格式不正确", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug 已被使用" }, { status: 409 });
  }

  const post = await prisma.post.create({
    data: {
      ...parsed.data,
      excerpt: parsed.data.excerpt || null,
      coverImage: parsed.data.coverImage || null,
      publishedAt: parsed.data.published ? new Date() : null,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(post, { status: 201 });
}
```

- [ ] **Step 2: Create admin post get/update/delete — `src/app/api/admin/posts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      coverImage: true,
      published: true,
      publishedAt: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "输入格式不正确", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.post.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (existing) {
    return NextResponse.json({ error: "Slug 已被使用" }, { status: 409 });
  }

  const current = await prisma.post.findUnique({ where: { id } });
  const post = await prisma.post.update({
    where: { id },
    data: {
      ...parsed.data,
      excerpt: parsed.data.excerpt || null,
      coverImage: parsed.data.coverImage || null,
      publishedAt: parsed.data.published
        ? (current?.published ? undefined : new Date())
        : null,
    },
    select: { id: true },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create admin comments list — `src/app/api/admin/comments/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "pending";
  const where = status === "all" ? {} :
    status === "approved" ? { approved: true } :
    status === "rejected" ? { approved: false } : // soft-rejected
    { approved: false }; // pending

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json(comments);
}
```

- [ ] **Step 4: Create admin comment approve/reject — `src/app/api/admin/comments/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { approved } = body;

  if (typeof approved !== "boolean") {
    return NextResponse.json({ error: "approved must be boolean" }, { status: 400 });
  }

  await prisma.comment.update({
    where: { id },
    data: { approved },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Create admin visitors log — `src/app/api/admin/visitors/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = 50;

  const [logs, total] = await Promise.all([
    prisma.visitLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        post: { select: { title: true, slug: true } },
      },
    }),
    prisma.visitLog.count(),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: add admin API routes — posts CRUD, comments approve/reject, visitors log"
```

---

### Task 7: UI Components

**Files:**
- Create: `src/components/header.tsx`, `src/components/footer.tsx`, `src/components/article-card.tsx`, `src/components/pagination.tsx`, `src/components/comment-form.tsx`, `src/components/comment-list.tsx`, `src/components/like-button.tsx`, `src/components/admin-sidebar.tsx`, `src/components/stats-card.tsx`, `src/components/markdown-editor.tsx`, `src/components/login-form.tsx`

- [ ] **Step 1: Create header — `src/components/header.tsx`**

```tsx
import Link from "next/link";

export function Header() {
  return (
    <nav className="flex items-center justify-between py-5 border-b border-border mb-12 max-w-content mx-auto px-4">
      <Link href="/" className="font-serif text-xl font-bold tracking-tight text-text no-underline">
        Erbao<span className="text-accent">.</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/" className="text-sm font-medium text-text-secondary hover:text-text transition-colors hidden sm:inline">
          归档
        </Link>
        <Link href="/" className="text-sm font-medium text-text-secondary hover:text-text transition-colors hidden sm:inline">
          关于
        </Link>
        <Link href="/login" className="text-sm font-medium px-3.5 py-1.5 border border-border rounded-md text-text-secondary hover:text-text hover:border-border-hover hover:bg-surface transition-all">
          登录
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create footer — `src/components/footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-16 text-center max-w-content mx-auto px-4">
      <p className="text-sm text-text-muted tracking-wide">
        Erbao<span className="text-accent">.</span> &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Powered by Next.js
      </p>
    </footer>
  );
}
```

- [ ] **Step 3: Create article card — `src/components/article-card.tsx`**

```tsx
import Link from "next/link";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFirst?: boolean;
}

function StatIcon({ children }: { children: React.ReactNode }) {
  return <span className="opacity-50 w-3.5 h-3.5 inline-flex items-center">{children}</span>;
}

export function ArticleCard({ slug, title, excerpt, publishedAt, viewCount, likeCount, commentCount, isFirst }: ArticleCardProps) {
  const date = publishedAt ? new Date(publishedAt).toISOString().slice(0, 10) : "";

  return (
    <Link
      href={`/posts/${slug}`}
      className={`block bg-surface border border-border rounded-xl p-7 mb-3 shadow-sm hover:border-border-hover hover:shadow-md hover:-translate-y-px transition-all duration-200 no-underline text-inherit ${isFirst ? "border-l-[3px] border-l-accent pl-[25px]" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs text-text-muted font-mono tracking-wide">{date}</span>
        {isFirst && <span className="text-[11px] text-accent bg-accent-soft px-2 py-0.5 rounded-full font-semibold tracking-wider">最新</span>}
      </div>
      <h3 className="font-serif text-[22px] font-bold leading-snug mb-2 text-text group-hover:text-accent">{title}</h3>
      {excerpt && (
        <p className="text-[15px] text-text-secondary leading-relaxed mb-3.5 line-clamp-2">{excerpt}</p>
      )}
      <div className="flex items-center gap-4 text-[13px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <StatIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></StatIcon>
          {viewCount.toLocaleString()} 阅读
        </span>
        <span className="inline-flex items-center gap-1">
          <StatIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg></StatIcon>
          {likeCount} 赞
        </span>
        <span className="inline-flex items-center gap-1">
          <StatIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></StatIcon>
          {commentCount} 评论
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Create pagination — `src/components/pagination.tsx`**

```tsx
import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 mt-10 mb-12">
      {page > 1 ? (
        <Link href={`/?page=${page - 1}`} className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text transition-all no-underline">←</Link>
      ) : (
        <span className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md text-sm font-medium opacity-30">←</span>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={`/?page=${p}`}
          className={`inline-flex items-center justify-center min-w-9 h-9 px-2.5 border rounded-md text-sm font-medium transition-all no-underline ${
            p === page
              ? "bg-text text-white border-text"
              : "bg-surface text-text-secondary border-border hover:border-border-hover hover:text-text"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={`/?page=${page + 1}`} className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text transition-all no-underline">→</Link>
      ) : (
        <span className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md text-sm font-medium opacity-30">→</span>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create like button — `src/components/like-button.tsx`**

```tsx
"use client";

import { useState } from "react";

interface LikeButtonProps {
  slug: string;
  initialCount: number;
}

export function LikeButton({ slug, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${slug}/like`, { method: "POST" });
      const data = await res.json();
      setCount(data.count);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text transition-all disabled:opacity-50"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      </svg>
      点赞 ({count})
    </button>
  );
}
```

- [ ] **Step 6: Create comment form — `src/components/comment-form.tsx`**

```tsx
"use client";

import { useState, FormEvent } from "react";

interface CommentFormProps {
  slug: string;
  onSuccess: () => void;
}

export function CommentForm({ slug, onSuccess }: CommentFormProps) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, email, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "评论已提交，审核通过后显示");
        setNickname("");
        setEmail("");
        setContent("");
        onSuccess();
      } else {
        setMessage(data.error || "提交失败");
      }
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 pt-5 border-t border-border">
      <h4 className="font-semibold text-text mb-3">发表评论</h4>
      {message && <p className={`text-sm mb-3 ${message.includes("失败") || message.includes("错误") ? "text-red-600" : "text-green-700"}`}>{message}</p>}
      <input
        type="text" placeholder="你的昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={50}
        className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm mb-2.5 outline-none focus:border-border-hover font-sans"
      />
      <input
        type="email" placeholder="你的邮箱（不公开）" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200}
        className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm mb-2.5 outline-none focus:border-border-hover font-sans"
      />
      <textarea
        placeholder="写下你的想法..." value={content} onChange={(e) => setContent(e.target.value)} required maxLength={2000} rows={3}
        className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm outline-none focus:border-border-hover resize-y font-sans"
      />
      <button
        type="submit" disabled={submitting}
        className="mt-2.5 px-5 py-2 bg-text text-white rounded-md text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {submitting ? "提交中..." : "提交评论"}
      </button>
      <p className="text-xs text-text-muted mt-2">评论需经管理员审核后显示</p>
    </form>
  );
}
```

- [ ] **Step 7: Create comment list — `src/components/comment-list.tsx`**

```tsx
interface Comment {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="border-t-2 border-border pt-6 mt-8">
        <h4 className="font-semibold text-text mb-4">评论</h4>
        <p className="text-text-muted text-sm">还没有评论，来抢个沙发吧。</p>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-border pt-6 mt-8">
      <h4 className="font-semibold text-text mb-4">评论 ({comments.length})</h4>
      {comments.map((c) => (
        <div key={c.id} className="mb-4 pb-4 border-b border-border last:border-0">
          <div className="font-semibold text-sm mb-1 text-text">
            {c.nickname} <span className="text-text-muted font-normal text-xs">· {new Date(c.createdAt).toISOString().slice(0, 10)}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{c.content}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Create admin sidebar — `src/components/admin-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "仪表盘", icon: "📊" },
  { href: "/admin/posts", label: "文章管理", icon: "📝" },
  { href: "/admin/comments", label: "评论审核", icon: "💬" },
  { href: "/admin/visitors", label: "访客记录", icon: "👁" },
  { href: "/admin/settings", label: "设置", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-surface border-r border-border p-6 flex flex-col flex-shrink-0 max-md:w-full max-md:flex-row max-md:items-center max-md:border-r-0 max-md:border-b max-md:p-3 max-md:overflow-x-auto">
      <div className="font-serif text-base font-bold mb-8 max-md:mb-0 max-md:mr-4 max-md:whitespace-nowrap">
        Erbao<span className="text-accent">.</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1 max-md:flex-row max-md:gap-0.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
              pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                ? "bg-text text-white"
                : "text-text-secondary hover:bg-bg hover:text-text"
            } max-md:text-xs max-md:px-2.5 max-md:py-1.5 max-md:whitespace-nowrap`}
          >
            <span>{link.icon}</span> {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border pt-4 text-xs text-text-muted max-md:hidden">
        <Link href="/" className="text-text-secondary no-underline hover:text-text">← 返回博客</Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 9: Create stats card — `src/components/stats-card.tsx`**

```tsx
interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatsCard({ label, value, sub, accent }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
      <div className="text-xs text-text-muted uppercase tracking-widest mb-1.5">{label}</div>
      <div className={`font-mono text-[28px] font-bold ${accent ? "text-accent" : "text-text"}`}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
```

- [ ] **Step 10: Create login form — `src/components/login-form.tsx`**

```tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">用户名</label>
        <input
          type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
          className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm outline-none focus:border-border-hover"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">密码</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm outline-none focus:border-border-hover"
        />
      </div>
      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-text text-white rounded-md text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {loading ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
```

- [ ] **Step 11: Create markdown editor — `src/components/markdown-editor.tsx`**

```tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownEditorProps {
  initialTitle?: string;
  initialSlug?: string;
  initialContent?: string;
  isPublished?: boolean;
  onSave: (data: { title: string; slug: string; content: string; published: boolean }) => Promise<void>;
  saveLabel?: string;
}

export function MarkdownEditor({
  initialTitle = "",
  initialSlug = "",
  initialContent = "",
  isPublished = false,
  onSave,
  saveLabel = "保存草稿",
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(published: boolean) {
    if (saving) return;
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError("标题、Slug、内容不能为空");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), slug: slug.trim(), content: content.trim(), published });
    } catch (e: any) {
      setError(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-[800px]">
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">{error}</div>}

      <input
        type="text" placeholder="文章标题" value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full font-serif text-2xl font-bold px-4 py-3.5 border border-border rounded-lg bg-surface outline-none focus:border-border-hover"
      />

      <input
        type="text" placeholder="slug (URL 友好标识，如 hello-world)" value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        className="w-full font-mono text-sm px-3.5 py-2.5 border border-border rounded-md bg-surface outline-none focus:border-border-hover"
      />

      <div className="flex gap-3 min-h-[360px] max-md:flex-col">
        <textarea
          placeholder="用 Markdown 书写..." value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 font-mono text-sm leading-relaxed p-5 border border-border rounded-lg bg-surface outline-none focus:border-border-hover resize-none"
        />
        <div className="flex-1 p-5 border border-border rounded-lg bg-surface overflow-y-auto">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-4">预览</div>
          <div className="prose prose-sm max-w-none font-sans text-text leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {content || "*暂无内容*"}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-5 py-2 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover transition-colors disabled:opacity-50"
        >
          {saveLabel}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-5 py-2 bg-text text-white rounded-md text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "发布"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 12: Create delete button — `src/components/delete-post-button.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("确认删除这篇文章？")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs font-medium text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
    >
      删除
    </button>
  );
}
```

- [ ] **Step 13: Commit**

```bash
git add src/components/
git commit -m "feat: add all UI components — header, footer, cards, comments, admin sidebar, editor, login"
```

---

### Task 8: Root Layout & Global Styles

**Files:**
- Create: `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: Create global styles — `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
  background-color: #fafaf8;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Subtle grain texture */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 999;
}

/* Markdown content styles */
.prose h1, .prose h2, .prose h3, .prose h4 {
  font-family: Georgia, 'Noto Serif SC', 'STSong', serif;
  font-weight: 700;
  line-height: 1.35;
  color: #1a1a1a;
}

.prose h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 0.75rem; }
.prose h3 { font-size: 1.2rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
.prose p { margin-bottom: 1rem; line-height: 1.8; }
.prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.5rem; }
.prose li { margin-bottom: 0.25rem; line-height: 1.7; }
.prose code { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 0.875em; background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 4px; }
.prose pre { background: #1a1a1a; color: #f3f4f6; padding: 1.25rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1.25rem; font-size: 0.875rem; line-height: 1.6; }
.prose pre code { background: none; padding: 0; font-size: inherit; }
.prose blockquote { border-left: 3px solid #c77d2c; padding-left: 1rem; color: #6b6560; font-style: italic; margin: 1.25rem 0; }
.prose a { color: #c77d2c; text-decoration: underline; }
.prose img { max-width: 100%; border-radius: 8px; margin: 1.25rem 0; }
.prose strong { color: #1a1a1a; font-weight: 600; }
```

- [ ] **Step 2: Create root layout — `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Erbao's Blog",
  description: "Personal blog about technology and life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="relative z-0">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add root layout with editorial global styles"
```

---

### Task 9: Public Pages (Homepage + Article Detail)

**Files:**
- Create: `src/app/page.tsx`, `src/app/posts/[slug]/page.tsx`

- [ ] **Step 1: Create homepage — `src/app/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";

export const revalidate = 60;

interface SearchParams {
  page?: string;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1"));
  const pageSize = 10;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        viewCount: true,
        _count: { select: { likes: true, comments: { where: { approved: true } } } },
      },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-4">
        <div className="mb-10">
          <h2 className="font-serif text-base font-normal text-text-muted uppercase tracking-[0.04em]">Recent Writing</h2>
        </div>
        {posts.map((post, i) => (
          <ArticleCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            publishedAt={post.publishedAt?.toISOString() || null}
            viewCount={post.viewCount}
            likeCount={post._count.likes}
            commentCount={post._count.comments}
            isFirst={i === 0}
          />
        ))}
        <Pagination page={page} totalPages={Math.ceil(total / pageSize)} />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create article detail page — `src/app/posts/[slug]/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LikeButton } from "@/components/like-button";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";

export const revalidate = 60;

interface PageParams {
  slug: string;
}

async function getComments(slug: string) {
  const post = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  if (!post) return [];
  return prisma.comment.findMany({
    where: { postId: post.id, approved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, nickname: true, content: true, createdAt: true },
  });
}

export default async function PostPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      content: true,
      publishedAt: true,
      viewCount: true,
      _count: { select: { likes: true, comments: { where: { approved: true } } } },
    },
  });

  if (!post) notFound();

  const comments = await getComments(slug);

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-4">
        <article>
          <header className="mb-8">
            <h1 className="font-serif text-[32px] font-bold leading-tight mb-3 text-text">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span>{post.publishedAt?.toISOString().slice(0, 10)}</span>
              <span>{post.viewCount.toLocaleString()} 阅读</span>
              <span>{post._count.likes} 赞</span>
              <span>{post._count.comments} 评论</span>
            </div>
          </header>
          <div className="prose max-w-none text-[16px] text-text leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {post.content}
            </ReactMarkdown>
          </div>
          <div className="flex items-center gap-2 mt-8 pt-5 border-t border-border">
            <LikeButton slug={slug} initialCount={post._count.likes} />
          </div>
        </article>
        <CommentList comments={comments} />
        <CommentForm slug={slug} onSuccess={() => {}} />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/app/posts/
git commit -m "feat: add public pages — homepage with ISR, article detail with Markdown render"
```

---

### Task 10: Login Page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create login page — `src/app/login/page.tsx`**

```tsx
import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <Link href="/" className="font-serif text-xl font-bold text-text no-underline">
            Erbao<span className="text-accent">.</span>
          </Link>
          <p className="text-sm text-text-muted mt-2">管理员登录</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/
git commit -m "feat: add login page"
```

---

### Task 11: Admin Pages

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/posts/page.tsx`, `src/app/admin/posts/new/page.tsx`, `src/app/admin/posts/[id]/edit/page.tsx`, `src/app/admin/comments/page.tsx`, `src/app/admin/visitors/page.tsx`, `src/app/admin/settings/page.tsx`

- [ ] **Step 1: Create admin layout — `src/app/admin/layout.tsx`**

```tsx
import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen max-w-[1200px] mx-auto max-md:flex-col">
      <AdminSidebar />
      <main className="flex-1 px-9 py-8 max-md:px-4 max-md:py-5">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create dashboard — `src/app/admin/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/stats-card";
import { DeletePostButton } from "@/components/delete-post-button";

export default async function AdminDashboard() {
  const [totalPosts, totalViews, pendingComments, todayVisits] = await Promise.all([
    prisma.post.count(),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.comment.count({ where: { approved: false } }),
    prisma.visitLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold">仪表盘</h1>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-9 max-md:grid-cols-2">
        <StatsCard label="文章总数" value={totalPosts} sub={`${await prisma.post.count({ where: { published: false } })} 篇草稿`} />
        <StatsCard label="总阅读量" value={(totalViews._sum.viewCount || 0).toLocaleString()} sub="全部文章" />
        <StatsCard label="待审核评论" value={pendingComments} accent />
        <StatsCard label="今日访问" value={todayVisits} />
      </div>

      {/* Recent posts table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-border">
          <h3 className="text-[15px] font-semibold">最近文章</h3>
          <a href="/admin/posts/new" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-text text-white rounded-md text-[13px] font-medium hover:bg-[#333] transition-colors no-underline">
            + 新建文章
          </a>
        </div>
        <RecentPostsTable />
      </div>
    </div>
  );
}

async function RecentPostsTable() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, slug: true, published: true, viewCount: true, publishedAt: true },
  });

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">标题</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">状态</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">阅读</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">日期</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">操作</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} className="border-b border-border last:border-0">
            <td className="px-[22px] py-3.5 text-sm font-semibold">{post.title}</td>
            <td className="px-[22px] py-3.5 text-sm">
              {post.published ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#2d8a56]">已发布</span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-text-muted">草稿</span>
              )}
            </td>
            <td className="px-[22px] py-3.5 text-sm">{post.published ? post.viewCount.toLocaleString() : "—"}</td>
            <td className="px-[22px] py-3.5 text-sm text-text-muted">{post.publishedAt?.toISOString().slice(0, 10) || "—"}</td>
            <td className="px-[22px] py-3.5 text-sm">
              <a href={`/admin/posts/${post.id}/edit`} className="inline-block px-2.5 py-1 border border-border rounded-md text-xs font-medium text-text-secondary hover:border-border-hover transition-colors no-underline mr-2">编辑</a>
              <DeletePostButton id={post.id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Create post list page — `src/app/admin/posts/page.tsx`**

```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeletePostButton } from "@/components/delete-post-button";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, published: true, viewCount: true, publishedAt: true, createdAt: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">文章管理</h1>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-text text-white rounded-md text-[13px] font-medium hover:bg-[#333] transition-colors no-underline">
          + 新建文章
        </Link>
      </div>
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">标题</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">Slug</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">状态</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">阅读</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-border last:border-0">
                <td className="px-[22px] py-3.5 text-sm font-semibold">{post.title}</td>
                <td className="px-[22px] py-3.5 text-sm font-mono text-text-muted">{post.slug}</td>
                <td className="px-[22px] py-3.5 text-sm">
                  {post.published ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#2d8a56]">已发布</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-text-muted">草稿</span>
                  )}
                </td>
                <td className="px-[22px] py-3.5 text-sm">{post.published ? post.viewCount.toLocaleString() : "—"}</td>
                <td className="px-[22px] py-3.5 text-sm">
                  <Link href={`/admin/posts/${post.id}/edit`} className="inline-block px-2.5 py-1 border border-border rounded-md text-xs font-medium text-text-secondary hover:border-border-hover transition-colors no-underline mr-2">编辑</Link>
                  <DeletePostButton id={post.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create new post page — `src/app/admin/posts/new/page.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { MarkdownEditor } from "@/components/markdown-editor";

export default function NewPostPage() {
  const router = useRouter();

  async function handleSave(data: { title: string; slug: string; content: string; published: boolean }) {
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, excerpt: "" }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "创建失败");
    }
    const post = await res.json();
    if (data.published) {
      router.push(`/posts/${post.slug}`);
    } else {
      router.push(`/admin/posts/${post.id}/edit`);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">新建文章</h1>
      <MarkdownEditor onSave={handleSave} />
    </div>
  );
}
```

- [ ] **Step 5: Create edit post page — `src/app/admin/posts/[id]/edit/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/markdown-editor";

interface PostData {
  title: string;
  slug: string;
  content: string;
  published: boolean;
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PostData | null>(null);

  useEffect(() => {
    fetch(`/api/admin/posts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("加载失败");
        return r.json();
      })
      .then((post) => {
        setData({
          title: post.title,
          slug: post.slug,
          content: post.content,
          published: post.published,
        });
      });
  }, [id]);

  async function handleSave(update: { title: string; slug: string; content: string; published: boolean }) {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...update, excerpt: "" }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "保存失败");
    }
    if (update.published) {
      router.push(`/posts/${update.slug}`);
    }
  }

  if (!data) return <p className="text-text-muted">加载中...</p>;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">编辑文章</h1>
      <MarkdownEditor
        initialTitle={data.title}
        initialSlug={data.slug}
        initialContent={data.content}
        isPublished={data.published}
        onSave={handleSave}
        saveLabel="保存草稿"
      />
    </div>
  );
}
```

- [ ] **Step 6: Create comments moderation page — `src/app/admin/comments/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CommentActions } from "@/components/comment-actions";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: { post: { select: { title: true, slug: true } } },
  });

  const pending = comments.filter((c) => !c.approved);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">评论审核</h1>
        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent">
          待审核 {pending.length}
        </span>
      </div>
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">评论内容</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">昵称</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">邮箱</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">文章</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">状态</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">操作</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-[22px] py-3.5 text-sm max-w-[280px] truncate">{c.content}</td>
                <td className="px-[22px] py-3.5 text-sm">{c.nickname}</td>
                <td className="px-[22px] py-3.5 text-sm text-text-muted">{c.email}</td>
                <td className="px-[22px] py-3.5 text-sm">{c.post.title}</td>
                <td className="px-[22px] py-3.5 text-sm">
                  {c.approved ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#2d8a56]">已通过</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-soft text-accent">待审核</span>
                  )}
                </td>
                <td className="px-[22px] py-3.5 text-sm">
                  <CommentActions commentId={c.id} approved={c.approved} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

Then create the client component `src/components/comment-actions.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";

export function CommentActions({ commentId, approved }: { commentId: string; approved: boolean }) {
  const router = useRouter();

  async function handleApprove() {
    await fetch(`/api/admin/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    router.refresh();
  }

  async function handleDelete() {
    // For simplicity, reject: set approved to false (or we could add a proper DELETE)
    await fetch(`/api/admin/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false }),
    });
    router.refresh();
  }

  return (
    <>
      {!approved && (
        <button onClick={handleApprove} className="inline-block px-2.5 py-1 bg-[#2d8a56] text-white rounded-md text-xs font-medium mr-2 border-0 cursor-pointer">
          通过
        </button>
      )}
      <button onClick={handleDelete} className="text-xs font-medium text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors border-0 bg-transparent cursor-pointer">
        删除
      </button>
    </>
  );
}
```

- [ ] **Step 7: Create visitor log page — `src/app/admin/visitors/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminVisitorsPage() {
  const logs = await prisma.visitLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { post: { select: { title: true, slug: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">访客记录</h1>
      </div>
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">IP</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">位置</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">页面</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">来源</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">设备</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const geo = log.geo as { country?: string; city?: string } | null;
              const ua = log.userAgent || "";
              const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Safari") ? "Safari" : ua.includes("Firefox") ? "Firefox" : ua.includes("Edge") ? "Edge" : "";
              const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : ua.includes("Android") ? "Android" : "";

              return (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="px-[22px] py-3.5 text-sm font-mono">{log.ip}</td>
                  <td className="px-[22px] py-3.5 text-sm">{geo ? `${geo.country || ""} ${geo.city || ""}` : "—"}</td>
                  <td className="px-[22px] py-3.5 text-sm">{log.post?.title || "首页"}</td>
                  <td className="px-[22px] py-3.5 text-sm text-text-muted">{log.referer || "直接访问"}</td>
                  <td className="px-[22px] py-3.5 text-sm text-text-muted">{browser}{os ? ` / ${os}` : ""}</td>
                  <td className="px-[22px] py-3.5 text-sm text-text-muted">{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create settings page — `src/app/admin/settings/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminSettingsPage() {
  const pendingCount = await prisma.comment.count({ where: { approved: false } });
  const totalViews = await prisma.post.aggregate({ _sum: { viewCount: true } });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">设置</h1>
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 max-w-md">
        <h3 className="font-semibold mb-4">博客信息</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">文章总数</span>
            <span className="font-medium">{await prisma.post.count()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">总阅读量</span>
            <span className="font-medium">{(totalViews._sum.viewCount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">待审核评论</span>
            <span className="font-medium text-accent">{pendingCount}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">技术栈</span>
            <span className="font-medium">Next.js + Prisma + Neon</span>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-4">修改密码功能通过环境变量配置，更新 .env 中的 ADMIN_PASSWORD_HASH 即可。</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin pages — dashboard, posts CRUD, comments moderation, visitors, settings"
```

---

### Task 12: Final Wiring & Verification

**Files:**
- Modify: Various files for fixes discovered during build

- [ ] **Step 1: Run the build**

Run: `npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Fix any build errors found**

Common issues to check:
- Import paths using `@/` alias match tsconfig paths
- Server components don't import client components incorrectly
- `params` is awaited properly (Next.js 15 async params)
- Prisma client properly imported from `@/lib/prisma`

- [ ] **Step 3: Verify dev server starts**

Run: `npx next dev`
Expected: Dev server starts on localhost:3000.

- [ ] **Step 4: Verify admin middleware redirect**

Test: Visit `http://localhost:3000/admin` (not logged in) → should redirect to `/login`.
Test: Visit `http://localhost:3000/api/admin/posts` → should return 401 JSON.

- [ ] **Step 5: Generate bcrypt password hash**

Run: `node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));"`

- [ ] **Step 6: Create .env file with real values**

```
DATABASE_URL="<your-neon-connection-string>"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="<hash from step 5>"
SESSION_SECRET="<generate: node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))'>"
```

- [ ] **Step 7: Seed a test article**

Run the following via a script or manually insert via Prisma Studio:

```bash
npx prisma studio
```

Add a test post with `published: true` and `publishedAt: now()`.

- [ ] **Step 8: End-to-end manual test**

1. Visit homepage → see the test article
2. Click article → see rendered Markdown
3. Submit a comment → see "审核通过后显示" message
4. Visit `/login` → login with admin credentials
5. Visit `/admin` → see dashboard stats
6. Visit `/admin/comments` → approve the comment
7. Return to article → see approved comment
8. Click like button → see count increment

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: wire up final config — env, build fixes, seed verification"
```

---

### Task 13: Deployment Preparation

**Files:**
- Create: None (config in Vercel dashboard)

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin <your-github-repo-url>
git push -u origin develop
```

- [ ] **Step 2: Create Neon database**

1. Go to https://neon.tech and create a free project
2. Copy the connection string

- [ ] **Step 3: Deploy to Vercel**

1. Go to https://vercel.com and import the GitHub repo
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `SESSION_SECRET`
3. Deploy

- [ ] **Step 4: Run database migration on production**

Run: `npx prisma db push` (using the production DATABASE_URL)

Or set the build command in Vercel to: `npx prisma db push --accept-data-loss && next build`

- [ ] **Step 5: Verify production**

1. Visit the Vercel URL
2. Run through the end-to-end test checklist from Task 12

- [ ] **Step 6: Set up custom domain (optional)**

In Vercel dashboard → Settings → Domains → Add domain.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "docs: add deployment instructions"
```
