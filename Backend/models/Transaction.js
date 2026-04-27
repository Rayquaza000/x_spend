const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  mode: {
    type: String,
    default: 'cash',
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  balance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for search
transactionSchema.index({ category: 'text', description: 'text', mode: 'text' });

module.exports = mongoose.model('Transaction', transactionSchema);
