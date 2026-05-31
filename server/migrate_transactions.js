require('./config/dns');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
const Package = require('./models/Package');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');

const syncTransactions = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for migration');

        // Find all paid bookings
        const paidBookings = await Booking.find({ paymentStatus: 'paid' }).populate('package');
        console.log(`Found ${paidBookings.length} paid bookings to sync.`);

        let syncedCount = 0;
        let skippedCount = 0;

        for (const booking of paidBookings) {
            // Check if transaction already exists for this booking
            const existingTx = await Transaction.findOne({ booking: booking._id, category: 'booking_payment' });
            
            if (existingTx) {
                skippedCount++;
                continue;
            }

            // Calculate net yield
            const netYield = booking.totalAmount - (booking.commission !== undefined ? booking.commission : (booking.totalAmount * 0.1));

            // Create Transaction
            await Transaction.create({
                user: booking.guide,
                booking: booking._id,
                amount: netYield,
                type: 'credit',
                category: 'booking_payment',
                description: `Historical migration: Payment for ${booking.package?.title || 'Trek'}`,
                createdAt: booking.updatedAt || booking.createdAt
            });

            // Ensure guide's walletBalance is up to date (this might double count if not careful, 
            // but we're starting fresh with Transaction sum anyway in the dashboard soon)
            // Actually, we'll just sync the Transactions and let the dashboard sum them up.
            
            syncedCount++;
        }

        console.log(`Migration complete. Synced: ${syncedCount}, Skipped: ${skippedCount}`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

syncTransactions();
