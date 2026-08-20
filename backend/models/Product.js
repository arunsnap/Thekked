const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        brand: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        retailPrice: { type: Number, min: 0 },
        era: { type: String, default: "" },
        condition: { type: String, default: "" },
        conditionDetails: { type: String, default: "" },
        size: { type: String, default: "" },
        measurements: {
            chest: { type: String, default: "" },
            length: { type: String, default: "" },
            sleeve: { type: String, default: "" }
        },
        fabric: { type: String, default: "" },
        image: { type: String, required: true },
        imagePublicId: { type: String, default: "" },
        category: { type: String, default: "" },
        description: { type: String, required: true },
        isNewArrival: { type: Boolean, default: true },
        // 1-of-1 item: once sold it's gone for good
        isSold: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
