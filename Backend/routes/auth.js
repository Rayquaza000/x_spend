const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with that email or username' });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      dashboardStartDate: user.dashboardStartDate,
      dashboardEndDate: user.dashboardEndDate,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      dashboardStartDate: user.dashboardStartDate,
      dashboardEndDate: user.dashboardEndDate,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    dashboardStartDate: req.user.dashboardStartDate,
    dashboardEndDate: req.user.dashboardEndDate
  });
});

// PUT /api/auth/profile — update username/email
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user._id);

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      dashboardStartDate: user.dashboardStartDate,
      dashboardEndDate: user.dashboardEndDate
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/dashboard-dates — update dashboard start and end dates
router.put('/dashboard-dates', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const user = await User.findById(req.user._id);

    if (startDate) user.dashboardStartDate = startDate;
    if (endDate) user.dashboardEndDate = endDate;

    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      dashboardStartDate: user.dashboardStartDate,
      dashboardEndDate: user.dashboardEndDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/password — change password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/auth/account — delete account and all transactions
router.delete('/account', protect, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/modes
router.get('/modes', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.customModes || []);
});

// POST /api/auth/modes
router.post('/modes', protect, async (req, res) => {
  const { mode } = req.body;
  if (!mode || !mode.trim()) return res.status(400).json({ message: 'Mode is required' });
  const user = await User.findById(req.user._id);
  const trimmed = mode.trim().toLowerCase();
  if (!user.customModes.includes(trimmed)) {
    user.customModes.push(trimmed);
    await user.save();
  }
  res.json(user.customModes);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address' });
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Log the OTP code prominently in console for local testing
    console.log('\n==========================================');
    console.log(`[SECURITY] PASSWORD RESET CODE FOR: ${email}`);
    console.log(`CODE: ${code} (Expires in 10 minutes)`);
    console.log('==========================================\n');

    res.json({ message: 'Reset code printed to server console for testing' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordCode: code.trim(),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
