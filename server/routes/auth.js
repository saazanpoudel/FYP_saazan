const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const { createNotification } = require('../utils/notify');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Group = require('../models/Group');
const ForumPost = require('../models/ForumPost');
const nodemailer = require('nodemailer');

const isEmailConfigured = () => process.env.EMAIL_ENABLED === 'true';

const sendResetEmail = async (toEmail, resetUrl) => {
  if (isEmailConfigured()) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,          // STARTTLS on port 587
      requireTLS: true,       // Gmail requires TLS upgrade
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Must be a Gmail App Password, not your login password
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"Himalayan SGMS" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Password Reset Request — Himalayan SGMS',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px">
          <h2 style="color:#dc2626;margin-bottom:8px">Reset Your Password</h2>
          <p style="color:#64748b">You requested a password reset for your Himalayan SGMS account.</p>
          <p style="color:#64748b">Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#dc2626;color:#fff;border-radius:999px;font-weight:700;text-decoration:none">Reset Password</a>
          <p style="color:#94a3b8;font-size:12px">If you didn't request this, ignore this email — your password won't change.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
          <p style="color:#94a3b8;font-size:11px">Himalayan Smart Guide Management System</p>
        </div>
      `,
    });
  } else {
    // Dev fallback — print to server console when SMTP is not yet configured
    console.log('\n========== PASSWORD RESET LINK (SMTP not configured) ==========');
    console.log(`To:    ${toEmail}`);
    console.log(`Link:  ${resetUrl}`);
    console.log('================================================================\n');
  }
};

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
        return res.status(404).json({
          success: false,
          code: 'NOT_REGISTERED',
          message: 'No account found with this email. Please register first.',
        });
      }

      // Google-only account — no password set
      if (user.googleId && !user.password) {
        return res.status(400).json({
          success: false,
          code: 'GOOGLE_ACCOUNT',
          message: 'This account uses Google Sign-In. Please log in with Google instead.',
        });
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          code: 'WRONG_PASSWORD',
          message: 'Incorrect password. Please try again.',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      // Notify user about new login
      const device = req.headers['user-agent']?.split(')')[0]?.split('(')[1] || 'Unknown Device';
      await createNotification(req.app, {
        recipient: user._id,
        type: 'system',
        title: 'Security Alert: New Login',
        message: `New login detected from ${req.ip}. Device: ${device.substring(0, 30)}...`,
        extraData: { ip: req.ip, device }
      });

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

// @route   GET /api/auth/export
// @desc    Export all user data
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, bookings, notifications, groups, posts] = await Promise.all([
      User.findById(userId).lean(),
      Booking.find({ $or: [{ tourist: userId }, { guide: userId }] }).populate('package guide', 'title name').lean(),
      Notification.find({ recipient: userId }).sort({ createdAt: -1 }).lean(),
      Group.find({ 'members.user': userId }).populate('members.user', 'name avatar').lean(),
      ForumPost.find({ author: userId }).lean()
    ]);

    const exportData = {
      profile: user,
      activity: {
        bookings,
        notifications,
        groups,
        posts
      },
      exportedAt: new Date().toISOString(),
      disclaimer: "This document contains all your personal data stored on Himalayan SGMS as of the export date."
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate data export',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile data
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id);

    // Handle profile fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    
    // Handle preferences and emergency contacts for all roles
    if (preferences) {
      if (!user.preferences) user.preferences = {};
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
        // 3. New User - Require Role Selection
        return res.json({
          success: true,
          registerRequired: true,
          profile: { name, email, googleId, picture }
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Notify user about new login
    const device = req.headers['user-agent']?.split(')')[0]?.split('(')[1] || 'Unknown Device';
    await createNotification(req.app, {
      recipient: user._id,
      type: 'system',
      title: 'Security Alert: New Login (Google)',
      message: `Successfully signed in via Google from ${req.ip}. Device: ${device.substring(0, 30)}...`,
      extraData: { ip: req.ip, device }
    });

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
        // 3. New User - Require Role Selection
        return res.json({
          success: true,
          registerRequired: true,
          profile: { name, email, googleId, picture }
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Notify user about new login
    const device = req.headers['user-agent']?.split(')')[0]?.split('(')[1] || 'Unknown Device';
    await createNotification(req.app, {
      recipient: user._id,
      type: 'system',
      title: 'Security Alert: New Login (Google)',
      message: `Successfully signed in via Google from ${req.ip}. Device: ${device.substring(0, 30)}...`,
      extraData: { ip: req.ip, device }
    });

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

// @route   POST /api/auth/google-finalize
// @desc    Finalize Google Registration with Role
// @access  Public
router.post('/google-finalize', async (req, res) => {
  const { name, email, googleId, picture, role } = req.body;

  if (!role || !['tourist', 'guide'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Valid role is required' });
  }

  try {
    // Check if user already exists (just in case)
    let user = await User.findOne({ email });
    if (user) {
       return res.status(400).json({ success: false, message: 'User already exists' });
    }

    user = await User.create({
      name,
      email,
      googleId,
      role,
      avatar: picture,
      isVerified: true,
    });

    const token = generateToken(user._id);

    // Initial Registration Notification
    await createNotification(req.app, {
      recipient: user._id,
      type: 'system',
      title: 'Welcome to SGMS!',
      message: `Welcome ${name}! Your account as a ${role} has been successfully created.`,
      extraData: { role }
    });

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
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset link
// @access  Public
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });

      // Always return the same message to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a reset link has been sent.',
        });
      }

      // Google-only accounts have no password to reset
      if (user.googleId && !user.password) {
        return res.status(400).json({
          success: false,
          message: 'This account uses Google Sign-In. Please log in with Google — no password reset is needed.',
        });
      }

      // Generate a random token, store its SHA-256 hash on the user
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

      try {
        await sendResetEmail(user.email, resetUrl);
      } catch (emailErr) {
        // Roll back token if email send fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
      }

      // Only expose the reset URL on screen when email is NOT configured (dev fallback)
      res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
        ...(!isEmailConfigured() && { devResetUrl: resetUrl }),
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using the token from email
// @access  Public
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Hash the incoming raw token and look it up
      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      }).select('+resetPasswordToken +resetPasswordExpire');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'This reset link is invalid or has expired. Please request a new one.',
        });
      }

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successful. You can now log in with your new password.',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

