const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

let client;
if (process.env.GOOGLE_CLIENT_ID) {
  client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
} else {
  console.warn('GOOGLE_CLIENT_ID is missing. Google Login will not work.');
}

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['tourist', 'guide'])
      .withMessage('Role must be either tourist or guide'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const { name, email, password, role, phone } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    try {
      const { email, password } = req.body;

      // Check if user exists and get password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile data
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    
    // Handle tourist specific preferences
    if (preferences && user.role === 'tourist') {
      if (preferences.languages) user.preferences.languages = preferences.languages;
      if (preferences.interests) user.preferences.interests = preferences.interests;
      if (preferences.emergencyContacts) user.preferences.emergencyContacts = preferences.emergencyContacts;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PUT /api/auth/become-guide
// @desc    Upgrade tourist to guide role
// @access  Private (Tourist only)
router.put('/become-guide', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role !== 'tourist') {
      return res.status(400).json({
        success: false,
        message: 'Only tourists can upgrade to guide role',
      });
    }

    user.role = 'guide';
    // Initialize guide profile if it doesn't exist
    if (!user.guideProfile) {
      user.guideProfile = {
        rating: 0,
        totalRatings: 0,
        governmentIdVerified: false,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Successfully upgraded to guide! Redirecting to profile setup...',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/google
// @desc    Google Login with ID Token
// @access  Public
router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'ID Token is required',
    });
  }

  if (!client) {
    return res.status(500).json({
      success: false,
      message: 'Google Login is not configured on the server',
    });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // 1. Try to find user by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // 2. Try to find user by email
      user = await User.findOne({ email });

      if (user) {
        user.googleId = googleId;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      } else {
        // 3. Create new user
        user = await User.create({
          name,
          email,
          googleId,
          role: 'tourist',
          avatar: picture,
          isVerified: true,
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(400).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/google-access-token
// @desc    Google Login with Access Token (for custom buttons)
// @access  Public
router.post('/google-access-token', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Access Token is required',
    });
  }

  try {
    // Fetch user info from Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const payload = await response.json();

    if (!payload.email) {
      throw new Error('Invalid access token');
    }

    const { sub: googleId, email, name, picture } = payload;

    // 1. Try to find user by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // 2. Try to find user by email
      user = await User.findOne({ email });

      if (user) {
        user.googleId = googleId;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      } else {
        // 3. Create new user
        user = await User.create({
          name,
          email,
          googleId,
          role: 'tourist',
          avatar: picture,
          isVerified: true,
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Google Access Token Error:', error);
    res.status(400).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message,
    });
  }
});

module.exports = router;

