const Ordermodel = require("../models/Order.model");
const Product = require("../models/Product.model");
const Crypto = require("crypto");
const Settings = require('../models/Setting');
const Razorpay = require('razorpay');
const User = require("../models/User.model");

const { initiatePayment, initiateRazorpay } = require("../utils/Pay");

const sendEmail = require("../utils/sendMail");
const settings = require("../models/Setting");

var {
  validatePaymentVerification,
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const { createShiprocketOrder, assignCourierAndGenerateAWB } = require("../services/shiprocket.service");



/* ===============================================================
   Shiprocket Status → Our Order Status mapping
   =============================================================== */
const SHIPROCKET_STATUS_MAP = {
  "pending": "pending",
  "confirmed": "confirmed",
  "processing": "progress",
  "picked up": "progress",
  "in transit": "shipped",
  "out for delivery": "shipped",
  "delivered": "delivered",
  "cancelled": "cancelled",
  "returned": "returned",
  "return initiated": "returned",
  "return in transit": "returned",
  "return delivered": "returned",
  "rto initiated": "returned",
  "rto delivered": "returned",
  "lost": "cancelled",
  "undelivered": "shipped",
};

async function toCheckStock(
  product_id,
  stock,
  isVarientTrue = false,
  Varient_id
) {
  try {
    const product = await Product.findById(product_id);
    if (!product) {
      throw new Error("Product Not Found");
    }

    // if (isVarientTrue === false) {
    //   if (product.stock < stock) {
    //     throw new Error(`Not enough stock for the product: ${product.name}. Available stock: ${product.stock}`);
    //   }
    // } else {
    console.log("Varient_id", Varient_id);
    const varient = product.Varient.find(
      (item) => item._id.toString() === Varient_id
    );
    if (!varient) {
      throw new Error("Variant Not Found");
    }
    if (varient.stock_quantity < stock) {
      throw new Error(
        `Not enough stock for the variant: ${varient.quantity}. Available stock: ${varient.stock_quantity}`
      );
    }
    // }
    console.log("i have stock");
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}
async function generateUniqueOrderId() {
  const startString = "ORD";
  let order_id;
  let orderExists = true;

  while (orderExists) {
    const OrderNo = Crypto.randomInt(1000000, 9999999);
    order_id = startString + OrderNo;

    const order = await Ordermodel.findOne({ orderId: order_id });

    if (!order) {
      orderExists = false;
    }
  }

  return order_id;
}

// old code
exports.createOrderOfProduct = async (req, res) => {
  try {
    // user pick safely
    const user = req.user?.id?._id || req.body.userId || null
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const order_id = await generateUniqueOrderId();

    const {
      items,
      totalAmount,
      payAmt,
      isVarientInCart,
      paymentType,
      offerId,
      shipping,
      transactionId,
      shippingAmount
    } = req.body;

    console.log("items", items);

    // STOCK CHECK
    for (let item of items) {
      const { product_id, Qunatity, Varient_id } = item;

      const isVarientTrue = isVarientInCart && Varient_id ? true : false;

      const stockCheck = await toCheckStock(
        product_id,
        Qunatity,
        isVarientTrue,
        Varient_id
      );

      if (!stockCheck) {
        return res.status(400).json({
          success: false,
          message:
            "Stock check failed for one or more products. Please try again later.",
        });
      }
    }

    const orderItems = items.map((item) => ({
      productId: item.product_id,
      Varient_id: item.Varient_id,
      name: item.product_name,
      quantity: item.Qunatity,
      price: item.price_after_discount,
      size: item.size,
      color: item.color,
    }));

    const totalquantity = items.reduce(
      (sum, it) => sum + Number(it.Qunatity || 0),
      0
    );

    const newOrder = new Ordermodel({
      userId: user,
      orderId: order_id,
      items: orderItems,
      totalAmount,
      payAmt,
      paymentType,
      offerId,
      shipping,
      status: "pending",
      totalquantity,
      shippingAmount: shippingAmount || 0,
    });

    const savedOrder = await newOrder.save();

    // 🔹 ONLINE: directly Razorpay initiate karo
    if (paymentType === "ONLINE") {
      // (agar tum transactionId frontend se bhej rahe ho to optionally yaha save kar sakte ho)
      if (transactionId) {
        savedOrder.transactionId = transactionId;
        await savedOrder.save();
      }

      return await initiateRazorpay(req, res, savedOrder);
    }

    // COD: email send + normal order response
    const SettingsFind = await settings.findOne();

    const findOrderDetails = await Ordermodel.findById(savedOrder?._id)
      .populate("userId")
      .populate("offerId");
    console.log(findOrderDetails?.userId?.Email);
    const MailOptions = {
      email: findOrderDetails.userId?.Email,
      subject: `Your Order ${findOrderDetails.orderId} Confirmation`,
      message: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:0; background:#f0faf0; color:#1a1a1a;">
  <div style="max-width:600px; margin:20px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    
    <div style="background:linear-gradient(135deg, #16a34a 0%, #15803d 100%); color:#ffffff; padding:32px 20px; text-align:center;">
      <h2 style="margin:0; font-size:28px; font-weight:600;">Order Confirmed! 🎉</h2>
      <p style="margin:8px 0 0; opacity:0.9;">Thank you for your purchase</p>
    </div>

    <div style="padding:32px 24px;">
      <div style="background:#f0fdf4; border-radius:12px; padding:20px; margin-bottom:24px;">
        <p style="margin:0; font-size:16px; line-height:1.6;">
          Dear ${findOrderDetails.userId?.Name},<br>
          Your order has been successfully placed on <strong>${new Date(
        findOrderDetails.orderDate
      ).toLocaleDateString()}</strong>. We are preparing your items for shipment!
        </p>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Order Details
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0 4px;">
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Order ID:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.orderId
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Email:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.userId?.Email
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Status:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.status
        }</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Items Ordered
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0; margin-bottom:16px;">
          <thead>
            <tr style="background:#dcfce7;">
              <th style="padding:12px; text-align:left; border-radius:6px 0 0 6px;">Product</th>
              <th style="padding:12px; text-align:center;">Qty</th>
              <th style="padding:12px; text-align:right; border-radius:0 6px 6px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${findOrderDetails.items
          .map(
            (item) => `
              <tr style="background:#f0fdf4;">
                <td style="padding:12px; border-radius:6px 0 0 6px;">
                  ${item.name}<br>
                  <small>Size: ${item.size}, Color: ${item.color}</small>
                </td>
                <td style="padding:12px; text-align:center;">${item.quantity}</td>
                <td style="padding:12px; text-align:right; border-radius:0 6px 6px 0;">₹${item.price}</td>
              </tr>
            `
          )
          .join("")}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Payment Information
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0 4px;">
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Subtotal:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">₹${findOrderDetails.totalAmount
        }</td>
          </tr>
          ${findOrderDetails.offerId
          ? `
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Discount Applied (${findOrderDetails.offerId.code}):</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">- ${findOrderDetails.offerId.discount}%</td>
          </tr>`
          : ""
        }
           <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Delivery Charges:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0; font-weight:600;">₹${findOrderDetails.shippingAmount > 0 ? findOrderDetails.shippingAmount : "Free"}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Total Payable:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0; font-weight:600;">₹${findOrderDetails.payAmt}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Payment Method:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.paymentType
        }</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Delivery Address
        </h3>
        <div style="background:#f0fdf4; padding:16px; border-radius:12px;">
          <p style="margin:0; line-height:1.6;">
            ${findOrderDetails.shipping.addressLine}<br>
            ${findOrderDetails.shipping.city}, ${findOrderDetails.shipping.state
        }, ${findOrderDetails.shipping.postCode}<br>
            <strong>Mobile:</strong> ${findOrderDetails.shipping.mobileNumber}
          </p>
        </div>
      </div>

      <div style="background:#dcfce7; border-radius:12px; padding:20px; text-align:center; margin-top:32px;">
        <p style="margin:0; font-size:15px; line-height:1.6;">
          Need help? Contact our support team at<br>
          <a href="mailto:Grand Masalahoe@gmail.com" style="color:#16a34a; text-decoration:none; font-weight:500;">${SettingsFind?.supportEmail
        }</a>
        </p>
      </div>
    </div>

    <div style="background:#16a34a; padding:20px; text-align:center; color:#ffffff;">
      <p style="margin:0; font-size:14px;">
        &copy; ${new Date().getFullYear()} ${SettingsFind?.siteName
        }. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    };
    console.log("befor email send")

    await sendEmail(MailOptions);
    console.log("befor email send 2")

    return res.status(200).json({
      success: true,
      message:
        "Order has been successfully created and placed in pending status.",
      order: findOrderDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// CREATE COD FEE RAZORPAY ORDER (₹50)
exports.createCODOrder = async (req, res) => {
  try {
    const userId = req.user?.id?._id || req.body.userId;

    const { orderData } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: "orderData missing",
      });
    }

    const fixedItems = orderData.items.map(item => ({
      productId: item.product_id,
      name: item.product_name,
      quantity: Number(item.Qunatity || 1),
      price: Number(item.price_after_discount || item.price),
      Varient_id: item.Varient_id ?? null,
      size: item.size ?? null,
    }));

    const totalquantity = fixedItems.reduce(
      (sum, i) => sum + i.quantity,
      0
    );

    const newOrder = await Ordermodel.create({
      userId,
      items: fixedItems,
      totalAmount: Number(orderData.totalAmount),
      payAmt: Number(orderData.payAmt),
      paymentType: "COD",

      // IMPORTANT CHANGE
      codFeePaid: true,
      codFeeAmount: 0,

      status: "confirmed", // ya "pending" agar chaho

      shipping: orderData.shipping,
      shippingAmount: orderData.shippingAmount,
      offerId: orderData.offerId,
      totalquantity,

      orderId: "ORD" + Date.now(),
    });

    const SettingsFind = await settings.findOne();

    const findOrderDetails = await Ordermodel.findById(newOrder._id)
      .populate("userId")
      .populate("offerId");
    console.log(findOrderDetails?.userId?.Email);
    const MailOptions = {
      email: findOrderDetails.userId?.Email,
      subject: `Your Order ${findOrderDetails.orderId} Confirmation`,
      message: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:0; background:#f0faf0; color:#1a1a1a;">
  <div style="max-width:600px; margin:20px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    
    <div style="background:linear-gradient(135deg, #16a34a 0%, #15803d 100%); color:#ffffff; padding:32px 20px; text-align:center;">
      <h2 style="margin:0; font-size:28px; font-weight:600;">Order Confirmed! 🎉</h2>
      <p style="margin:8px 0 0; opacity:0.9;">Thank you for your purchase</p>
    </div>

    <div style="padding:32px 24px;">
      <div style="background:#f0fdf4; border-radius:12px; padding:20px; margin-bottom:24px;">
        <p style="margin:0; font-size:16px; line-height:1.6;">
          Dear ${findOrderDetails.userId?.Name},<br>
          Your order has been successfully placed on <strong>${new Date(
        findOrderDetails.orderDate
      ).toLocaleDateString()}</strong>. We are preparing your items for shipment!
        </p>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Order Details
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0 4px;">
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Order ID:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.orderId
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Email:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.userId?.Email
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Status:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.status
        }</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Items Ordered
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0; margin-bottom:16px;">
          <thead>
            <tr style="background:#dcfce7;">
              <th style="padding:12px; text-align:left; border-radius:6px 0 0 6px;">Product</th>
              <th style="padding:12px; text-align:center;">Qty</th>
              <th style="padding:12px; text-align:right; border-radius:0 6px 6px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${findOrderDetails.items
          .map(
            (item) => `
              <tr style="background:#f0fdf4;">
                <td style="padding:12px; border-radius:6px 0 0 6px;">
                  ${item.name}<br>
                  <small>Size: ${item.size}, Color: ${item.color}</small>
                </td>
                <td style="padding:12px; text-align:center;">${item.quantity}</td>
                <td style="padding:12px; text-align:right; border-radius:0 6px 6px 0;">₹${item.price}</td>
              </tr>
            `
          )
          .join("")}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Payment Information
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0 4px;">
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Subtotal:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">₹${findOrderDetails.totalAmount
        }</td>
          </tr>
          ${findOrderDetails.offerId
          ? `
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Discount Applied (${findOrderDetails.offerId.code}):</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">- ${findOrderDetails.offerId.discount}%</td>
          </tr>`
          : ""
        }
           <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Delivery Charges:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0; font-weight:600;">₹${findOrderDetails.shippingAmount > 0 ? findOrderDetails.shippingAmount : "Free"}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Total Payable:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0; font-weight:600;">₹${findOrderDetails.payAmt}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:6px 0 0 6px;">Payment Method:</td>
            <td style="padding:8px 12px; background:#f0fdf4; border-radius:0 6px 6px 0;">${findOrderDetails.paymentType
        }</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:32px;">
        <h3 style="color:#16a34a; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #dcfce7;">
          Delivery Address
        </h3>
        <div style="background:#f0fdf4; padding:16px; border-radius:12px;">
          <p style="margin:0; line-height:1.6;">
            ${findOrderDetails.shipping.addressLine}<br>
            ${findOrderDetails.shipping.city}, ${findOrderDetails.shipping.state
        }, ${findOrderDetails.shipping.postCode}<br>
            <strong>Mobile:</strong> ${findOrderDetails.shipping.mobileNumber}
          </p>
        </div>
      </div>

      <div style="background:#dcfce7; border-radius:12px; padding:20px; text-align:center; margin-top:32px;">
        <p style="margin:0; font-size:15px; line-height:1.6;">
          Need help? Contact our support team at<br>
          <a href="mailto:Grand Masalahoe@gmail.com" style="color:#16a34a; text-decoration:none; font-weight:500;">${SettingsFind?.supportEmail
        }</a>
        </p>
      </div>
    </div>

    <div style="background:#16a34a; padding:20px; text-align:center; color:#ffffff;">
      <p style="margin:0; font-size:14px;">
        &copy; ${new Date().getFullYear()} ${SettingsFind?.siteName
        }. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    };
    console.log("befor email send")

    await sendEmail(MailOptions);
    console.log("befor email send 2")


    return res.status(200).json({
      success: true,
      message: "COD order created successfully",
      orderId: newOrder._id,
    });

  } catch (error) {
    console.error("COD Order Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/*
exports.createCODOrder = async (req, res) => {
  try {
    const userId = req.user?.id?._id || req.body.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { amount = 50, orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: "orderData missing",
      });
    }

    const settingsDoc = await Settings.findOne();

    const razorpayKey =
      process.env.RAZORPAY_KEY_ID || settingsDoc?.paymentGateway?.key;
    const razorpaySecret =
      process.env.RAZORPAY_SECRET || settingsDoc?.paymentGateway?.secret;

    if (!razorpayKey || !razorpaySecret) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured",
      });
    }

    const razorpay = new Razorpay({
      key_id: razorpayKey,
      key_secret: razorpaySecret,
    });

    // 1️⃣ Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `cod_${Date.now()}`,
      payment_capture: 1,
    });

    // 2️⃣ FIX ITEMS
    const fixedItems = orderData.items.map(item => ({
      productId: item.product_id,
      name: item.product_name,
      quantity: Number(item.Qunatity || 1),
      price: Number(item.price_after_discount || item.price),
      Varient_id: item.Varient_id ?? null,
      size: item.size ?? null,
    }));

    const totalquantity = fixedItems.reduce(
      (sum, i) => sum + i.quantity,
      0
    );

    // 3️⃣ CREATE ORDER (PENDING)
    const newOrder = await Ordermodel.create({
      userId,
      items: fixedItems,

      totalAmount: Number(orderData.totalAmount),
      payAmt: Number(orderData.payAmt),
      paymentType: "COD",

      codFeePaid: false,
      codFeeAmount: amount,
      razorpayOrderId: rzpOrder.id, // ⭐ VERY IMPORTANT
      status: "pending",

      shipping: orderData.shipping,
      shippingAmount: orderData.shippingAmount,
      offerId: orderData.offerId,
      totalquantity,

      orderId: "ORD" + Date.now(),
    });

    return res.status(200).json({
      success: true,
      message: "COD Razorpay order & Order created",
      razorpayOrderId: rzpOrder.id,
      orderId: newOrder._id,
      amount,
      currency: "INR",
      rezorPayKey: razorpayKey,
    });

  } catch (error) {
    console.error("COD Order Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
*/

// VERIFY COD FEE + CREATE REAL ORDER

exports.verifyCODFee = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing payment fields",
      });
    }

    const settingsDoc = await Settings.findOne();

    const secret =
      process.env.RAZORPAY_SECRET || settingsDoc?.paymentGateway?.secret;

    //  VERIFY SIGNATURE
    const crypto = require("crypto");
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature",
      });
    }

    //  UPDATE ORDER
    const order = await Ordermodel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Prevent duplicate update
    if (order.codFeePaid) {
      return res.status(200).json({
        success: true,
        message: "COD fee already verified",
        order,
      });
    }

    order.codFeePaid = true;
    order.codFeePaymentId = razorpay_payment_id;
    order.status = "confirmed";

    await order.save();

    const redirectUrl = `${process.env.SITE_URL}/receipt-cod/order-confirmed?id=${order._id}&success=true&type=cod&amountToPay=${order.totalAmount}`;

    return res.status(200).json({
      success: true,
      message: "COD payment verified",
      redirectUrl,
    });

  } catch (error) {
    console.error("Verify COD Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};







exports.createOrderBeforLogin = async (req, res) => {
  try {
  } catch (error) {
    console.log("Internal server error", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.ChangeOrderStatus = async (req, res) => {
  try {
    const { orderId, status, dimensions } = req.body;

    const order = await Ordermodel.findById(orderId).populate("userId");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (status === "shipped") {
      if (order.shiprocket?.shipment_id) {
        return res.status(400).json({
          success: false,
          message: "Shipment already created for this order",
        });
      }

      const { length, breadth, height, weight } = dimensions;

      if (
        Number(length) <= 0 ||
        Number(breadth) <= 0 ||
        Number(height) <= 0 ||
        Number(weight) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid package dimensions",
        });
      }

      try {
        const shiprocketRes = await createShiprocketOrder(order, dimensions);

        // const awbRes = await assignCourierAndGenerateAWB(
        //   shiprocketRes.shipment_id
        // );

        order.shiprocket = {
          order_id: shiprocketRes.order_id,
          shipment_id: shiprocketRes.shipment_id,
          awb_code: shiprocketRes.awb_code,
          courier_name: shiprocketRes.courier_name,
          status: shiprocketRes.status,
        };

        order.status = "shipped";
        await order.save();

        return res.status(200).json({
          success: true,
          message: "Order shipped successfully",
          order,
        });
      } catch (err) {
        console.error("Shiprocket error:", err.message);

        return res.status(400).json({
          success: false,
          message: err.message || "Shiprocket order creation failed",
        });
      }
    }

    // 🔁 NORMAL STATUS UPDATE
    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.OrderProcessRating = async (req, res) => {
  try {
    const orderId = req.params.orderid;
    const { OrderProcessRating } = req.body;

    const orderData = await Ordermodel.findOne({ orderId: orderId });

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Please check the order ID and try again.",
      });
    }
    orderData.OrderProcessRating = OrderProcessRating;
    await orderData.save();

    return res.status(200).json({
      success: true,
      message:
        "Thank you for sharing your feedback! Your rating has been successfully added to your order.",
      updatedOrder: orderData,
    });
  } catch (error) {
    console.error("Error updating order process rating:", error);

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while adding the rating. Please try again later.",
      error: error.message,
    });
  }
};

