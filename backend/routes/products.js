const express = require("express");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

const router = express.Router();


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
// GET ALL PRODUCTS
// ===============================

router.get("/", async (req, res) => {

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


// ===============================
// GET ONE PRODUCT
// ===============================

router.get("/:id", async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }

        res.json({
            success: true,
            product: product
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to get product"
        });

    }

});


// ===============================
// ADD PRODUCT
// ===============================

router.post("/", authenticateAdmin, async (req, res) => {

    try {

        const product = new Product(req.body);

        const savedProduct = await product.save();

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


module.exports = router;
