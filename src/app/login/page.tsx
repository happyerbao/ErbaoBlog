import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <Link href="/" className="font-serif text-xl font-bold text-text no-underline">
            Erbao<span className="text-accent">.</span>
          </Link>
          <p className="text-sm text-text-muted mt-2">管理员登录</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