exports.getAllOrder = async (req, res) => {
  try {
    const {
      page = 1,
      search = "",
      startDate,
      endDate,
      orderStatus,
      limit,
    } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { "userId.Name": { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (orderStatus) {
      query.status = orderStatus;
    }

    const limits = limit;
    const orders = await Ordermodel.find(query)
      .populate("userId")
      .populate("offerId")
      .skip((page - 1) * limits)
      .limit(limits)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalPages: Math.ceil((await Ordermodel.countDocuments(query)) / limits),
      total: orders.length,
      currentPage: page,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Oops! Something went wrong. Please try again later.",
    });
  }
};

exports.getOrderByOrderId = async (req, res) => {
  try {
    const userId = req.user?.id?._id;
    const orderId = req.params.orderId;
    console.log('userId', userId, orderId)

    const order = await Ordermodel.findOne({
      userId: userId,
      orderId: orderId,
    }).populate("userId")
      .populate("offerId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "We couldn’t find an order with the user ID. Please double-check the order ID and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving the order. Please try again later.",
      error: error.message,
    });
  }
};

exports.getCODOrderByOrderId = async (req, res) => {
  try {
    const userId = req.user?.id?._id; // authenticated user id (string or ObjectId)
    const param = req.params.orderId; // could be ORDxxxx or 24-char mongo id
    console.log("getOrderByOrderId params => userId:", userId, "param:", param);

    if (!param) {
      return res.status(400).json({
        success: false,
        message: "Order identifier missing in request.",
      });
    }

    // Helper: is the param a 24-char hex string (likely Mongo _id)
    const isObjectId =
      typeof param === "string" && /^[0-9a-fA-F]{24}$/.test(param);

    // Build query depending on which identifier we have.
    let query;
    if (isObjectId) {
      // If it's a mongo id, search by _id — but still ensure it belongs to this user
      query = { _id: param };
      if (userId) query.userId = userId;
    } else {
      // Otherwise search by business orderId (ORD...)
      query = { orderId: param };
      if (userId) query.userId = userId;
    }

    console.log("Querying Ordermodel with:", query);
    const order = await Ordermodel.findOne(query)
      .populate("userId")
      .populate("offerId");

    // If not found and we searched by _id + userId, try a fallback:
    // (case: token userId might be missing/incorrect; try searching by orderId alone)
    if (!order && isObjectId && userId) {
      console.log("No order found by _id+userId — trying fallback by _id only");
      const fallback = await Ordermodel.findOne({ _id: param })
        .populate("userId")
        .populate("offerId");
      if (fallback) {
        return res.status(200).json({
          success: true,
          message: "Order retrieved (fallback by _id).",
          data: fallback,
        });
      }
    }

    // If still not found, try fallback searching by orderId field (maybe frontend passed _id but real orderId exists)
    if (!order && !isObjectId) {
      // already searched by orderId above; no need
    } else if (!order && isObjectId === false) {
      // try search by _id as an extra fallback (in case client sent ORD but DB uses _id)
      if (/^[0-9a-fA-F]{24}$/.test(param)) {
        const maybeById = await Ordermodel.findOne({ _id: param })
          .populate("userId")
          .populate("offerId");
        if (maybeById) {
          return res.status(200).json({
            success: true,
            message: "Order retrieved by _id fallback.",
            data: maybeById,
          });
        }
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "We couldn’t find an order with the provided identifier. Please double-check and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving the order. Please try again later.",
      error: error.message,
    });
  }
};






