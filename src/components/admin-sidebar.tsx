"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "仪表盘", icon: "📊" },
  { href: "/admin/posts", label: "文章管理", icon: "📝" },
  { href: "/admin/comments", label: "评论审核", icon: "💬" },
  { href: "/admin/visitors", label: "访客记录", icon: "👁" },
  { href: "/admin/settings", label: "设置", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-surface border-r border-border p-6 flex flex-col flex-shrink-0 max-md:w-full max-md:flex-row max-md:items-center max-md:border-r-0 max-md:border-b max-md:p-3 max-md:overflow-x-auto">
      <div className="font-serif text-base font-bold mb-8 max-md:mb-0 max-md:mr-4 max-md:whitespace-nowrap">
        Erbao<span className="text-accent">.</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1 max-md:flex-row max-md:gap-0.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
              pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                ? "bg-text text-white"
                : "text-text-secondary hover:bg-bg hover:text-text"
            } max-md:text-xs max-md:px-2.5 max-md:py-1.5 max-md:whitespace-nowrap`}
          >
            <span>{link.icon}</span> {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border pt-4 text-xs text-text-muted max-md:hidden">
        <Link href="/" className="text-text-secondary no-underline hover:text-text">← 返回博客</Link>
      </div>
    </aside>
  );
}
