import { prisma } from "@/lib/prisma";

export default async function AdminSettingsPage() {
  const pendingCount = await prisma.comment.count({ where: { approved: false } });
  const totalViews = await prisma.post.aggregate({ _sum: { viewCount: true } });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">设置</h1>
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 max-w-md">
        <h3 className="font-semibold mb-4">博客信息</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">文章总数</span>
            <span className="font-medium">{await prisma.post.count()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">总阅读量</span>
            <span className="font-medium">{(totalViews._sum.viewCount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">待审核评论</span>
            <span className="font-medium text-accent">{pendingCount}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-text-secondary">技术栈</span>
            <span className="font-medium">Next.js + Prisma + Neon</span>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-4">修改密码功能通过环境变量配置，更新 .env 中的 ADMIN_PASSWORD_HASH 即可。</p>
      </div>
    </div>
  );
}
