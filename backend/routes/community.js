const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createPost,
  getFeed,
  getPost,
  addComment,
  toggleLike,
  getUserPosts,
  deletePost,
  updatePost,
  getPostsByTag
} = require('../controllers/communityController');

// Create a new community post
router.post('/posts', auth, createPost);

// Get community feed with pagination (requires auth, shows all posts)
router.get('/feed', auth, getFeed);

// Get single post with full details
router.get('/posts/:id', auth, getPost);

// Add comment to a post
router.post('/posts/:id/comments', auth, addComment);

// Like/unlike a post
router.post('/posts/:id/likes', auth, toggleLike);

// Get user's own posts
router.get('/my-posts', auth, getUserPosts);

// Update post (caption, tags)
router.put('/posts/:id', auth, updatePost);

// Delete a post (soft delete)
router.delete('/posts/:id', auth, deletePost);

// Get posts by tag
router.get('/tag/:tag', auth, getPostsByTag);

module.exports = router;
