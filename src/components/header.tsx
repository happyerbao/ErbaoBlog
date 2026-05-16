import Link from "next/link";

export function Header() {
  return (
    <nav className="flex items-center justify-between py-5 border-b border-border mb-12 max-w-content mx-auto px-4">
      <Link href="/" className="font-serif text-xl font-bold tracking-tight text-text no-underline">
        Erbao<span className="text-accent">.</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/" className="text-sm font-medium text-text-secondary hover:text-text transition-colors hidden sm:inline">
          归档
        </Link>
        <Link href="/" className="text-sm font-medium text-text-secondary hover:text-text transition-colors hidden sm:inline">
          关于
        </Link>
        <Link href="/login" className="text-sm font-medium px-3.5 py-1.5 border border-border rounded-md text-text-secondary hover:text-text hover:border-border-hover hover:bg-surface transition-all">
          登录
        </Link>
      </div>
    </nav>
  );
}