exports.getOrderByOrderIdAdmin = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log('getOrderByOrderIdAdmin orderId:', orderId)
    const order = await Ordermodel.findOne({
      orderId: orderId,
    })
      .populate("userId")
      .populate("offerId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "We couldn’t find an order with the provided ID. Please double-check the order ID and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving the order. Please try again later.",
      error: error.message,
    });
  }
};

exports.getRecentsOrders = async (req, res) => {
  try {
    const recentOrders = await Ordermodel.find({
      orderDate: { $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    })
      .populate("userId")
      .populate("offerId")
      .sort({ orderDate: -1 });

    res.status(200).json({
      message: "Recent Orders fetched successfully",
      data: recentOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recent orders", error });
  }
};

exports.generateOrderReport = async (req, res) => {
  const { reportType, startDate, endDate } = req.body;

  let start, end;

  // Determine the date range based on report type
  switch (reportType) {
    case "weekly":
      start = new Date();
      start.setDate(start.getDate() - 7); // 7 days ago
      end = new Date(); // Current date
      break;
    case "monthly":
      start = new Date();
      start.setMonth(start.getMonth() - 1); // 1 month ago
      end = new Date(); // Current date
      break;
    case "custom":
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "Please provide both startDate and endDate" });
      }
      start = new Date(startDate);
      end = new Date(endDate);
      break;
    default:
      return res.status(400).json({ message: "Invalid report type" });
  }

  try {
    // Fetch the orders within the date range
    const orders = await Ordermodel.find({
      orderDate: { $gte: start, $lte: end },
    }).sort({ orderDate: -1 });

    // Fetch all products to track which ones sold the most and least
    const products = await Product.find();

    // Track the total amount and quantity for each order
    let totalAmount = 0;
    let totalQuantity = 0;

    // Initialize a map to track product sales
    const productSales = new Map();

    // Loop through the orders to calculate total sales and track product sales
    orders.forEach((order) => {
      totalAmount += order.totalAmount;
      totalQuantity += order.totalquantity;

      // Loop through items in the order to track product sales
      order.items.forEach((item) => {
        const productId = item.productId.toString();
        const soldQuantity = item.quantity;

        // Update the sales map for the product
        if (productSales.has(productId)) {
          productSales.set(
            productId,
            productSales.get(productId) + soldQuantity
          );
        } else {
          productSales.set(productId, soldQuantity);
        }
      });
    });

    // Get the product with the most sales and the least sales
    let mostSoldProduct = { productId: null, quantity: 0 };
    let leastSoldProduct = { productId: null, quantity: Infinity };

    // Track products that were not sold
    const soldProductIds = new Set(productSales.keys());
    const unsoldProducts = [];

    // Check each product and update the most and least sold products
    products.forEach((product) => {
      const productId = product._id.toString();
      const soldQuantity = productSales.get(productId) || 0;

      // Most sold product
      if (soldQuantity > mostSoldProduct.quantity) {
        mostSoldProduct = { productId, quantity: soldQuantity };
      }

      // Least sold product
      if (soldQuantity < leastSoldProduct.quantity && soldQuantity > 0) {
        leastSoldProduct = { productId, quantity: soldQuantity };
      }

      // Track unsold products
      if (soldQuantity === 0) {
        unsoldProducts.push(product);
      }
    });

    // Get the most and least sold product details
    const mostSoldProductDetails = products.find(
      (product) => product._id.toString() === mostSoldProduct.productId
    );
    const leastSoldProductDetails = products.find(
      (product) => product._id.toString() === leastSoldProduct.productId
    );

    // Generate the report data
    const reportData = {
      orders: orders[0],
      totalAmount,
      totalQuantity,
      mostSoldProduct: {
        productName: mostSoldProductDetails?.product_name || "N/A",
        quantitySold: mostSoldProduct.quantity,
      },
      leastSoldProduct: {
        productName: leastSoldProductDetails?.product_name || "N/A",
        quantitySold: leastSoldProduct.quantity,
      },
      unsoldProducts: unsoldProducts.map((product) => product.product_name),
    };

    // Return the report data
    res.status(200).json({
      message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)
        } report generated successfully`,
      data: reportData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating report", error });
  }
};

exports.getMyLastOrder = async (req, res) => {
  try {
    const user = req.user?.id?._id || null;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User is not logged in or ID is invalid.",
      });
    }

    // Find the latest order for the user
    const order = await Ordermodel.findOne({ userId: user }).sort({
      createdAt: -1,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user.",
      });
    }

    return res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error("Error fetching last order:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the last order.",
      error: error.message,
    });
  }
};

exports.getMyAllOrder = async (req, res) => {
  try {
    const user = req.user?.id?._id || null;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User is not logged in or ID is invalid.",
      });
    }

    // Find the latest order for the user
    const order = await Ordermodel.find({ userId: user })
      .populate("offerId")
      .sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user.",
      });
    }

    return res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error("Error fetching last order:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the last order.",
      error: error.message,
    });
  }
};

// old code 

exports.checkStatus = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // 1️⃣ Basic validation
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment details",
      });
    }

    const SettingsFind = await settings.findOne();
    const secretKey =
      SettingsFind?.paymentGateway?.secret || process.env.RAZORPAY_SECRET || process.env.RAZORPAY_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: "Missing Razorpay secret key",
      });
    }

    // 2️⃣ Razorpay signature verification
    const isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      secretKey
    );

    if (!isValid) {
      // ❌ Signature invalid → payment fail; order ko bhi update kar sakte ho
      const failureRedirect = `${process.env.SITE_URL}/payment-failed?order_id=${razorpay_order_id}`;

      // optional: order.status / payment.status update
      const failedOrder = await Ordermodel.findOne({
        "payment.razorpayOrderId": razorpay_order_id,
      });

      if (failedOrder) {
        failedOrder.payment = {
          ...(failedOrder.payment || {}),
          method: "RAZORPAY",
          razorpayOrderId: razorpay_order_id,
          transactionId: razorpay_payment_id,
          isPaid: false,
          status: "failed",
        };
        await failedOrder.save();
      }

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        redirectUrl: failureRedirect,
      });
    }

    // 3️⃣ Order fetch karo razorpayOrderId se
    const findOrder = await Ordermodel.findOne({
      "payment.razorpayOrderId": razorpay_order_id,
    }).populate("userId");

    if (!findOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 4️⃣ Payment fields update karo (Phase 3 main point)
    findOrder.payment = {
      ...(findOrder.payment || {}),
      method: "RAZORPAY",
      paymentInital: findOrder.payment?.paymentInital || undefined,
      razorpayOrderId: razorpay_order_id,
      transactionId: razorpay_payment_id,
      isPaid: true,
      status: "Paid",        // ya 'success'
      paidAt: new Date(),
    };

    // Top-level transactionId bhi set kar dete hain (optional but useful)
    findOrder.transactionId = razorpay_payment_id;

    // Business status: ab order confirmed hai
    findOrder.status = "confirmed";

    await findOrder.save();

    // 5️⃣ Success redirect URL (yaha tum _id use karna chaho to dhyan dena)
    const successRedirect = `${process.env.SITE_URL}/Receipt/order-confirmed?id=${findOrder._id}&success=true&data=${findOrder?.orderId}`;

    // 6️⃣ Confirmation email (shipping structure ko model ke according adjust kiya hai)
    const MailOptions = {
      email: findOrder?.userId?.Email,
      subject: "Order Placed Successfully",
      message: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f0faf0; color: #1a1a1a;">
  <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 32px 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 28px; font-weight: 600;">Order Confirmed! 🎉</h2>
      <p style="margin: 8px 0 0; opacity: 0.9;">Thank you for your purchase</p>
    </div>

    <div style="padding: 32px 24px;">
      <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
          Dear ${findOrder?.userId?.Name || "Customer"},<br />
          Your order has been successfully placed and confirmed. We're preparing your items for shipment!
        </p>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="color: #16a34a; font-size: 20px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #dcfce7;">
          Order Details
        </h3>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 4px;">
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Order ID:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0; font-weight: 500;">
              ${findOrder?.orderId}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Email:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0; font-weight: 500;">
              ${findOrder?.userId?.Email}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Order Date:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0; font-weight: 500;">
              ${new Date(findOrder?.orderDate).toLocaleDateString()}
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="color: #16a34a; font-size: 20px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #dcfce7;">
          Items Ordered
        </h3>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 16px;">
          <thead>
            <tr style="background: #dcfce7;">
              <th style="padding: 12px; text-align: left; border-radius: 6px 0 0 6px;">Product</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: right; border-radius: 0 6px 6px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${findOrder?.items
          .map(
            (item) => `
              <tr style="background: #f0fdf4;">
                <td style="padding: 12px; border-radius: 6px 0 0 6px;">
                  ${item.name}<br />
                  <small>Size: ${item.size || "-"}, Color: ${item.color || "-"}</small>
                </td>
                <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border-radius: 0 6px 6px 0;">₹${item.price}</td>
              </tr>
            `
          )
          .join("")}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="color: #16a34a; font-size: 20px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #dcfce7;">
          Payment Information
        </h3>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 4px;">
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Total Amount:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0; font-weight: 600;">
              ₹${findOrder?.totalAmount}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Payment Amount:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0; font-weight: 600;">
              ₹${findOrder?.payAmt}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Payment Method:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0;">
              ${findOrder?.payment?.method}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Transaction ID:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0;">
              ${findOrder?.payment?.transactionId}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 6px 0 0 6px;">Payment Status:</td>
            <td style="padding: 8px 12px; background: #f0fdf4; border-radius: 0 6px 6px 0;">
              <span style="background: #16a34a; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px;">
                ${findOrder?.payment?.status}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="color: #16a34a; font-size: 20px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #dcfce7;">
          Delivery Address
        </h3>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 12px;">
        <p style="margin:0; line-height:1.6;">
            ${findOrder.shipping.addressLine}<br>
            ${findOrder.shipping.city}, ${findOrder.shipping.state
        }, ${findOrder.shipping.postCode}<br>
            <strong>Mobile:</strong> ${findOrder.shipping.mobileNumber}
          </p>
        </div>
      </div>

      <div style="background: #dcfce7; border-radius: 12px; padding: 20px; text-align: center; margin-top: 32px;">
        <p style="margin: 0; font-size: 15px; line-height: 1.6;">
          Need help? Contact our support team at<br />
          <a href="mailto:${SettingsFind?.supportEmail || "support@company.com"}" style="color: #16a34a; text-decoration: none; font-weight: 500;">
            ${SettingsFind?.supportEmail || "support@company.com"}
          </a>
        </p>
      </div>
    </div>

    <div style="background: #16a34a; padding: 20px; text-align: center; color: #ffffff;">
      <p style="margin: 0; font-size: 14px;">
        &copy; ${new Date().getFullYear()} ${SettingsFind?.siteName || "Your Company Name"}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    };

    await sendEmail(MailOptions);

    // 7️⃣ Final response to frontend
    return res.status(200).json({
      success: true,
      message: "Payment verified",
      redirectUrl: successRedirect,
    });
  } catch (error) {
    console.error("Error in checkStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};






exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Ordermodel.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error });
  }
};

exports.refundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundReason } = req.body;
    const Order = await Ordermodel.findById(id).populate("userId");
    if (!Order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    // Assume 5-day window
    const daysSinceDelivery =
      (Date.now() - new Date(Order.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 5)
      return res.status(400).json({ error: "Refund period expired" });

    Order.refundRequest = true;
    Order.refundReason = refundReason;
    await Order.save();
    const SettingsFind = await settings.findOne();
    const MailOptions = {
      email: "Grand Masalahoe@gmail.com",
      subject: `Refund Request Received for Order ${Order.orderId}`,
      message: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Request Notification</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:0; background-color:#f0faf0; color:#1a1a1a;">
  <div style="max-width:600px; margin:20px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color:#ffffff; padding:32px 20px; text-align:center;">
      <h2 style="margin:0; font-size:28px; font-weight:600;">Refund Request Received</h2>
      <p style="margin:8px 0 0; opacity:0.9;">Order #${Order.orderId}</p>
    </div>

    <div style="padding:32px 24px;">
      <div style="background:#fef2f2; border-radius:12px; padding:20px; margin-bottom:24px;">
        <p style="margin:0; font-size:16px; line-height:1.6;">
          Dear Admin,<br>
          A refund has been requested by <strong>${Order.userId?.Name || "N/A"
        }</strong> for the order placed on <strong>${new Date(
          Order.createdAt
        ).toLocaleDateString()}</strong>.
        </p>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="color:#b91c1c; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #fecaca;">
          Refund Details
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0 4px;">
          <tr>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:6px 0 0 6px;">Reason:</td>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:0 6px 6px 0;">${Order.refundReason || "No reason provided"
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:6px 0 0 6px;">Requested On:</td>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:0 6px 6px 0;">${new Date().toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="color:#b91c1c; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #fecaca;">
          Order Details
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0;">
          <tr>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:6px 0 0 6px;">Order ID:</td>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:0 6px 6px 0;">${Order.orderId
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:6px 0 0 6px;">Customer Email:</td>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:0 6px 6px 0;">${Order.userId?.Email || "N/A"
        }</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="color:#b91c1c; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #fecaca;">
          Items in Order
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0; margin-bottom:16px;">
          <thead>
            <tr style="background:#fecaca;">
              <th style="padding:12px; text-align:left; border-radius:6px 0 0 6px;">Product</th>
              <th style="padding:12px; text-align:center;">Qty</th>
              <th style="padding:12px; text-align:right; border-radius:0 6px 6px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${Order.items
          .map(
            (item) => `
              <tr style="background:#fef2f2;">
                <td style="padding:12px; border-radius:6px 0 0 6px;">${item.name}</td>
                <td style="padding:12px; text-align:center;">${item.quantity}</td>
                <td style="padding:12px; text-align:right; border-radius:0 6px 6px 0;">₹${item.price}</td>
              </tr>
            `
          )
          .join("")}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="color:#b91c1c; font-size:20px; margin:0 0 16px; padding-bottom:8px; border-bottom:2px solid #fecaca;">
          Payment Summary
        </h3>
        <table style="width:100%; border-collapse:separate; border-spacing:0 4px;">
          <tr>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:6px 0 0 6px;">Total Amount:</td>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:0 6px 6px 0;">₹${Order.totalAmount
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:6px 0 0 6px;">Payment Method:</td>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:0 6px 6px 0;">${Order.paymentType
        }</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:6px 0 0 6px;">Payment Status:</td>
            <td style="padding:8px 12px; background:#fef2f2; border-radius:0 6px 6px 0;">${Order.payment?.status
        }</td>
          </tr>
        </table>
      </div>

      <div style="background:#fecaca; border-radius:12px; padding:20px; text-align:center; margin-top:32px;">
        <p style="margin:0; font-size:15px; line-height:1.6;">
          Please review this refund request and take appropriate action.
        </p>
      </div>
    </div>

    <div style="background:#b91c1c; padding:20px; text-align:center; color:#ffffff;">
      <p style="margin:0; font-size:14px;">
        &copy; ${new Date().getFullYear()} ${SettingsFind?.siteName
        }. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    };

    await sendEmail(MailOptions);
    return res
      .status(200)
      .json({ success: true, message: "Refund request sent successfully" });
  } catch (error) {
    console.log("Internal server error", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


/* ===============================================================
   POST /api/v1/webhook/shiprocket
   =============================================================== */
exports.updateShiprocketDetailsWebhook = async (req, res) => {
  try {
    console.log("========== SHIPROCKET WEBHOOK ==========");
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));

    // ── Token Verify ──────────────────────────────────────────────
    const token = req.headers["x-api-key"];

    console.log("Received Token:", token);
    console.log("Expected Token:", process.env.SHIPROCKET_WEBHOOK_TOKEN);

    if (!token || token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
      console.log("❌ Unauthorized Request");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      awb,
      current_status,
      order_id,
      channel_order_id,
      current_timestamp,
      shipment_status,
      courier_name,
      scans,
    } = req.body;

    console.log("Parsed Payload:", {
      awb,
      current_status,
      order_id,
      channel_order_id,
      current_timestamp,
      shipment_status,
      courier_name,
    });

    // ── Validation ────────────────────────────────────────────────
    if (!current_status) {
      console.log("❌ current_status missing");
      return res.status(200).json({
        success: false,
        message: "current_status missing in payload",
      });
    }

    // ── Status Mapping ────────────────────────────────────────────
    const mappedStatus =
      SHIPROCKET_STATUS_MAP[current_status.toLowerCase()];

    console.log("Current Status:", current_status);
    console.log("Mapped Status:", mappedStatus);

    if (!mappedStatus) {
      console.log("⚠️ Unmapped Status:", current_status);
      return res.status(200).json({
        success: true,
        message: `Status "${current_status}" not mapped, ignored.`,
      });
    }

    // ── Find Order ────────────────────────────────────────────────
    let order = null;

    if (order_id) {
      console.log(
        "Searching by shiprocket.order_id:",
        String(order_id)
      );

      order = await Ordermodel.findOne({
        "shiprocket.order_id": String(order_id),
      });

      console.log(
        "Order found by shiprocket.order_id:",
        order ? order.orderId : "NOT FOUND"
      );
    }

    if (!order && channel_order_id) {
      console.log(
        "Searching by orderId:",
        channel_order_id
      );

      order = await Ordermodel.findOne({
        orderId: channel_order_id,
      });

      console.log(
        "Order found by orderId:",
        order ? order.orderId : "NOT FOUND"
      );
    }

    if (!order) {
      console.log("❌ Order Not Found");
      console.log("shiprocket.order_id =", order_id);
      console.log("channel_order_id =", channel_order_id);

      return res.status(200).json({
        success: false,
        message: "Order not found, webhook acknowledged.",
      });
    }

    console.log("✅ Order Found");
    console.log({
      dbOrderId: order.orderId,
      dbStatus: order.status,
      dbShiprocketId: order.shiprocket?.order_id,
    });

    // ── Same Status Check ─────────────────────────────────────────
    if (order.status === mappedStatus) {
      console.log(
        `⚠️ Status already same (${mappedStatus})`
      );

      return res.status(200).json({
        success: true,
        message: "Status already up to date.",
      });
    }

    // ── Update Payload ────────────────────────────────────────────
    const updatePayload = {
      status: mappedStatus,
      "shiprocket.status": shipment_status || current_status,
      ...(awb && { "shiprocket.awb_code": String(awb) }),
      ...(courier_name && {
        "shiprocket.courier_name": courier_name,
      }),
      ...(order_id && {
        "shiprocket.order_id": String(order_id),
      }),
    };

    console.log(
      "Update Payload:",
      JSON.stringify(updatePayload, null, 2)
    );

    const updatedOrder = await Ordermodel.findByIdAndUpdate(
      order._id,
      {
        $set: updatePayload,
      },
      {
        new: true,
      }
    );

    console.log("✅ Order Updated");
    console.log({
      orderId: updatedOrder.orderId,
      oldStatus: order.status,
      newStatus: updatedOrder.status,
      awb: updatedOrder.shiprocket?.awb_code,
    });

    if (scans?.length) {
      console.log("Latest Scan:", scans[0]);
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${mappedStatus}"`,
      orderId: order.orderId,
      newStatus: mappedStatus,
    });
  } catch (error) {
    console.error("❌ WEBHOOK ERROR");
    console.error(error);
    console.error(error.stack);

    return res.status(200).json({
      success: false,
      message: "Internal error, webhook acknowledged.",
      error: error.message,
    });
  }
};