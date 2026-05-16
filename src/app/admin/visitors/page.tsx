import { prisma } from "@/lib/prisma";

export default async function AdminVisitorsPage() {
  const logs = await prisma.visitLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { post: { select: { title: true, slug: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">访客记录</h1>
      </div>
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">IP</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">位置</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">页面</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">来源</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">设备</th>
              <th className="text-left px-[22px] py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-[0.05em] border-b border-border bg-bg">时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const geo = log.geo as { country?: string; city?: string } | null;
              const ua = log.userAgent || "";
              const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Safari") ? "Safari" : ua.includes("Firefox") ? "Firefox" : ua.includes("Edge") ? "Edge" : "";
              const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : ua.includes("Android") ? "Android" : "";

              return (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="px-[22px] py-3.5 text-sm font-mono">{log.ip}</td>
                  <td className="px-[22px] py-3.5 text-sm">{geo ? `${geo.country || ""} ${geo.city || ""}` : "—"}</td>
                  <td className="px-[22px] py-3.5 text-sm">{log.post?.title || "首页"}</td>
                  <td className="px-[22px] py-3.5 text-sm text-text-muted">{log.referer || "直接访问"}</td>
                  <td className="px-[22px] py-3.5 text-sm text-text-muted">{browser}{os ? ` / ${os}` : ""}</td>
                  <td className="px-[22px] py-3.5 text-sm text-text-muted">{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
