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
