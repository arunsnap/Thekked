const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                title: String,
                price: Number,
                image: String
            }
        ],
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["created", "paid", "failed"],
            default: "created"
        },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        shippingAddress: {
            fullName: String,
            phone: String,
            addressLine: String,
            city: String,
            state: String,
            pincode: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
