'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Comment {
  commentId: string;
  userId: string;
  username: string;
  userPicture?: string;
  text: string;
  createdAt: string;
}

interface Post {
  postId: string;
  userId: string;
  username: string;
  userPicture?: string;
  imageUrl: string;
  caption: string;
  tags: string[];
  source: 'fit_check' | 'manual';
  julesFeedback?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  isJulesPost: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string, isLiked: boolean, likesCount: number) => void;
  onComment?: (postId: string) => void;
  showComments?: boolean;
  onViewPost?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isMyPost?: boolean;
}

export default function PostCard({ 
  post, 
  currentUserId, 
  onLike, 
  onComment, 
  showComments = false,
  onViewPost,
  onDelete,
  isMyPost = false
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  // Sync local state with post prop changes
  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
  }, [post.isLiked, post.likesCount]);

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const router = useRouter();

  const handleLike = async () => {
    console.log('🔥 Like button clicked!', { postId: post.postId, isLiking, isLiked, likesCount });
    
    if (isLiking) {
      console.log('Already liking, ignoring click');
      return;
    }
    
    setIsLiking(true);
    try {
      console.log('Making API call to like post:', post.postId);
      const response = await apiClient.community.likePost(post.postId);
      console.log('API response received:', response);
      
      const newIsLiked = response.data.data.isLiked;
      const newLikesCount = response.data.data.likesCount;
      
      console.log('Updating state with:', { newIsLiked, newLikesCount });
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);
      onLike?.(post.postId, newIsLiked, newLikesCount);
    } catch (error: any) {
      console.error('Error liking post:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    
    setIsCommenting(true);
    try {
      await apiClient.community.addComment(post.postId, commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
      onComment?.(post.postId);
    } catch (error: any) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleViewPost = () => {
    if (onViewPost) {
      onViewPost(post.postId);
    } else {
      router.push(`/community/post/${post.postId}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await apiClient.community.deletePost(post.postId);
        onDelete?.(post.postId);
      } catch (error: any) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Get first name only
  const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || fullName || 'Unknown User';
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {post.userPicture ? (
                  <img 
                    src={post.userPicture} 
                    alt={post.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {getFirstName(post.username)?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white">{getFirstName(post.username)}</h3>
                  {post.isPinned && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                      Pinned
                    </span>
                  )}
                  {post.isJulesPost && (
                    <span className="text-xs bg-pink-600 text-white px-2 py-1 rounded-full">
                      Jules
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300">{formatTimeAgo(post.createdAt)}</p>
              </div>
            </div>
            {isMyPost && (
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Delete post"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="relative">
          <img 
            src={post.imageUrl} 
            alt="Post"
            className="w-full h-auto max-h-96 object-contain bg-gray-900 cursor-pointer"
            onClick={() => setShowFullImage(true)}
          />
        </div>

        {/* Actions */}
        <div className="p-4 pt-2">
          <div className="flex items-center space-x-4 mb-3">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'
              }`}
            >
              <span className="text-2xl">{isLiked ? '🔥' : '🔥'}</span>
              <span className="text-sm font-medium text-white">{likesCount || 0}</span>
            </button>
            
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium text-white">{post.commentsCount || 0}</span>
            </button>
            
            <button
              onClick={handleViewPost}
              className="flex items-center space-x-1 text-gray-400 hover:text-green-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-medium text-white">View</span>
            </button>
          </div>

          {/* Caption */}
          <div className="mb-3">
            <p className="text-white">
              <span className="font-semibold">{getFirstName(post.username)}</span>{' '}
              {post.caption}
            </p>
          </div>

          {/* Jules Feedback */}
          {post.source === 'fit_check' && post.julesFeedback && (
            <div className="mb-3 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">J</span>
                </div>
                <span className="text-sm font-semibold text-gray-300">Jules says:</span>
              </div>
              <p className="text-sm text-gray-200">
                {post.julesFeedback.split('\n')[0]}
                {post.julesFeedback.split('\n').length > 1 && '...'}
              </p>
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-sm text-blue-400">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments Count - Only show if there are comments */}
          {post.commentsCount > 0 && (
            <div className="mb-3">
              <button
                onClick={handleViewPost}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                View all {post.commentsCount} comments
              </button>
            </div>
          )}

          {/* Comment Input */}
          {showCommentInput && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button
                  onClick={handleComment}
                  disabled={isCommenting || !commentText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCommenting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={post.imageUrl} 
              alt="Full size post"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}