const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Same admin check used across the app
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "Token missing" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "shop-products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1600, height: 1600, crop: "limit" }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"));
        }
        cb(null, true);
    }
});

// ===============================
// UPLOAD PRODUCT IMAGE (admin only)
// ===============================
router.post("/", authenticateAdmin, upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }

        // multer-storage-cloudinary puts the hosted URL in req.file.path
        // and the Cloudinary public_id in req.file.filename
        res.json({
            success: true,
            url: req.file.path,
            publicId: req.file.filename
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || "Image upload failed" });
    }
});

// Multer errors (e.g. file too large) land here instead of the normal handler above
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        console.error(err);
        return res.status(400).json({ success: false, message: err.message || "Upload failed" });
    }
    next();
});

module.exports = router;
