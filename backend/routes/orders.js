const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ===============================
// CREATE RAZORPAY ORDER
// Body: { productIds: [ "..." ] }
// ===============================
router.post("/create", authenticateUser, async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ success: false, message: "No items provided" });
        }

        const products = await Product.find({ _id: { $in: productIds } });

        if (products.length !== productIds.length) {
            return res.status(404).json({ success: false, message: "One or more items could not be found" });
        }

        const alreadySold = products.filter(p => p.isSold);
        if (alreadySold.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Sorry, "${alreadySold[0].title}" was just sold to another collector.`
            });
        }

        const totalAmount = products.reduce((sum, p) => sum + p.price, 0);

        // Razorpay expects amount in the smallest currency unit (paise for INR)
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        });

        const order = new Order({
            user: req.userId,
            items: products.map(p => ({
                product: p._id,
                title: p.title,
                price: p.price,
                image: p.image
            })),
            totalAmount,
            status: "created",
            razorpayOrderId: razorpayOrder.id
        });
        await order.save();

        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            internalOrderId: order._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
});

// ===============================
// VERIFY PAYMENT
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress }
// ===============================
router.post("/verify", authenticateUser, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment verification fields" });
        }

        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, user: req.userId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            order.status = "failed";
            await order.save();
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        order.status = "paid";
        order.razorpayPaymentId = razorpay_payment_id;
        if (shippingAddress) order.shippingAddress = shippingAddress;
        await order.save();

        // Lock each item as sold — this is what makes them 1-of-1
        const productIds = order.items.map(i => i.product);
        await Product.updateMany({ _id: { $in: productIds } }, { $set: { isSold: true } });

        res.json({ success: true, message: "Payment verified, order confirmed", order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Payment verification failed" });
    }
});

// ===============================
// MY ORDERS
// ===============================
router.get("/my", authenticateUser, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
});

module.exports = router;
