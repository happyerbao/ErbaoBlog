"use client";

import { useRouter } from "next/navigation";
import { MarkdownEditor } from "@/components/markdown-editor";

export default function NewPostPage() {
  const router = useRouter();

  async function handleSave(data: { title: string; slug: string; content: string; published: boolean }) {
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, excerpt: "" }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "创建失败");
    }
    const post = await res.json();
    if (data.published) {
      router.push(`/posts/${post.slug}`);
    } else {
      router.push(`/admin/posts/${post.id}/edit`);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">新建文章</h1>
      <MarkdownEditor onSave={handleSave} />
    </div>
  );
}
