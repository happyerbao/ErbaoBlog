import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LikeButton } from "@/components/like-button";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";

export const revalidate = 60;

interface PageParams {
  slug: string;
}

async function getComments(slug: string) {
  const post = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
  if (!post) return [];
  const raw = await prisma.comment.findMany({
    where: { postId: post.id, approved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, nickname: true, content: true, createdAt: true },
  });
  return raw.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));
}

export default async function PostPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      content: true,
      publishedAt: true,
      viewCount: true,
      _count: { select: { likes: true, comments: { where: { approved: true } } } },
    },
  });

  if (!post) notFound();

  const comments = await getComments(slug);

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-4">
        <article>
          <header className="mb-8">
            <h1 className="font-serif text-[32px] font-bold leading-tight mb-3 text-text">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span>{post.publishedAt?.toISOString().slice(0, 10)}</span>
              <span>{post.viewCount.toLocaleString()} 阅读</span>
              <span>{post._count.likes} 赞</span>
              <span>{post._count.comments} 评论</span>
            </div>
          </header>
          <div className="prose max-w-none text-[16px] text-text leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {post.content}
            </ReactMarkdown>
          </div>
          <div className="flex items-center gap-2 mt-8 pt-5 border-t border-border">
            <LikeButton slug={slug} initialCount={post._count.likes} />
          </div>
        </article>
        <CommentList comments={comments} />
        <CommentForm slug={slug} onSuccess={() => {}} />
      </main>
      <Footer />
    </>
  );
}
