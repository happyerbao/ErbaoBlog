import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { Pagination } from "@/components/pagination";

export const revalidate = 60;

interface SearchParams {
  page?: string;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1"));
  const pageSize = 10;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        viewCount: true,
        _count: { select: { likes: true, comments: { where: { approved: true } } } },
      },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-4">
        <div className="mb-10">
          <h2 className="font-serif text-base font-normal text-text-muted uppercase tracking-[0.04em]">Recent Writing</h2>
        </div>
        {posts.map((post: { slug: string; title: string; excerpt: string | null; publishedAt: Date | null; viewCount: number; _count: { likes: number; comments: number } }, i: number) => (
          <ArticleCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            publishedAt={post.publishedAt?.toISOString() || null}
            viewCount={post.viewCount}
            likeCount={post._count.likes}
            commentCount={post._count.comments}
            isFirst={i === 0}
          />
        ))}
        <Pagination page={page} totalPages={Math.ceil(total / pageSize)} />
      </main>
      <Footer />
    </>
  );
}
