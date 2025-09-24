const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const { logInfo, logError, logWarn } = require('../utils/logger');
const { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  asyncHandler 
} = require('../utils/errorHandler');

// Create a new community post
const createPost = asyncHandler(async (req, res) => {
  const { imageUrl, caption, tags, source, julesFeedback } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!imageUrl) {
    throw new ValidationError('Image URL is required');
  }

  if (!source || !['fit_check', 'manual'].includes(source)) {
    throw new ValidationError('Source must be either "fit_check" or "manual"');
  }

  // Get user information
  const user = await User.findById(userId).select('name email');
  if (!user) {
    throw new NotFoundError('User');
  }

  // Create the post
  const post = new CommunityPost({
    userId,
    username: user.name?.split(' ')[0] || user.name, // Use first name only
    imageUrl,
    caption: caption || '',
    tags: tags || [],
    source,
    julesFeedback: julesFeedback || ''
  });

  await post.save();

  logInfo('Community post created', { 
    postId: post.postId, 
    userId, 
    source,
    tags: tags?.length || 0 
  });

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: {
      postId: post.postId,
      post: post
    }
  });
});

// Get community feed with pagination
const getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user.id;

  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 posts per page
  const skip = (pageNum - 1) * limitNum;

  // Build query - exclude deleted posts
  const query = { isDeleted: false };

  // Get posts with user information
  const posts = await CommunityPost.find(query)
    .populate('userId', 'name picture')
    .sort({ isPinned: -1, createdAt: -1 }) // Pinned posts first, then by date
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const totalPosts = await CommunityPost.countDocuments(query);
  const totalPages = Math.ceil(totalPosts / limitNum);

  // Format response data
  const formattedPosts = posts.map(post => ({
    postId: post.postId,
    userId: post.userId._id,
    username: post.username,
    userPicture: post.userId.picture,
    imageUrl: post.imageUrl,
    caption: post.caption,
    tags: post.tags,
    source: post.source,
    julesFeedback: post.julesFeedback,
    likesCount: post.likes ? post.likes.length : 0,
    commentsCount: post.comments ? post.comments.length : 0,
    isLiked: post.likes.some(likeId => likeId.toString() === userId),
    isPinned: post.isPinned,
    isJulesPost: post.isJulesPost,
    createdAt: post.createdAt
  }));

  logInfo('Community feed retrieved', { 
    userId, 
    page: pageNum, 
    limit: limitNum, 
    totalPosts,
    returnedPosts: formattedPosts.length 
  });

  res.json({
    success: true,
    data: {
      posts: formattedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPosts,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  });
});

// Get single post with full details
const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const post = await CommunityPost.findOne({ 
    postId: id, 
    isDeleted: false 
  })
    .populate('userId', 'name picture')
    .populate('likes', 'name')
    .lean();

  if (!post) {
    throw new NotFoundError('Post');
  }

  // Format comments with user info
  const commentsWithUserInfo = await Promise.all(
    post.comments.map(async (comment) => {
      const user = await User.findById(comment.userId).select('name picture');
      return {
        commentId: comment.commentId,
        userId: comment.userId,
        username: comment.username,
        userPicture: user?.picture,
        text: comment.text,
        createdAt: comment.createdAt
      };
    })
  );

  const formattedPost = {
    postId: post.postId,
    userId: post.userId._id,
    username: post.username,
    userPicture: post.userId.picture,
    imageUrl: post.imageUrl,
    caption: post.caption,
    tags: post.tags,
    source: post.source,
    julesFeedback: post.julesFeedback,
    likes: post.likes.map(like => ({
      userId: like._id,
      username: like.name
    })),
    likesCount: post.likes ? post.likes.length : 0,
    comments: commentsWithUserInfo,
    commentsCount: post.comments ? post.comments.length : 0,
    isLiked: post.likes.some(like => like._id.toString() === userId),
    isPinned: post.isPinned,
    isJulesPost: post.isJulesPost,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };

  logInfo('Community post retrieved', { postId: id, userId });

  res.json({
    success: true,
    data: {
      post: formattedPost
    }
  });
});

// Add comment to a post
const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || text.trim().length === 0) {
    throw new ValidationError('Comment text is required');
  }

  if (text.length > 500) {
    throw new ValidationError('Comment must be 500 characters or less');
  }

  // Get user information
  const user = await User.findById(userId).select('name');
  if (!user) {
    throw new NotFoundError('User');
  }

  // Find the post
  const post = await CommunityPost.findOne({ 
    postId: id, 
    isDeleted: false 
  });

  if (!post) {
    throw new NotFoundError('Post');
  }

  // Create comment
  const comment = {
    commentId: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    username: user.name?.split(' ')[0] || user.name, // Use first name only
    text: text.trim(),
    createdAt: new Date()
  };

  // Add comment to post
  post.comments.push(comment);
  await post.save();

  logInfo('Comment added to post', { 
    postId: id, 
    commentId: comment.commentId, 
    userId 
  });

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: {
      commentId: comment.commentId,
      comment: {
        ...comment,
        userPicture: user.picture
      }
    }
  });
});

