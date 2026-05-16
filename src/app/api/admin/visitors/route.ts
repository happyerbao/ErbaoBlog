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
