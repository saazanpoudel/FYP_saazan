const express = require('express');
const { protect } = require('../middleware/auth');
const ForumPost = require('../models/ForumPost');

const router = express.Router();

// @route   GET /api/forum
// @desc    Get all forum posts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const posts = await ForumPost.find()
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/forum
// @desc    Create a new post
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, content, tags, images } = req.body;
        const post = await ForumPost.create({
            author: req.user._id,
            title,
            content,
            tags,
            images
        });
        const populatedPost = await ForumPost.findById(post._id).populate('author', 'name avatar');
        res.status(201).json({ success: true, post: populatedPost });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/forum/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const index = post.likes.indexOf(req.user._id);
        if (index === -1) {
            post.likes.push(req.user._id);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        res.json({ success: true, likes: post.likes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/forum/:id/comments
// @desc    Comment on a post
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        post.comments.push({
            user: req.user._id,
            text: req.body.text
        });

        await post.save();
        const updatedPost = await ForumPost.findById(post._id).populate('author', 'name avatar').populate('comments.user', 'name avatar');
        res.json({ success: true, post: updatedPost });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
