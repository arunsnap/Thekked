const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");


const productRoutes = require("./routes/products");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));
app.use("/api/products", productRoutes);

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

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
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
app.post("/api/products", async (req, res) => {
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
