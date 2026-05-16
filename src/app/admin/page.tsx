import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/stats-card";
import { DeletePostButton } from "@/components/delete-post-button";

export default async function AdminDashboard() {
  const [totalPosts, totalViews, pendingComments, todayVisits] = await Promise.all([
    prisma.post.count(),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.comment.count({ where: { approved: false } }),
    prisma.visitLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold">仪表盘</h1>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-9 max-md:grid-cols-2">
        <StatsCard label="文章总数" value={totalPosts} sub={`${await prisma.post.count({ where: { published: false } })} 篇草稿`} />
        <StatsCard label="总阅读量" value={(totalViews._sum.viewCount || 0).toLocaleString()} sub="全部文章" />
        <StatsCard label="待审核评论" value={pendingComments} accent />
        <StatsCard label="今日访问" value={todayVisits} />
      </div>

      {/* Recent posts table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-border">
          <h3 className="text-[15px] font-semibold">最近文章</h3>
          <a href="/admin/posts/new" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-text text-white rounded-md text-[13px] font-medium hover:bg-[#333] transition-colors no-underline">
            + 新建文章
          </a>
        </div>
        <RecentPostsTable />
      </div>
    </div>
  );
}

async function RecentPostsTable() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, slug: true, published: true, viewCount: true, publishedAt: true },
  });

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">标题</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">状态</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">阅读</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">日期</th>
          <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">操作</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} className="border-b border-border last:border-0">
            <td className="px-[22px] py-3.5 text-sm font-semibold">{post.title}</td>
            <td className="px-[22px] py-3.5 text-sm">
              {post.published ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#2d8a56]">已发布</span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-text-muted">草稿</span>
              )}
            </td>
            <td className="px-[22px] py-3.5 text-sm">{post.published ? post.viewCount.toLocaleString() : "—"}</td>
            <td className="px-[22px] py-3.5 text-sm text-text-muted">{post.publishedAt?.toISOString().slice(0, 10) || "—"}</td>
            <td className="px-[22px] py-3.5 text-sm">
              <a href={`/admin/posts/${post.id}/edit`} className="inline-block px-2.5 py-1 border border-border rounded-md text-xs font-medium text-text-secondary hover:border-border-hover transition-colors no-underline mr-2">编辑</a>
              <DeletePostButton id={post.id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
