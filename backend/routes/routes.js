const express = require("express");

// Controllers
const {
  RegisterUser, LogginUser, LogoutUser,
  PasswordChangeRequest, verifyOtpForSignIn, Resend_Otp,
  getAllUsers, findMe, addWhisList, getWishlist,
  deleteUser, deleteUserByOwn, updateProfile,
  testconsole, RegisterUserBeforeLogin,
  sendLoginOtp,
  verifyLoginOtp,
} = require("../controller/User.controller");

const { protect, isAdmin } = require("../middleware/auth");

const {
  createProduct, getAllProducts, deleteProductById,
  getProductById, updateProduct, getProductsByCategory,
  getProductsBySubCategory, search_product_and_filter, updateIsShowOnHome,
} = require("../controller/Product.controller");

const {
  getReviewsByProduct, addReview, getMyReviewableOrders,
  getAllReviewsAdmin, updateReviewStatus, deleteReviewAdmin,
} = require("../controller/Review.controller");

const multer = require("multer");

const {
  createOrderOfProduct, createCODOrder, verifyCODFee,
  ChangeOrderStatus, getAllOrder, getMyLastOrder, checkStatus,
  getOrderByOrderId, OrderProcessRating, getMyAllOrder,
  getOrderByOrderIdAdmin, generateOrderReport, getRecentsOrders,
  deleteOrder, refundOrder, getCODOrderByOrderId,
  updateShiprocketDetailsWebhook,
} = require("../controller/Order_Controller");

const { addSettings, editSettings, getSettings } = require("../controller/Settings");
const { createHeroPage, getHeroPage } = require("../controller/Hero.controller");

const {
  createPage, getAllPages, getSinglePage, updatePage, deletePage,
  createAnnouncements, getAnnouncements, updateAnnouncement, deleteAnnouncement,
} = require("../controller/Pages.controller");

const { createContact, getAllContacts, updateContact, deleteContact } = require("../controller/Contact.controller");

const {
  createCoupon, updateCoupon, deleteCoupon, applyCoupon, getAllCoupons,
} = require("../controller/Coupon.controller");

const {
  createCategory, getCategories, getCategoryById, updateCategory, deleteCategory,
  addSubcategory, UpdateSubcategory, deleteSubcategory, getSubcategoriesByCategory,
} = require("../controller/Category.controller");

const { getAbout, createOrUpdateAbout } = require("../controller/aboutController");

const {
  createTestimonial, getAllTestimonials, getTestimonialById,
  updateTestimonial, deleteTestimonial,
} = require("../controller/testimonialController");

const {
  createBlog, getAllBlogs, getBlogBySlug, updateBlog, deleteBlog,
} = require("../controller/blogController");

const {
  createCartItem, getSingleCartItem, getAllCartItems, getCartItemByUserId,
} = require("../controller/cart.controller");

const {
  subscribe, unsubscribe, getAllSubscribers,
} = require("../controller/newsletter.controller");

const { getSitemap, getRobotsTxt } = require("../controller/sitemap.controller");

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// ─────────────────────────────────────────────
// SEO Routes (no /api/v1 prefix — direct)
// ─────────────────────────────────────────────
router.get("/sitemap.xml", getSitemap);
router.get("/robots.txt", getRobotsTxt);

// ─────────────────────────────────────────────
// AUTH & USER Routes
// ─────────────────────────────────────────────
router.post("/regsiter-user", RegisterUser);
router.post("/verify-otp", verifyOtpForSignIn);
router.post("/resend-otp", Resend_Otp);
router.post("/login", LogginUser);
router.get("/logout", LogoutUser);
router.get("/my-details", protect, findMe);
router.post("/Password-Change-Request", PasswordChangeRequest);
router.post("/add-whishlist", protect, addWhisList);
router.get("/wishlist", protect, getWishlist);
router.get("/my-last-order", protect, getMyLastOrder);
router.get("/my-recent-order/:orderId", protect, getOrderByOrderId);
router.get("/my-recent-cod-order/:orderId", protect, getCODOrderByOrderId);
router.get("/recent-order/:orderId", getOrderByOrderIdAdmin);
router.post("/order-proccessing/:orderid", OrderProcessRating);
router.get("/my-all-order", protect, getMyAllOrder);
router.post("/support-request", createContact);
router.delete("/delete-account", protect, deleteUserByOwn);
router.put("/update-user-profile", protect, updateProfile);
router.post("/create_user_from_cart", RegisterUserBeforeLogin);
router.get("/testconsole", testconsole);
router.post("/send-login-otp", sendLoginOtp);
router.post("/verify-login-otp", verifyLoginOtp);
// router.post('/webhook/shiprocket', updateShiprocketDetailsWebhook);

// ─────────────────────────────────────────────
// NEWSLETTER Routes
// ─────────────────────────────────────────────
router.post("/create-newsletter", subscribe);
router.post("/unsubscribe-newsletter", unsubscribe);
router.get("/admin/newsletter/subscribers", getAllSubscribers);

// ─────────────────────────────────────────────
// ADMIN — Reports
// ─────────────────────────────────────────────
router.post("/get-reports", generateOrderReport);
router.get("/get-recent-orders", getRecentsOrders);

// ─────────────────────────────────────────────
// ADMIN — Announcements
// ─────────────────────────────────────────────
router.post("/annoncement", createAnnouncements);
router.get("/admin/annoncements", getAnnouncements);
router.post("/admin/annoncement/:id", updateAnnouncement);
router.delete("/admin/annoncement/:id", deleteAnnouncement);

