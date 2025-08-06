const express = require('express');
const Match = require('../models/Match');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/matches/discover
// @desc    Get potential matches for user
// @access  Private
router.get('/discover', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get current user's profile and preferences
    const currentUser = await User.findById(req.user.id);
    const currentProfile = await Profile.findOne({ user: req.user.id });

    if (!currentProfile || !currentProfile.isProfileComplete) {
      return res.status(400).json({ 
        message: 'Please complete your profile to discover matches' 
      });
    }

    // Build match criteria based on user preferences
    const matchCriteria = {
      user: { $ne: req.user.id },
      isProfileComplete: true
    };

    // Age preference
    if (currentUser.preferences.ageRange) {
      const currentYear = new Date().getFullYear();
      const minBirthYear = currentYear - currentUser.preferences.ageRange.max;
      const maxBirthYear = currentYear - currentUser.preferences.ageRange.min;
      
      matchCriteria['user.dateOfBirth'] = {
        $gte: new Date(minBirthYear, 0, 1),
        $lte: new Date(maxBirthYear, 11, 31)
      };
    }

    // Get users that haven't been matched yet
    const existingMatches = await Match.find({
      $or: [
        { user1: req.user.id },
        { user2: req.user.id }
      ]
    }).select('user1 user2');

    const matchedUserIds = existingMatches.reduce((acc, match) => {
      if (match.user1.toString() !== req.user.id.toString()) {
        acc.push(match.user1);
      }
      if (match.user2.toString() !== req.user.id.toString()) {
        acc.push(match.user2);
      }
      return acc;
    }, []);

    // Exclude blocked users and already matched users
    const excludeUsers = [
      ...currentUser.blockedUsers,
      ...matchedUserIds,
      req.user.id
    ];

    // Find potential matches
    const potentialMatches = await Profile.find({
      user: { $nin: excludeUsers },
      isProfileComplete: true
    })
    .populate({
      path: 'user',
      select: 'firstName lastName dateOfBirth gender profileImage lastActive blockedUsers',
      match: { 
        isActive: true,
        blockedUsers: { $ne: req.user.id }
      }
    })
    .limit(limit * 3); // Get more to filter and calculate compatibility

    // Calculate compatibility scores and filter
    const matchesWithScores = [];

    for (const profile of potentialMatches) {
      if (!profile.user) continue; // Skip if user doesn't match criteria

      // Check gender preference
      if (currentUser.preferences.genderPreference !== 'both' &&
          profile.user.gender !== currentUser.preferences.genderPreference) {
        continue;
      }

      // Calculate compatibility score
      const compatibilityScore = Match.calculateCompatibility(
        currentProfile, 
        profile, 
        currentUser, 
        profile.user
      );

      if (compatibilityScore >= 30) { // Minimum compatibility threshold
        matchesWithScores.push({
          profile,
          compatibilityScore
        });
      }
    }

    // Sort by compatibility score
    matchesWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Limit results
    const finalMatches = matchesWithScores
      .slice(skip, skip + limit)
      .map(match => ({
        ...match.profile.toObject(),
        compatibilityScore: match.compatibilityScore
      }));

    res.json({
      matches: finalMatches,
      pagination: {
        page,
        limit,
        total: matchesWithScores.length,
        pages: Math.ceil(matchesWithScores.length / limit)
      }
    });

  } catch (error) {
    console.error('Discover matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/matches/:profileId/action
// @desc    Like or pass on a profile
// @access  Private
router.post('/:profileId/action', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'like', 'pass', 'super_like'
    const { profileId } = req.params;

    if (!['like', 'pass', 'super_like'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Get the target profile
    const targetProfile = await Profile.findById(profileId).populate('user');
    if (!targetProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const targetUserId = targetProfile.user._id;

    if (targetUserId.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'Cannot perform action on yourself' });
    }

    // Check if match already exists
    let match = await Match.findOne({
      $or: [
        { user1: req.user.id, user2: targetUserId },
        { user1: targetUserId, user2: req.user.id }
      ]
    });

    if (match) {
      // Update existing match
      if (match.user1.toString() === req.user.id.toString()) {
        match.user1Action = action;
      } else {
        match.user2Action = action;
      }
    } else {
      // Create new match
      const currentProfile = await Profile.findOne({ user: req.user.id });
      const currentUser = await User.findById(req.user.id);

      const compatibilityScore = Match.calculateCompatibility(
        currentProfile,
        targetProfile,
        currentUser,
        targetProfile.user
      );

      match = new Match({
        user1: req.user.id,
        user2: targetUserId,
        compatibilityScore,
        user1Action: action,
        user2Action: 'none'
      });
    }

    // Update match status
    match.updateStatus();
    await match.save();

    const isMatch = match.status === 'mutual_like';

    res.json({
      message: action === 'like' ? 'Profile liked' : 
               action === 'super_like' ? 'Profile super liked' : 'Profile passed',
      isMatch,
      matchId: isMatch ? match._id : null
    });

  } catch (error) {
    console.error('Match action error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/matches/mutual
// @desc    Get mutual matches
// @access  Private
router.get('/mutual', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      $or: [
        { user1: req.user.id },
        { user2: req.user.id }
      ],
      status: 'mutual_like'
    })
    .populate({
      path: 'user1 user2',
      select: 'firstName lastName profileImage lastActive',
      populate: {
        path: 'profile',
        model: 'Profile',
        select: 'photos location.city bio'
      }
    })
    .sort({ matchedAt: -1 })
    .skip(skip)
    .limit(limit);

    // Format matches to show the other user
    const formattedMatches = matches.map(match => {
      const otherUser = match.user1._id.toString() === req.user.id.toString() 
        ? match.user2 
        : match.user1;
      
      return {
        matchId: match._id,
        user: otherUser,
        compatibilityScore: match.compatibilityScore,
        matchedAt: match.matchedAt,
        lastInteraction: match.lastInteraction,
        conversationStarted: match.conversationStarted
      };
    });

    res.json({
      matches: formattedMatches,
      pagination: {
        page,
        limit,
        hasMore: matches.length === limit
      }
    });

  } catch (error) {
    console.error('Get mutual matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/matches/likes
// @desc    Get users who liked me
// @access  Private
router.get('/likes', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [
        { user1: req.user.id, user2Action: { $in: ['like', 'super_like'] } },
        { user2: req.user.id, user1Action: { $in: ['like', 'super_like'] } }
      ],
      status: { $ne: 'mutual_like' }
    })
    .populate({
      path: 'user1 user2',
      select: 'firstName lastName profileImage',
      populate: {
        path: 'profile',
        model: 'Profile',
        select: 'photos location.city'
      }
    })
    .sort({ lastInteraction: -1 });

    // Format to show users who liked me
    const likes = matches.map(match => {
      const likedByUser = match.user1._id.toString() === req.user.id.toString()
        ? (match.user2Action !== 'none' ? match.user2 : null)
        : (match.user1Action !== 'none' ? match.user1 : null);
      
      if (!likedByUser) return null;

      const actionType = match.user1._id.toString() === req.user.id.toString()
        ? match.user2Action
        : match.user1Action;

      return {
        matchId: match._id,
        user: likedByUser,
        actionType,
        compatibilityScore: match.compatibilityScore,
        likedAt: match.lastInteraction
      };
    }).filter(Boolean);

    res.json(likes);

  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;