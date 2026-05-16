import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "pending";
  const where = status === "all" ? {} :
    status === "approved" ? { approved: true } :
    status === "rejected" ? { approved: false } :
    { approved: false };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json(comments);
}
