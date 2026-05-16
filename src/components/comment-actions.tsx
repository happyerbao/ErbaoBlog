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
