import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CommentActions } from "@/components/comment-actions";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: { post: { select: { title: true, slug: true } } },
  });

  const pending = comments.filter((c) => !c.approved);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">评论审核</h1>
        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-soft text-accent">
          待审核 {pending.length}
        </span>
      </div>
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">评论内容</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">昵称</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">邮箱</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">文章</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">状态</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">操作</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-[22px] py-3.5 text-sm max-w-[280px] truncate">{c.content}</td>
                <td className="px-[22px] py-3.5 text-sm">{c.nickname}</td>
                <td className="px-[22px] py-3.5 text-sm text-text-muted">{c.email}</td>
                <td className="px-[22px] py-3.5 text-sm">{c.post.title}</td>
                <td className="px-[22px] py-3.5 text-sm">
                  {c.approved ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#2d8a56]">已通过</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-soft text-accent">待审核</span>
                  )}
                </td>
                <td className="px-[22px] py-3.5 text-sm">
                  <CommentActions commentId={c.id} approved={c.approved} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
