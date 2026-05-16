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
