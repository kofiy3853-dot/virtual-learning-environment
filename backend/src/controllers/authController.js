const User = require('../models/User');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  let { name, email, password, department, role } = req.body;

  // Security: Prevent registration as admin
  if (role === 'admin') {
    role = 'student';
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`[AUTH] Registration failed: Email already exists: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in instead.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      department,
    });

    logger.info(`[AUTH] Registration successful: ${email} (${user.role})`);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error(`[AUTH] Registration error:`, error);
    
    // Handle duplicate key error (in case of race condition)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: messages
      });
    }
    
    throw error;
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, mfaToken } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password +twoFactorSecret +isTwoFactorEnabled');

    if (!user) {
      logger.warn(`[AUTH] Login failed: User not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Prevent Google users from logging in manually (they don't know their random password)
    if (user.authProvider === 'google') {
      logger.warn(`[AUTH] Login failed: Google user attempting password login: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'This account was created using Google Sign-In. Please click the Google button to log in.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      logger.warn(`[AUTH] Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check 2FA
    if (user.isTwoFactorEnabled) {
      if (!mfaToken) {
        return res.status(200).json({
          success: true,
          require2FA: true,
          message: 'Two-factor authentication required',
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: mfaToken,
      });

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication code',
        });
      }
    }

    logger.info(`[AUTH] Login successful: ${email} (${user.role})`);
    
    // Update lastLogin without triggering pre-save hooks
    await User.findByIdAndUpdate(user._id, { lastLogin: Date.now() });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`[AUTH] Login error for ${req.body?.email || 'unknown'}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during login',
    });
  }
};

// @desc    Generate 2FA Secret
// @route   POST /api/auth/2fa/generate
// @access  Private
exports.generate2FA = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  const secret = speakeasy.generateSecret({
    name: `UniLearn (${user.email})`
  });

  user.twoFactorSecret = secret.base32;
  await user.save({ validateBeforeSave: false });

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to generate QR code' });
    }
    res.status(200).json({
      success: true,
      qrCodeUrl: data_url,
      secret: secret.base32,
    });
  });
};

// @desc    Verify and Enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
exports.verify2FA = async (req, res, next) => {
  const { mfaToken } = req.body;
  
  const user = await User.findById(req.user.id).select('+twoFactorSecret');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: mfaToken,
  });

  if (verified) {
    user.isTwoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Two-factor authentication enabled' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid token' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // We return success even if not found to prevent email enumeration
    return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;
  logger.info(`[AUTH] Password reset requested for ${user.email}. URL: ${resetUrl}`);

  // Send real email via SMTP
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">UniLearn</h1>
        </div>
        <div style="background: #f8f9fa; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">Hi ${user.name},</p>
          <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">Or copy this link: <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a></p>
          <p style="color: #999; font-size: 12px; line-height: 1.6;">This link expires in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your UniLearn Password',
      text: `Password Reset Request\n\nHi ${user.name},\n\nClick here to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
      html,
    });
  } catch (err) {
    logger.error(`[AUTH] Failed to send password reset email to ${user.email}: ${err.message}`);
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
    // dev only token exposure for testing
    ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
  });
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
};

// @desc    Update user details
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  // Strip email — changing email requires re-verification (security)
  const fieldsToUpdate = {};
  if (req.body.name)       fieldsToUpdate.name       = req.body.name;
  if (req.body.department) fieldsToUpdate.department = req.body.department;
  if (req.body.avatar)     fieldsToUpdate.avatar     = req.body.avatar;

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
};

// @desc    Change password (requires current password)
// @route   PATCH /api/auth/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user.id).select('+password');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save(); // triggers pre-save hash

  sendTokenResponse(user, 200, res);
};

// @desc    Logout user — clears the HttpOnly token cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 0, // Immediately expire
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// Get token from model, set HttpOnly cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,                                      // Not accessible via document.cookie — XSS safe
    secure: isProduction,                                // true in production (HTTPS), false in dev
    sameSite: isProduction ? 'none' : 'lax',             // 'none' for cross-domain in prod, 'lax' for dev
    maxAge: 7 * 24 * 60 * 60 * 1000,                    // 7 days in ms
  };

  const userData = user.toObject();
  delete userData.password;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token, // Also returned in body for clients that prefer header-based auth
      data: userData,
    });
};

// @desc    Login or Register user with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  const { token, role, department } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a Google ID token',
    });
  }

  try {
    // 1. Verify token with Google's tokeninfo API
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const { email, name, email_verified, picture, aud } = googleRes.data;

    // Security: Verify audience to ensure the token was issued for our app
    const allowedClients = [process.env.GOOGLE_CLIENT_ID];
    const tokenAudiences = Array.isArray(aud) ? aud : [aud];
    
    const hasValidAudience = tokenAudiences.some(a => allowedClients.includes(a));

    if (!hasValidAudience) {
      return res.status(401).json({
        success: false,
        message: 'Token audience mismatch',
      });
    }

    if (!email_verified || email_verified === 'false') {
      return res.status(400).json({
        success: false,
        message: 'Google email is not verified',
      });
    }

    // 2. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 3. User does not exist, so register them!
      let resolvedRole = role || 'student';
      // Security: Prevent registration as admin via Google Sign-In
      if (resolvedRole === 'admin') {
        resolvedRole = 'student';
      }

      // Generate a random secure password so mongoose validation succeeds
      const randomPassword = crypto.randomBytes(16).toString('hex');

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        role: resolvedRole,
        department: department || 'General',
        avatar: picture || 'no-photo.jpg',
        authProvider: 'google',
      });
    }

    // 4. Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error('[Google OAuth Error]', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid Google token or OAuth error',
    });
  }
};
