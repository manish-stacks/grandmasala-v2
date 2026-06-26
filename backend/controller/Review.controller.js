const ReviewModel = require("../models/Review.model");
const Order = require("../models/Order.model");
const ProductModel = require("../models/Product.model");
const UserModel = require("../models/User.model");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// Default placeholder reviews — shown on every product page when fewer than
// 2 *real* approved reviews exist yet, so the section never looks empty.
// These are clearly marked isDefault: true on the response so the frontend
// can style/label them differently if desired (e.g. no "Verified" badge).
// Edit the text here to change what shows site-wide.
// ─────────────────────────────────────────────
const DEFAULT_REVIEWS = [
    {
        _id: "default-1",
        name: "Anonymous",
        rating: 5,
        comment: "Pure taste, just like homemade. The aroma hits the moment you open the pack.",
        isVerifiedPurchase: false,
        isDefault: true,
        createdAt: new Date("2026-01-10"),
    },
    {
        _id: "default-2",
        name: "Kajal Mukharjee",
        rating: 5,
        comment: "The taste is very clean and flavorful, and it feels much lighter compared to other brands. It blends instantly and has a pleasant, authentic flavor.",
        isVerifiedPurchase: false,
        isDefault: true,
        createdAt: new Date("2026-01-05"),
    },
];

// GET /get-reviews/:productId
// Public — returns approved reviews for a product, padded with the default
// placeholders if there are fewer than 2 real ones, plus a rating summary.
exports.getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const isObjectId = mongoose.Types.ObjectId.isValid(productId) && /^[0-9a-fA-F]{24}$/.test(productId);
        let product = null;
        if (isObjectId) {
            product = await ProductModel.findById(productId).select("_id").lean();
        } else {
            product = await ProductModel.findOne({ slug: productId }).select("_id").lean();
        }

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const realReviews = await ReviewModel.find({ product: product._id, status: "approved" })
            .sort({ createdAt: -1 })
            .select("name rating comment isVerifiedPurchase createdAt")
            .lean();

        const realReviewsFormatted = realReviews.map((r) => ({ ...r, isDefault: false }));

        // Pad with defaults only enough to reach 2 total, never remove real reviews.
        const needed = Math.max(0, 2 - realReviewsFormatted.length);
        const reviewsToShow = [...realReviewsFormatted, ...DEFAULT_REVIEWS.slice(0, needed)];

        // Rating summary is computed from real reviews only — defaults don't
        // skew the average. If there are no real reviews yet, fall back to a
        // neutral 5-star/0-count-free placeholder summary so the UI still has
        // something sensible to render.
        const totalReal = realReviews.length;
        const avgRating = totalReal > 0
            ? realReviews.reduce((sum, r) => sum + r.rating, 0) / totalReal
            : 5;

        const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
            stars,
            count: realReviews.filter((r) => r.rating === stars).length,
        }));

        res.status(200).json({
            success: true,
            reviews: reviewsToShow,
            summary: {
                average: Number(avgRating.toFixed(2)),
                totalReal,
                breakdown,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching reviews", error: error.message });
    }
};

// POST /add-review/:productId  (protected)
// Body: { rating, comment, orderId }
// Only a user who has an order containing this product can review it.
exports.addReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment, orderId } = req.body;
        const userId = req.user?.id?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Please login to write a review" });
        }

        // JWT only carries { _id, Role } — fetch the display name from the DB.
        const userDoc = await UserModel.findById(userId).select("Name").lean();
        const userName = userDoc?.Name || "Customer";
        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: "Rating and comment are required" });
        }
        if (!orderId) {
            return res.status(400).json({ success: false, message: "orderId is required to verify your purchase" });
        }

        const product = await ProductModel.findById(productId).select("_id").lean();
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Verify the order belongs to this user, is in a state that counts as
        // a real purchase, and actually contains this product.
        const order = await Order.findOne({ _id: orderId, userId }).lean();
        if (!order) {
            return res.status(403).json({ success: false, message: "Order not found for this account" });
        }

        const validStatuses = ["confirmed", "shipped", "delivered"];
        if (!validStatuses.includes(order.status)) {
            return res.status(403).json({ success: false, message: "You can review a product only after your order is confirmed" });
        }

        const purchasedThisProduct = order.items?.some((item) => String(item.productId) === String(product._id));
        if (!purchasedThisProduct) {
            return res.status(403).json({ success: false, message: "You can only review products from your own order" });
        }

        const review = await ReviewModel.create({
            product: product._id,
            user: userId,
            order: order._id,
            name: userName,
            rating,
            comment,
            isVerifiedPurchase: true,
            status: "pending", // admin must approve before this is public
        });

        res.status(201).json({
            success: true,
            message: "Thanks! Your review has been submitted and will appear after admin approval.",
            data: review,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "You've already reviewed this product for this order" });
        }
        res.status(500).json({ success: false, message: "Error submitting review", error: error.message });
    }
};

// GET /get-my-reviewable-orders/:productId  (protected)
// Helper for the frontend: returns the user's own orders that contain this
// product and are eligible to be reviewed (so the UI can offer an orderId
// without the user needing to know it).
exports.getMyReviewableOrders = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Please login" });
        }

        const orders = await Order.find({
            userId,
            status: { $in: ["confirmed", "shipped", "delivered"] },
            "items.productId": productId,
        }).select("orderId status orderDate items").lean();

        const alreadyReviewedOrderIds = (
            await ReviewModel.find({ user: userId, product: productId }).select("order").lean()
        ).map((r) => String(r.order));

        const reviewable = orders
            .filter((o) => !alreadyReviewedOrderIds.includes(String(o._id)))
            .map((o) => ({ _id: o._id, orderId: o.orderId, orderDate: o.orderDate, status: o.status }));

        res.status(200).json({ success: true, orders: reviewable });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching reviewable orders", error: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN MODERATION
// ─────────────────────────────────────────────

// GET /admin/reviews?status=pending
exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const reviews = await ReviewModel.find(filter)
            .populate("product", "product_name slug ProductMainImage")
            .populate("user", "Name Email")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching reviews", error: error.message });
    }
};

// PUT /admin/reviews/:reviewId/status   Body: { status: "approved" | "rejected" }
exports.updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const review = await ReviewModel.findByIdAndUpdate(reviewId, { status }, { new: true });
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating review", error: error.message });
    }
};

// DELETE /admin/reviews/:reviewId
exports.deleteReviewAdmin = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await ReviewModel.findByIdAndDelete(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        res.status(200).json({ success: true, message: "Review deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting review", error: error.message });
    }
};