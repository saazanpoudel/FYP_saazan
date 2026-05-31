require('./config/dns');
const mongoose = require('mongoose');
require('dotenv').config();

// Simple mock for Booking and User if needed, or just connect and try aggregation
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp';

async function test() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        
        const Booking = mongoose.model('Booking', new mongoose.Schema({
            guide: mongoose.Schema.Types.ObjectId,
            totalAmount: Number,
            commission: Number,
            status: String,
            paymentStatus: String,
            createdAt: Date
        }));

        const User = mongoose.model('User', new mongoose.Schema({
            role: String,
            guideProfile: {
                earnings: Number
            }
        }));

        const guide = await User.findOne({ role: 'guide' });
        if (!guide) {
            console.log('No guide found');
            return;
        }

        const guideId = guide._id;
        console.log('Testing aggregation for guide:', guideId);

        const earnings = await Booking.aggregate([
            { 
                $match: { 
                    guide: guideId, 
                    status: { $in: ['confirmed', 'completed'] },
                    paymentStatus: 'paid'
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    gross: { $sum: '$totalAmount' },
                    net: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } } 
                } 
            },
        ]);

        console.log('Earnings Result:', earnings);
        
        process.exit(0);
    } catch (err) {
        console.error('Aggregation Failed:', err);
        process.exit(1);
    }
}

test();
