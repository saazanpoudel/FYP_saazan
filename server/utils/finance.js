const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

/**
 * Records a financial transaction and updates the guide's wallet balance atomically.
 * @param {Object} params - Transaction parameters
 * @param {string} params.userId - The ID of the guide
 * @param {string} params.bookingId - Associated booking ID (optional)
 * @param {number} params.amount - Amount (positive)
 * @param {'credit'|'debit'} params.type - Type of transaction
 * @param {string} params.category - category of transaction
 * @param {string} params.description - Human-readable description
 * @param {Object} params.metadata - Additional metadata
 */
exports.recordTransaction = async ({ userId, bookingId, amount, type, category, description, metadata = {} }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Create Transaction Record
        const transaction = await Transaction.create([{
            user: userId,
            booking: bookingId,
            amount,
            type,
            category,
            description,
            metadata,
            createdAt: new Date()
        }], { session });

        await session.commitTransaction();
        return transaction[0];
    } catch (error) {
        await session.abortTransaction();
        console.error('FINANCE_UTILS_ERROR:', error);
        throw error;
    } finally {
        session.endSession();
    }
};