// ─────────────────────────────────────────────
// ADMIN — Coupons
// ─────────────────────────────────────────────
router.post("/add-coupon", createCoupon);
router.post("/update-coupon/:code", updateCoupon);
router.delete("/delete-coupon/:code", deleteCoupon);
router.post("/apply-coupon", applyCoupon);
router.get("/get-coupon", getAllCoupons);

// ─────────────────────────────────────────────
// ADMIN — Support
// ─────────────────────────────────────────────
router.get("/admin/support-request/all", getAllContacts);
router.post("/admin/support/:id", updateContact);
router.delete("/admin/support-delete/:id", deleteContact);

// ─────────────────────────────────────────────
// ADMIN — Categories & Sub-categories
// ─────────────────────────────────────────────
router.post("/admin/create/category", createCategory);
router.get("/admin/category", getCategories);
router.get("/admin/category/:id", getCategoryById);
router.put("/admin/category/edit/:id", updateCategory);
router.delete("/admin/category-del/:id", deleteCategory);
router.post("/admin/create/sub-category/:id", addSubcategory);
router.delete("/admin/sub-category/delete/:id", deleteSubcategory);
router.get("/admin/sub-category/:categoryId", getSubcategoriesByCategory);
router.put("/admin/sub-category/edit/:id", UpdateSubcategory);

// ─────────────────────────────────────────────
// ADMIN — Users & Orders
// ─────────────────────────────────────────────
router.get("/admin/get-users", getAllUsers);
router.post("/admin/change-order-status", ChangeOrderStatus);
router.get("/admin/get-all-order", getAllOrder);
router.delete("/admin/delete/:id", deleteUser);
router.delete("/admin/delete-order/:id", deleteOrder);
router.put("/refund-request-order/:id", refundOrder);

// ─────────────────────────────────────────────
// ADMIN — Hero Page
// ─────────────────────────────────────────────
router.post("/admin/create_and_update/hero_page", createHeroPage);
router.get("/admin/get/hero_page", getHeroPage);

// ─────────────────────────────────────────────
// ADMIN — Dynamic Pages
// ─────────────────────────────────────────────
router.post("/admin/page", createPage);
router.get("/admin/pages", getAllPages);
router.get("/admin/page/:slug", getSinglePage);
router.put("/admin/page/:slug", updatePage);
router.delete("/admin/page/:slug", deletePage);

// ─────────────────────────────────────────────
// ADMIN — Settings
// ─────────────────────────────────────────────
router.post("/admin/create/settings", addSettings);
router.put("/admin/settings/:id", editSettings);
router.get("/admin/settings", getSettings);

// Public settings (for client - footer, social links)
router.get("/settings", getSettings);

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
router.post("/add-new-product", upload.any(), createProduct);
router.post("/update-product/:productId", upload.any(), updateProduct);
router.get("/get-product", getAllProducts);
router.get("/products", getAllProducts); // alias for Next.js client
router.get("/get-product/by-category", getProductsByCategory);
router.get("/get-product/:id", getProductById);
router.get("/get-product/by-sub-category/:id", getProductsBySubCategory);
router.delete("/delete-product/:id", deleteProductById);
router.put("/update-show-home/:id", updateIsShowOnHome);
router.get("/search_product_and_filter", search_product_and_filter);

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────
router.get("/get-reviews/:productId", getReviewsByProduct);
router.post("/add-review/:productId", protect, addReview);
router.get("/get-my-reviewable-orders/:productId", protect, getMyReviewableOrders);

// Admin moderation — requires a logged-in user whose JWT Role is "Admin".
router.get("/admin/reviews", protect, isAdmin, getAllReviewsAdmin);
router.put("/admin/reviews/:reviewId/status", protect, isAdmin, updateReviewStatus);
router.delete("/admin/reviews/:reviewId", protect, isAdmin, deleteReviewAdmin);

// ─────────────────────────────────────────────
// ORDERS & PAYMENTS
// ─────────────────────────────────────────────
router.post("/add-order", protect, createOrderOfProduct);
router.post("/create-cod-order", protect, createCODOrder);
router.post("/verify-cod-fee", protect, verifyCODFee);
router.post("/verify-payment", checkStatus);

// ─────────────────────────────────────────────
// ABOUT
// ─────────────────────────────────────────────
router.get("/get-about", getAbout);
router.post("/create-or-update-about", createOrUpdateAbout);

// ─────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────
router.post("/testimonial", createTestimonial);
router.get("/testimonial", getAllTestimonials);
router.get("/testimonial/:id", getTestimonialById);
router.put("/testimonial/:id", updateTestimonial);
router.delete("/testimonial/:id", deleteTestimonial);

// ─────────────────────────────────────────────
// BLOGS
// ─────────────────────────────────────────────
router.post("/blog", createBlog);
router.get("/blog", getAllBlogs);
router.get("/blog/:slug", getBlogBySlug);
router.put("/blog/:id", updateBlog);
router.delete("/blog/:id", deleteBlog);

// ─────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────
router.post("/create_cart_item", createCartItem);
router.get("/get_single_cart/:id", getSingleCartItem);
router.get("/get_cart_by_user/:id", getCartItemByUserId);
router.get("/get_all_cart_item", getAllCartItems);

module.exports = router;