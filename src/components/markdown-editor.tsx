"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownEditorProps {
  initialTitle?: string;
  initialSlug?: string;
  initialContent?: string;
  isPublished?: boolean;
  onSave: (data: { title: string; slug: string; content: string; published: boolean }) => Promise<void>;
  saveLabel?: string;
}

export function MarkdownEditor({
  initialTitle = "",
  initialSlug = "",
  initialContent = "",
  isPublished = false,
  onSave,
  saveLabel = "保存草稿",
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(published: boolean) {
    if (saving) return;
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError("标题、Slug、内容不能为空");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), slug: slug.trim(), content: content.trim(), published });
    } catch (e: any) {
      setError(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-[800px]">
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">{error}</div>}

      <input
        type="text" placeholder="文章标题" value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full font-serif text-2xl font-bold px-4 py-3.5 border border-border rounded-lg bg-surface outline-none focus:border-border-hover"
      />

      <input
        type="text" placeholder="slug (URL 友好标识，如 hello-world)" value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        className="w-full font-mono text-sm px-3.5 py-2.5 border border-border rounded-md bg-surface outline-none focus:border-border-hover"
      />

      <div className="flex gap-3 min-h-[360px] max-md:flex-col">
        <textarea
          placeholder="用 Markdown 书写..." value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 font-mono text-sm leading-relaxed p-5 border border-border rounded-lg bg-surface outline-none focus:border-border-hover resize-none"
        />
        <div className="flex-1 p-5 border border-border rounded-lg bg-surface overflow-y-auto">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-4">预览</div>
          <div className="prose prose-sm max-w-none font-sans text-text leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeSanitize]}>
              {content || "*暂无内容*"}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-5 py-2 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover transition-colors disabled:opacity-50"
        >
          {saveLabel}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-5 py-2 bg-text text-white rounded-md text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "发布"}
        </button>
      </div>
    </div>
  );
}
