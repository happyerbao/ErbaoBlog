"use client";

import { useState, FormEvent } from "react";

interface CommentFormProps {
  slug: string;
  onSuccess?: () => void;
}

export function CommentForm({ slug, onSuccess }: CommentFormProps) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, email, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "评论已提交，审核通过后显示");
        setNickname("");
        setEmail("");
        setContent("");
        onSuccess?.();
      } else {
        setMessage(data.error || "提交失败");
      }
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 pt-5 border-t border-border">
      <h4 className="font-semibold text-text mb-3">发表评论</h4>
      {message && <p className={`text-sm mb-3 ${message.includes("失败") || message.includes("错误") ? "text-red-600" : "text-green-700"}`}>{message}</p>}
      <input
        type="text" placeholder="你的昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={50}
        className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm mb-2.5 outline-none focus:border-border-hover font-sans"
      />
      <input
        type="email" placeholder="你的邮箱（不公开）" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200}
        className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm mb-2.5 outline-none focus:border-border-hover font-sans"
      />
      <textarea
        placeholder="写下你的想法..." value={content} onChange={(e) => setContent(e.target.value)} required maxLength={2000} rows={3}
        className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm outline-none focus:border-border-hover resize-y font-sans"
      />
      <button
        type="submit" disabled={submitting}
        className="mt-2.5 px-5 py-2 bg-text text-white rounded-md text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {submitting ? "提交中..." : "提交评论"}
      </button>
      <p className="text-xs text-text-muted mt-2">评论需经管理员审核后显示</p>
    </form>
  );
}
