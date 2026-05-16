import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeletePostButton } from "@/components/delete-post-button";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, published: true, viewCount: true, publishedAt: true, createdAt: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">文章管理</h1>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-text text-white rounded-md text-[13px] font-medium hover:bg-[#333] transition-colors no-underline">
          + 新建文章
        </Link>
      </div>
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">标题</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">Slug</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">状态</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">阅读</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-border last:border-0">
                <td className="px-[22px] py-3.5 text-sm font-semibold">{post.title}</td>
                <td className="px-[22px] py-3.5 text-sm font-mono text-text-muted">{post.slug}</td>
                <td className="px-[22px] py-3.5 text-sm">
                  {post.published ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#2d8a56]">已发布</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-text-muted">草稿</span>
                  )}
                </td>
                <td className="px-[22px] py-3.5 text-sm">{post.published ? post.viewCount.toLocaleString() : "—"}</td>
                <td className="px-[22px] py-3.5 text-sm">
                  <Link href={`/admin/posts/${post.id}/edit`} className="inline-block px-2.5 py-1 border border-border rounded-md text-xs font-medium text-text-secondary hover:border-border-hover transition-colors no-underline mr-2">编辑</Link>
                  <DeletePostButton id={post.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
