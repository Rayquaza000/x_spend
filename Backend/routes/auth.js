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
    email: req.user.email
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
    res.json({ _id: user._id, username: user.username, email: user.email });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }
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

module.exports = router;
