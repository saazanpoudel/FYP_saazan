require('./config/dns');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');

const testIronclad = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const bookingWithGuide = await Booking.findOne({ guide: { $exists: true } });
        if (!bookingWithGuide) {
            console.log('No bookings with guides found');
            process.exit(0);
        }

        const guideId = bookingWithGuide.guide;
        console.log('Testing IRONCLAD for guide:', guideId);

        const financialSummary = await Transaction.aggregate([
            { $match: { user: guideId } },
            {
              $facet: {
                wallet: [
                  {
                    $group: {
                      _id: null,
                      balance: {
                        $sum: {
                          $cond: [{ $eq: ["$type", "credit"] }, "$amount", { $multiply: ["$amount", -1] }]
                        }
                      },
                      gross: {
                        $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] }
                      }
                    }
                  }
                ],
                monthly: [
                  {
                    $match: {
                      type: 'credit',
                      createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                    }
                  },
                  {
                    $group: {
                      _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                      total: { $sum: "$amount" }
                    }
                  },
                  { $sort: { "_id.year": 1, "_id.month": 1 } }
                ],
                history: [
                  { $sort: { createdAt: -1 } },
                  { $limit: 10 },
                  {
                    $lookup: {
                      from: 'bookings',
                      localField: 'booking',
                      foreignField: '_id',
                      as: 'bookingDetails'
                    }
                  },
                  { $unwind: { path: "$bookingDetails", preserveNullAndEmptyArrays: true } }
                ]
              }
            }
        ]);

        console.log('IRONCLAD Result:', JSON.stringify(financialSummary, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('DIAG_ERROR:', err);
        process.exit(1);
    }
};

testIronclad();
