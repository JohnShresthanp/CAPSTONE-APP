import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { fetchReview, likeReview, deleteReview, fetchComments, addComment, deleteComment } from '../services/reviewApi';
import { useAuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadReview = useCallback(async () => {
    try {
      const data = await fetchReview(id);
      setReview(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchComments(id);
      setComments(data.data || data || []);
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  useEffect(() => { loadReview(); loadComments(); }, [loadReview, loadComments]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const updated = await likeReview(id);
      setReview((prev) => ({ ...prev, likedByUser: updated.likedByUser, _count: { ...prev._count, likes: updated.likesCount } }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(id);
      navigate(review?.movie?.id ? `/movies/${review.movie.id}` : '/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setSubmittingComment(true);
    try {
      await addComment(id, text);
      setCommentText('');
      loadComments();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(id, commentId);
      loadComments();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-text">
        <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
          <Navbar />
          <div className="mt-10 text-sm text-muted">Loading review...</div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-surface text-text">
        <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
          <Navbar />
          <div className="mt-10 text-sm text-muted">Review not found.</div>
        </div>
      </div>
    );
  }

  const isOwner = user && review.user?.id === user.id;
  const liked = review.likedByUser;
  const likesCount = review._count?.likes ?? 0;

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <Navbar />

        <main className="mt-8 space-y-6">
          <Link
            to={`/movies/${review.movie?.id}`}
            className="inline-block text-[11px] uppercase tracking-[0.28em] text-muted transition hover:text-text"
          >
            &larr; {review.movie?.title || 'Back to movie'}
          </Link>

          <div className="rounded-[32px] border border-white/10 bg-surface2 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Review</p>
                {review.movie?.title && (
                  <h1 className="text-2xl font-semibold text-white">
                    <Link to={`/movies/${review.movie.id}`} className="hover:underline">{review.movie.title}</Link>
                  </h1>
                )}
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="h-6 w-6 overflow-hidden rounded-full bg-surface3">
                    {review.user?.avatar_url ? (
                      <img src={review.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted">{review.user?.username?.[0]?.toUpperCase() || '?'}</div>
                    )}
                  </div>
                  <Link to={`/users/${review.user?.username}`} className="hover:text-text">{review.user?.username || 'Unknown'}</Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-accentGold/10 px-4 py-2 text-sm uppercase tracking-[0.18em] text-accentGold">
                  {review.rating}/5
                </span>
              </div>
            </div>

            {review.body && (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-surface3 p-5">
                <p className="text-sm leading-7 text-text">{review.body}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={!user}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition ${
                  liked ? 'bg-red-500/10 text-red-400' : 'border border-white/10 text-muted hover:border-white/20'
                }`}
              >
                <Heart size={14} className={liked ? 'fill-red-400' : ''} />
                <span>{likesCount}</span>
              </button>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <MessageCircle size={14} />
                <span>{comments.length || review._count?.comments || 0}</span>
              </span>
              {isOwner && (
                <button onClick={handleDelete} className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-muted transition hover:border-red-400/30 hover:text-red-400">
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-surface2 p-6 sm:p-8 space-y-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Comments ({comments.length})</p>

            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-full border border-white/10 bg-surface3 px-4 py-2.5 text-sm text-text outline-none placeholder:text-muted focus:border-white/20"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="rounded-full bg-accentGold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {submittingComment ? 'Sending...' : 'Send'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-muted"><Link to="/login" className="text-accentGold underline">Log in</Link> to leave a comment.</p>
            )}

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-[28px] border border-white/10 bg-surface3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 overflow-hidden rounded-full bg-surface2">
                          {comment.user?.avatar_url ? (
                            <img src={comment.user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-muted">{comment.user?.username?.[0]?.toUpperCase() || '?'}</div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-white">{comment.user?.username || 'Unknown'}</p>
                      </div>
                      {user && comment.user?.id === user.id && (
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-muted hover:text-red-400 transition">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted leading-6">{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No comments yet.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReviewDetail;
