interface Comment {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="border-t-2 border-border pt-6 mt-8">
        <h4 className="font-semibold text-text mb-4">评论</h4>
        <p className="text-text-muted text-sm">还没有评论，来抢个沙发吧。</p>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-border pt-6 mt-8">
      <h4 className="font-semibold text-text mb-4">评论 ({comments.length})</h4>
      {comments.map((c) => (
        <div key={c.id} className="mb-4 pb-4 border-b border-border last:border-0">
          <div className="font-semibold text-sm mb-1 text-text">
            {c.nickname} <span className="text-text-muted font-normal text-xs">· {new Date(c.createdAt).toISOString().slice(0, 10)}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{c.content}</p>
        </div>
      ))}
    </div>
  );
}
