import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 mt-10 mb-12">
      {page > 1 ? (
        <Link href={`/?page=${page - 1}`} className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text transition-all no-underline">←</Link>
      ) : (
        <span className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md text-sm font-medium opacity-30">←</span>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={`/?page=${p}`}
          className={`inline-flex items-center justify-center min-w-9 h-9 px-2.5 border rounded-md text-sm font-medium transition-all no-underline ${
            p === page
              ? "bg-text text-white border-text"
              : "bg-surface text-text-secondary border-border hover:border-border-hover hover:text-text"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={`/?page=${page + 1}`} className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md bg-surface text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text transition-all no-underline">→</Link>
      ) : (
        <span className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 border border-border rounded-md text-sm font-medium opacity-30">→</span>
      )}
    </div>
  );
}