// Like/unlike a post
const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const post = await CommunityPost.findOne({ 
    postId: id, 
    isDeleted: false 
  });

  if (!post) {
    throw new NotFoundError('Post');
  }

  const isLiked = post.likes.some(likeId => likeId.toString() === userId);
  let action;

  if (isLiked) {
    // Unlike the post
    post.likes = post.likes.filter(likeId => likeId.toString() !== userId);
    action = 'unliked';
  } else {
    // Like the post
    post.likes.push(userId);
    action = 'liked';
  }

  await post.save();

  logInfo(`Post ${action}`, { postId: id, userId, newLikesCount: post.likes.length });

  res.json({
    success: true,
    message: `Post ${action} successfully`,
    data: {
      postId: post.postId,
      likesCount: post.likes.length,
      isLiked: action === 'liked'
    }
  });
});

// Get user's own posts
const getUserPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user.id;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const query = { 
    userId, 
    isDeleted: false 
  };

  const posts = await CommunityPost.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const totalPosts = await CommunityPost.countDocuments(query);
  const totalPages = Math.ceil(totalPosts / limitNum);

  const formattedPosts = posts.map(post => ({
    postId: post.postId,
    imageUrl: post.imageUrl,
    caption: post.caption,
    tags: post.tags,
    source: post.source,
    julesFeedback: post.julesFeedback,
    likesCount: post.likes ? post.likes.length : 0,
    commentsCount: post.comments ? post.comments.length : 0,
    isPinned: post.isPinned,
    isJulesPost: post.isJulesPost,
    createdAt: post.createdAt
  }));

  logInfo('User posts retrieved', { 
    userId, 
    page: pageNum, 
    totalPosts,
    returnedPosts: formattedPosts.length 
  });

  res.json({
    success: true,
    data: {
      posts: formattedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPosts,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  });
});

// Delete a post (soft delete)
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const post = await CommunityPost.findOne({ 
    postId: id, 
    userId, // Users can only delete their own posts
    isDeleted: false 
  });

  if (!post) {
    throw new NotFoundError('Post');
  }

  // Soft delete
  post.isDeleted = true;
  await post.save();

  logInfo('Post deleted', { postId: id, userId });

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// Update post caption (user can only edit their own posts)
const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { caption, tags } = req.body;
  const userId = req.user.id;

  const post = await CommunityPost.findOne({ 
    postId: id, 
    userId, // Users can only edit their own posts
    isDeleted: false 
  });

  if (!post) {
    throw new NotFoundError('Post');
  }

  // Update fields if provided
  if (caption !== undefined) {
    post.caption = caption;
  }
  
  if (tags !== undefined) {
    post.tags = tags;
  }

  await post.save();

  logInfo('Post updated', { postId: id, userId });

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: {
      post: post
    }
  });
});

// Get posts by tag
const getPostsByTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user.id;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const query = { 
    tags: tag,
    isDeleted: false 
  };

  const posts = await CommunityPost.find(query)
    .populate('userId', 'name picture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const totalPosts = await CommunityPost.countDocuments(query);
  const totalPages = Math.ceil(totalPosts / limitNum);

  const formattedPosts = posts.map(post => ({
    postId: post.postId,
    userId: post.userId._id,
    username: post.username,
    userPicture: post.userId.picture,
    imageUrl: post.imageUrl,
    caption: post.caption,
    tags: post.tags,
    source: post.source,
    julesFeedback: post.julesFeedback,
    likesCount: post.likes ? post.likes.length : 0,
    commentsCount: post.comments ? post.comments.length : 0,
    isLiked: post.likes.some(likeId => likeId.toString() === userId),
    isPinned: post.isPinned,
    isJulesPost: post.isJulesPost,
    createdAt: post.createdAt
  }));

  logInfo('Posts by tag retrieved', { 
    tag, 
    userId, 
    page: pageNum, 
    totalPosts,
    returnedPosts: formattedPosts.length 
  });

  res.json({
    success: true,
    data: {
      posts: formattedPosts,
      tag,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPosts,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  });
});

module.exports = {
  createPost,
  getFeed,
  getPost,
  addComment,
  toggleLike,
  getUserPosts,
  deletePost,
  updatePost,
  getPostsByTag
};