import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Erbao's Blog",
  description: "Personal blog about technology and life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="relative z-0">{children}</body>
    </html>
  );
}
