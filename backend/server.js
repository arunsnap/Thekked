const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const productRoutes = require("./routes/products");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// MongoDB Connection
// ===============================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


// ===============================
// Admin Authentication
// ===============================

function authenticateAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token missing"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }
}


// ===============================
// Admin Login
// ===============================

app.post("/api/admin/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        if (
            username !== process.env.ADMIN_USERNAME ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            {
                username: username,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.json({
            success: true,
            token: token
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });

    }

});


// ===============================
// Product Routes
// ===============================

app.use("/api/products", productRoutes);


// ===============================
// Website
// ===============================

app.use(express.static(path.join(__dirname, "..")));


// Home page
app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "..", "index.html")
    );

});


// Admin page
app.get("/admin.html", (req, res) => {

    res.sendFile(
        path.join(__dirname, "..", "admin.html")
    );

});


// ===============================
// Test API
// ===============================

app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "API connection working!"
    });

});


// ===============================
// Server
// ===============================

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(`Server running on port ${PORT}`);

});
