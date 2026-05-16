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
