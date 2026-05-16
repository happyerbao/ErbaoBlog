"use client";

import { useState } from "react";

interface LikeButtonProps {
  slug: string;
  initialCount: number;
}

export function LikeButton({ slug, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${slug}/like`, { method: "POST" });
      const data = await res.json();
      setCount(data.count);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text transition-all disabled:opacity-50"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      </svg>
      点赞 ({count})
    </button>
  );
}
