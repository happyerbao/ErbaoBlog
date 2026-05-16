"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/markdown-editor";

interface PostData {
  title: string;
  slug: string;
  content: string;
  published: boolean;
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PostData | null>(null);

  useEffect(() => {
    fetch(`/api/admin/posts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("加载失败");
        return r.json();
      })
      .then((post) => {
        setData({
          title: post.title,
          slug: post.slug,
          content: post.content,
          published: post.published,
        });
      });
  }, [id]);

  async function handleSave(update: { title: string; slug: string; content: string; published: boolean }) {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...update, excerpt: "" }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "保存失败");
    }
    if (update.published) {
      router.push(`/posts/${update.slug}`);
    }
  }

  if (!data) return <p className="text-text-muted">加载中...</p>;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">编辑文章</h1>
      <MarkdownEditor
        initialTitle={data.title}
        initialSlug={data.slug}
        initialContent={data.content}
        isPublished={data.published}
        onSave={handleSave}
        saveLabel="保存草稿"
      />
    </div>
  );
}
