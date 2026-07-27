const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        size: { type: String, required: true },
        color: { type: String, required: false },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        Varient_id: { type: String, required: true },
        _id: false,
      },
    ],
    isDeliveryFeePay: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    payAmt: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
    shippingAmount: {
      type: Number,
      default: 0,
    },
    payment: {
      method: { type: String },
      transactionId: { type: String },
      isPaid: { type: Boolean, default: false },
      paymentInital: {
        type: Date,
      },
      razorpayOrderId: {
        type: String,
      },
      status: {
        type: String,
        default: "pending",
      },
      paidAt: { type: Date },
    },
    transactionId: { type: String },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },

    // (COD FEE SYSTEM)
    codFeePaid: {
      type: Boolean,
      default: false,
    },

    codFeePaymentId: {
      type: String,
      default: null,
    },

    codFeeAmount: {
      type: Number,
      default: 0,
    },

    shipping: {
      name: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postCode: { type: String, required: true },
      mobileNumber: { type: String },
      email: { type: String },
      addressType: { type: String, required: true },
      addressLine: { type: String, required: true },
    },
    razorpayOrderId: String,
    totalquantity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "progress",
      ],
      default: "pending",
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    OrderProcessRating: {
      type: Number,
      default: 0,
    },
    refundRequest: {
      type: Boolean,
      default: false,
    },
    refundReason: {
      type: String,
      default: "",
    },
    shiprocket: {
      order_id: String,
      shipment_id: Number,
      awb_code: String,
      courier_name: String,
      status: String,
    }
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = Order;
