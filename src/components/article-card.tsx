import Link from "next/link";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFirst?: boolean;
}

function StatIcon({ children }: { children: React.ReactNode }) {
  return <span className="opacity-50 w-3.5 h-3.5 inline-flex items-center">{children}</span>;
}

export function ArticleCard({ slug, title, excerpt, publishedAt, viewCount, likeCount, commentCount, isFirst }: ArticleCardProps) {
  const date = publishedAt ? new Date(publishedAt).toISOString().slice(0, 10) : "";

  return (
    <Link
      href={`/posts/${slug}`}
      className={`block bg-surface border border-border rounded-xl p-7 mb-3 shadow-sm hover:border-border-hover hover:shadow-md hover:-translate-y-px transition-all duration-200 no-underline text-inherit ${isFirst ? "border-l-[3px] border-l-accent pl-[25px]" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs text-text-muted font-mono tracking-wide">{date}</span>
        {isFirst && <span className="text-[11px] text-accent bg-accent-soft px-2 py-0.5 rounded-full font-semibold tracking-wider">最新</span>}
      </div>
      <h3 className="font-serif text-[22px] font-bold leading-snug mb-2 text-text group-hover:text-accent">{title}</h3>
      {excerpt && (
        <p className="text-[15px] text-text-secondary leading-relaxed mb-3.5 line-clamp-2">{excerpt}</p>
      )}
      <div className="flex items-center gap-4 text-[13px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <StatIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></StatIcon>
          {viewCount.toLocaleString()} 阅读
        </span>
        <span className="inline-flex items-center gap-1">
          <StatIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg></StatIcon>
          {likeCount} 赞
        </span>
        <span className="inline-flex items-center gap-1">
          <StatIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></StatIcon>
          {commentCount} 评论
        </span>
      </div>
    </Link>
  );
}
