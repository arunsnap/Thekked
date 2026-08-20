const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

function signUserToken(user) {
    return jwt.sign(
        { id: user._id, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// ===============================
// REGISTER
// ===============================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ success: false, message: "An account with this email already exists" });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = signUserToken(user);

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Registration failed" });
    }
});

// ===============================
// LOGIN
// ===============================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = signUserToken(user);

        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

// ===============================
// CURRENT USER
// ===============================
router.get("/me", authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
});

module.exports = router;
