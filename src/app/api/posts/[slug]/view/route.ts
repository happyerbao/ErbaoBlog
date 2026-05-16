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
