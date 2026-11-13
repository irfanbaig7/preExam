const { Schema, model } = require('mongoose');

const paymentSchema = new Schema(
    {
        orderId: { type: String, required: true, unique: true }, // Razorpay order id, one row per order
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        amountPaise: { type: Number, required: true },
        status: { type: String, enum: ['created', 'paid'], default: 'created' },
        paymentId: String,
        paidAt: Date,
    },
    { timestamps: true }
);

module.exports = model('Payment', paymentSchema);