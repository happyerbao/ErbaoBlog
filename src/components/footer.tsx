export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-16 text-center max-w-content mx-auto px-4">
      <p className="text-sm text-text-muted tracking-wide">
        Erbao<span className="text-accent">.</span> &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Powered by Next.js
      </p>
    </footer>
  );
}
