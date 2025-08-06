const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Match = require('../models/Match');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all matches where user is involved and it's a mutual match
    const matches = await Match.find({
      $or: [
        { user1: req.user.id },
        { user2: req.user.id }
      ],
      status: 'mutual_like'
    })
    .populate({
      path: 'user1 user2',
      select: 'firstName lastName profileImage lastActive'
    })
    .sort({ lastInteraction: -1 });

    // Get last message for each conversation
    const conversations = await Promise.all(
      matches.map(async (match) => {
        const otherUser = match.user1._id.toString() === req.user.id.toString() 
          ? match.user2 
          : match.user1;

        const lastMessage = await Message.findOne({
          match: match._id
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'firstName lastName');

        const unreadCount = await Message.countDocuments({
          match: match._id,
          receiver: req.user.id,
          isRead: false,
          isDeleted: false
        });

        return {
          matchId: match._id,
          otherUser,
          lastMessage,
          unreadCount,
          lastInteraction: match.lastInteraction,
          conversationStarted: match.conversationStarted
        };
      })
    );

    // Sort by last interaction
    conversations.sort((a, b) => 
      new Date(b.lastInteraction) - new Date(a.lastInteraction)
    );

    res.json(conversations);

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:matchId
// @desc    Get messages for a specific match
// @access  Private
router.get('/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is part of this match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.user1.toString() !== req.user.id.toString() && 
        match.user2.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get messages
    const messages = await Message.find({
      match: matchId,
      isDeleted: false
    })
    .populate('sender', 'firstName lastName profileImage')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        match: matchId,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:matchId
// @desc    Send a message
// @access  Private
router.post('/:matchId', [
  auth,
  body('content').trim().isLength({ min: 1, max: 1000 }),
  body('messageType').optional().isIn(['text', 'image', 'emoji', 'gif'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { matchId } = req.params;
    const { content, messageType, replyTo, attachments } = req.body;

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status !== 'mutual_like') {
      return res.status(403).json({ message: 'Can only message mutual matches' });
    }

    if (match.user1.toString() !== req.user.id.toString() && 
        match.user2.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Determine receiver
    const receiverId = match.user1.toString() === req.user.id.toString() 
      ? match.user2 
      : match.user1;

    // Create message
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      match: matchId,
      content,
      messageType: messageType || 'text',
      attachments: attachments || [],
      replyTo: replyTo || null
    });

    await message.save();

    // Update match last interaction and conversation started
    match.lastInteraction = new Date();
    match.conversationStarted = true;
    await match.save();

    // Populate sender info
    await message.populate('sender', 'firstName lastName profileImage');
    if (message.replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Emit socket event for real-time messaging
    const { io } = require('../server');
    io.to(receiverId.toString()).emit('receive-message', {
      message,
      matchId
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiver.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.markAsRead();

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Can only delete your own messages' });
    }

    await message.softDelete();

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false,
      isDeleted: false
    });

    res.json({ count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;