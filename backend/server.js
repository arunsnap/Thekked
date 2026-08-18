const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");


const productRoutes = require("./routes/products");

const app = express();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.admin = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));
app.use("/api/products", productRoutes);

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

// Shopping website
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "index.html")
    );
});


// Admin panel
app.get("/admin.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "admin.html")
    );
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "API connection working!"
    });
});
// Get products
app.get("/api/products", async (req, res) => {
    try {

        const products = await Product.find();

        res.json({
            success: true,
            products: products
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to get products"
        });
    }
});
// Add product
app.post("/api/products", authenticateAdmin, async (req, res) => {
    try {

        const product = new Product(req.body);

        const savedProduct =
            await product.save();

        res.status(201).json({
            success: true,
            product: savedProduct
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add product"
        });
    }
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
