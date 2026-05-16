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
