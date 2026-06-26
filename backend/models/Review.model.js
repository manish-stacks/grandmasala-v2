const mongoose = require("mongoose");

const Review_Schema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        order: {
            // The order that proves this user actually bought the product.
            // Kept so a user can't review the same purchase twice, and so an
            // admin can trace the review back to a real transaction.
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        name: {
            // Display name snapshot at time of review, so it doesn't change
            // retroactively if the user later edits their profile name.
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        images: [
            {
                url: { type: String },
                public_id: { type: String },
            },
        ],
        isVerifiedPurchase: {
            type: Boolean,
            default: true,
        },
        status: {
            // Admin moderation gate — only "approved" reviews are ever
            // returned by the public-facing getReviewsByProduct endpoint.
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
    },
    { timestamps: true }
);

// A user can only leave one review per product per order — prevents spamming
// the same purchase with multiple reviews.
Review_Schema.index({ product: 1, user: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Review", Review_Schema);