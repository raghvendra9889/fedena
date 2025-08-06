const express = require('express');
const { body, validationResult } = require('express-validator');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/profiles/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email profileImage dateOfBirth gender');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profiles/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      profile = new Profile({ user: req.user.id, ...req.body });
    } else {
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          profile[key] = req.body[key];
        }
      });
    }

    // Calculate profile score
    profile.calculateProfileScore();

    await profile.save();

    const updatedProfile = await Profile.findById(profile._id)
      .populate('user', 'firstName lastName email profileImage dateOfBirth gender');

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/profiles/:id
// @desc    Get profile by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('user', 'firstName lastName profileImage dateOfBirth gender lastActive');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if user is blocked
    const currentUser = await User.findById(req.user.id);
    const profileUser = await User.findById(profile.user._id);

    if (currentUser.blockedUsers.includes(profile.user._id) ||
        profileUser.blockedUsers.includes(req.user.id)) {
      return res.status(403).json({ message: 'Profile not accessible' });
    }

    // Add profile view
    if (req.user.id.toString() !== profile.user._id.toString()) {
      const existingView = profile.profileViews.find(
        view => view.user.toString() === req.user.id.toString()
      );

      if (!existingView) {
        profile.profileViews.push({
          user: req.user.id,
          viewedAt: new Date()
        });
        await profile.save();
      }
    }

    res.json(profile);

  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/profiles/photos
// @desc    Add photo to profile
// @access  Private
router.post('/photos', [
  auth,
  body('url').isURL(),
  body('caption').optional().trim().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { url, caption, isMain } = req.body;

    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // If this is set as main photo, unset others
    if (isMain) {
      profile.photos.forEach(photo => {
        photo.isMain = false;
      });
    }

    profile.photos.push({
      url,
      caption: caption || '',
      isMain: isMain || false
    });

    // Recalculate profile score
    profile.calculateProfileScore();

    await profile.save();

    res.json({
      message: 'Photo added successfully',
      photos: profile.photos
    });

  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/profiles/photos/:photoId
// @desc    Remove photo from profile
// @access  Private
router.delete('/photos/:photoId', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.photos = profile.photos.filter(
      photo => photo._id.toString() !== req.params.photoId
    );

    // Recalculate profile score
    profile.calculateProfileScore();

    await profile.save();

    res.json({
      message: 'Photo removed successfully',
      photos: profile.photos
    });

  } catch (error) {
    console.error('Remove photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profiles/photos/:photoId/main
// @desc    Set photo as main
// @access  Private
router.put('/photos/:photoId/main', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Unset all photos as main
    profile.photos.forEach(photo => {
      photo.isMain = false;
    });

    // Set selected photo as main
    const selectedPhoto = profile.photos.find(
      photo => photo._id.toString() === req.params.photoId
    );

    if (!selectedPhoto) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    selectedPhoto.isMain = true;

    await profile.save();

    res.json({
      message: 'Main photo updated successfully',
      photos: profile.photos
    });

  } catch (error) {
    console.error('Set main photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/profiles/views/me
// @desc    Get who viewed my profile
// @access  Private
router.get('/views/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate({
        path: 'profileViews.user',
        select: 'firstName lastName profileImage lastActive',
        populate: {
          path: 'profile',
          model: 'Profile',
          select: 'photos location.city'
        }
      });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Sort by most recent views
    const views = profile.profileViews
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 50); // Limit to last 50 views

    res.json(views);

  } catch (error) {
    console.error('Get profile views error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;