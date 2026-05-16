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
