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
