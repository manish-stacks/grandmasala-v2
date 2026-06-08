const axios = require("axios");

let cachedToken = null;
let tokenCreatedAt = null;

const getShiprocketToken = async () => {
    if (
        cachedToken &&
        tokenCreatedAt &&
        Date.now() - tokenCreatedAt < 8 * 24 * 60 * 60 * 1000
    ) {
        console.log("✅ Using cached Shiprocket token");
        return cachedToken;
    }

    console.log("🔐 Fetching new Shiprocket token...");

    const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
        }
    );

    if (!res.data.token) {
        console.error("❌ Shiprocket login failed:", res.data);
        throw new Error("Shiprocket login failed");
    }

    cachedToken = res.data.token;
    tokenCreatedAt = Date.now();

    console.log("✅ Shiprocket token received");

    return cachedToken;
};

const createShiprocketOrder = async (order, dimensions) => {
    try {
        const token = await getShiprocketToken();

        /* ================= SAFE CALCULATIONS ================= */
        // const itemsTotal = order.payAmt// - (order.paymentType === "COD" ? order.codFeeAmount : 0)
        const itemsTotal = order.totalAmount// - (order.paymentType === "COD" ? order.codFeeAmount : 0)

        const phone = String(order.shipping.mobileNumber).slice(-10);

        /* ================= PAYLOAD ================= */
        const payload = {
            order_id: String(order.orderId).slice(0, 50),

            order_date: new Date(order.orderDate)
                .toISOString()
                .slice(0, 16)
                .replace("T", " "),

            pickup_location: "warehouse", // ⚠️ MUST MATCH DASHBOARD EXACTLY
            billing_last_name: "",

            billing_customer_name: order.shipping.name,
            billing_address: order.shipping.addressLine || "NA",
            billing_city: order.shipping.city,
            billing_pincode: Number(order.shipping.postCode),
            billing_state: order.shipping.state,
            billing_country: "India",
            billing_email: order.userId.Email,
            billing_phone: Number(phone),
            // shipping_charges: order?.shippingCharge || 0,
            shipping_charges: order?.shippingAmount ? Number(order.shippingAmount) : 0,
            total_discount: order.paymentType === "COD" ? order.codFeeAmount : 0,

            shipping_is_billing: true,

            order_items: order.items.map((item) => ({
                name: item.name,
                sku: String(item.productId),
                units: Number(item.quantity),
                selling_price: Number(item.price),
            })),

            payment_method: order.paymentType === "COD" ? "COD" : "Prepaid",

            // 🔴 CRITICAL: sub_total = items total only
            sub_total: Number(itemsTotal),

            length: Number(dimensions.length),
            breadth: Number(dimensions.breadth),
            height: Number(dimensions.height),
            weight: Number(dimensions.weight),
        };

        /* ================= DEBUG LOG ================= */
        console.log(
            "📦 SHIPROCKET PAYLOAD:\n",
            JSON.stringify(payload, null, 2)
        );

        const res = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Shiprocket Success Response:", res.data);

        if (!res.data.order_id) {
            throw new Error(res.data.message || "Shiprocket order failed");
        }

        return res.data;
    } catch (error) {
        console.error("❌ Shiprocket API ERROR");

        if (error.response) {
            console.error("STATUS:", error.response.status);
            console.error(
                "DATA:",
                JSON.stringify(error.response.data, null, 2)
            );
        } else {
            console.error("MESSAGE:", error.message);
        }

        throw error;
    }
};

const getAvailableCouriers = async (shipment_id) => {
    const token = await getShiprocketToken();

    const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/courier/serviceability/",
        {
            shipment_id,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.data.data || res.data.data.length === 0) {
        throw new Error("No courier service available for this shipment");
    }

    return res.data.data; // list of couriers
};

const assignCourierAndGenerateAWB = async (shipment_id) => {
    const token = await getShiprocketToken();

    // 1️⃣ Fetch couriers
    const couriers = await getAvailableCouriers(shipment_id);

    // 2️⃣ Pick cheapest / first courier
    const selectedCourier = couriers[0];

    // 3️⃣ Assign courier
    const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
        {
            shipment_id,
            courier_id: selectedCourier.courier_company_id,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.data.awb_code) {
        throw new Error("AWB code not generated after courier assignment");
    }

    return {
        awb_code: res.data.awb_code,
        courier_name: res.data.courier_name,
    };
};

module.exports = { createShiprocketOrder, assignCourierAndGenerateAWB };
