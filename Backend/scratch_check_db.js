const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Transaction = require('./models/Transaction');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const txns = await Transaction.find({});
  console.log(`Found ${txns.length} total transactions in DB.`);
  
  if (txns.length > 0) {
    console.log("First 3 transactions:");
    txns.slice(0, 3).forEach((t, i) => {
      console.log(`${i+1}: User=${t.user}, Type=${t.type}, Amount=${t.amount}, Category=${t.category}, Mode="${t.mode}", Date=${t.date}`);
    });
    
    // Perform Mode grouping calculation
    const modeMap = {};
    txns.forEach(t => {
      const mode = t.mode ? t.mode.trim().toLowerCase() : 'cash';
      if (!modeMap[mode]) modeMap[mode] = { income: 0, expense: 0 };
      modeMap[mode][t.type] += t.amount;
    });
    console.log("Mode grouping calculation on all database transactions:");
    console.log(modeMap);
  } else {
    console.log("No transactions found in DB!");
  }

  await mongoose.disconnect();
}

check().catch(console.error);
