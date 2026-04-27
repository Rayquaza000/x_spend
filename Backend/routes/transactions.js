const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// Helper to recalculate balance for all user transactions
const recalculateBalances = async (userId) => {
  const txns = await Transaction.find({ user: userId }).sort({ date: 1, createdAt: 1 });
  let running = 0;
  for (const t of txns) {
    running += t.type === 'income' ? t.amount : -t.amount;
    t.balance = running;
    await t.save();
  }
};

// GET /api/transactions - with optional search, date filter, type filter, pagination
router.get('/', protect, async (req, res) => {
  try {
    const { search, type, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) query.type = type;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { category: searchRegex },
        { description: searchRegex },
        { mode: searchRegex },
        { type: searchRegex }
      ];
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/transactions/recent - last 5 transactions
router.get('/recent', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/transactions
router.post('/', protect, async (req, res) => {
  try {
    const { type, amount, category, description, mode, date } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be income or expense' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: Number(amount),
      category,
      description: description || '',
      mode: mode || 'cash',
      date: date ? new Date(date) : new Date()
    });

    await recalculateBalances(req.user._id);
    const updated = await Transaction.findById(transaction._id);

    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { type, amount, category, description, mode, date } = req.body;
    if (type) transaction.type = type;
    if (amount) transaction.amount = Number(amount);
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (mode) transaction.mode = mode;
    if (date) transaction.date = new Date(date);

    await transaction.save();
    await recalculateBalances(req.user._id);
    const updated = await Transaction.findById(transaction._id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.deleteOne();
    await recalculateBalances(req.user._id);

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
