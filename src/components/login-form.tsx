"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">用户名</label>
        <input
          type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
          className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm outline-none focus:border-border-hover"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">密码</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          className="w-full px-3.5 py-2.5 border border-border rounded-md bg-surface text-sm outline-none focus:border-border-hover"
        />
      </div>
      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-text text-white rounded-md text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {loading ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
