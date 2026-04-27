const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// GET /api/summary?startDate=&endDate=
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { user: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const transactions = await Transaction.find(query);

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryMap = {};
    transactions.forEach(t => {
      if (!categoryMap[t.category]) categoryMap[t.category] = { income: 0, expense: 0 };
      categoryMap[t.category][t.type] += t.amount;
    });

    // Monthly breakdown
    const monthlyMap = {};
    transactions.forEach(t => {
      const key = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0, month: key };
      monthlyMap[key][t.type] += t.amount;
    });

    res.json({
      income,
      expense,
      balance: income - expense,
      categoryBreakdown: Object.entries(categoryMap).map(([cat, vals]) => ({
        category: cat,
        ...vals
      })),
      monthlyBreakdown: Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
