const ProductModel = require('../models/Product.model');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sanitizeFileName = (fileName) => {
    return `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9-_]/g, "_")}`;
};

// Turns "A2 Desi Cow Ghee 1000ml Jar!" into "a2-desi-cow-ghee-1000ml-jar"
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")   // strip anything that isn't a word char, space, or hyphen
        .replace(/[\s_]+/g, "-")    // spaces/underscores -> hyphen
        .replace(/-+/g, "-");       // collapse repeated hyphens
};

// Ensures the slug is unique by appending -2, -3, etc. if needed.
// excludeId lets updateProduct check uniqueness while ignoring the product's own current doc.
const generateUniqueSlug = async (baseText, excludeId = null) => {
    const base = slugify(baseText);
    let slug = base;
    let counter = 2;

    while (true) {
        const query = { slug };
        if (excludeId) query._id = { $ne: excludeId };
        const existing = await ProductModel.findOne(query).select('_id').lean();
        if (!existing) return slug;
        slug = `${base}-${counter}`;
        counter += 1;
    }
};


const uploadBufferToCloudinary = (buffer, fileName) => {
    return new Promise((resolve, reject) => {
        const sanitizedFileName = sanitizeFileName(fileName);
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'dryfruit/products',
                public_id: sanitizedFileName
            },
            (error, result) => {
                if (error) {
                    console.error("Error uploading image to Cloudinary:", error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};


exports.createProduct = async (req, res) => {


    try {
        const {
            product_name,
            product_description,
            isVarient,
            price,
            discount,
            afterDiscountPrice,
            stock,
            Varient,
            category,
            sub_category,
            extra_description,
            tag,
            isShowOnHomeScreen,
            color // 👈 color is already JSON string from frontend
        } = req.body;

        console.log("req.body", req.body);
        console.log("req.files", req.files);

        const uploadedImages = [];

        // Upload images to Cloudinary
        for (const file of req.files) {
            const result = await uploadBufferToCloudinary(file.buffer, file.originalname);
            console.log(result);
            uploadedImages.push({
                public_id: result.public_id,
                url: result.secure_url
            });
        }

        // Parse Varient data if applicable
        let parsedVarients = JSON.parse(Varient || "[]");
        parsedVarients = parsedVarients.map(variant => {
            if (!variant.price_after_discount || variant.price_after_discount === '') {
                const price = parseFloat(variant.price) || 0;
                const discountPercentage = parseFloat(variant.discount_percentage) || 0;
                const discountAmount = (price * discountPercentage) / 100;
                variant.price_after_discount = (price - discountAmount).toFixed(2);
            }
            return variant;
        });

        // Parse color string into array (frontend sends comma-separated string)
        const parsedColors = color ? color.split(',').map(c => c.trim()).filter(Boolean) : [];

        const categoriesChile = sub_category && sub_category !== '' ? sub_category : null;

        // Auto-generate a unique, SEO-friendly slug from the product name
        const slug = await generateUniqueSlug(product_name);

        // Construct product data
        const productData = {
            product_name,
            slug,
            product_description,
            isVarient: JSON.parse(isVarient || false),
            Varient: isVarient === 'false' ? [] : parsedVarients,
            category,
            sub_category: categoriesChile,
            extra_description,
            tag,
            price,
            discount,
            afterDiscountPrice,
            stock,
            isShowOnHomeScreen: JSON.parse(isShowOnHomeScreen || false),
            ProductMainImage: uploadedImages[0] || null,
            SecondImage: uploadedImages[1] || null,
            ThirdImage: uploadedImages[2] || null,
            FourthImage: uploadedImages[3] || null,
            FifthImage: uploadedImages[4] || null,
        };

        // Save to DB
        const product = await ProductModel.create(productData);
        console.log("Added product", product);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: product,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            success: false,
            message: "Error creating product",
            error: error.message,
        });
    }
};

exports.updateIsShowOnHome = async (req, res) => {

    try {
        const { id } = req.params;
        const { isShowOnHomeScreen } = req.body;

        if (typeof isShowOnHomeScreen !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isShowOnHomeScreen must be a boolean value.',
            });
        }

        const product = await ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.',
            });
        }

        product.isShowOnHomeScreen = isShowOnHomeScreen;
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product display status updated successfully.',
            data: product,
        });
    } catch (error) {
        console.error("Internal server error:", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};


exports.getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find().sort({ createdAt: -1 }).populate('category');
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching products",
            error: error.message,
        });
    }
};


exports.getProductsByCategory = async (req, res) => {
    try {
        if (!req.query.id) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required",
            });
        }
        const products = await ProductModel.find({ category: req.query.id }).sort({ createdAt: -1 }).populate('category');
        res.status(200).json({
            success: true,
            count: products.length,
            message: "Products fetched successfully",
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching products",
            error: error.message,
        });
    }
};
exports.getProductsBySubCategory = async (req, res) => {
    try {
        console.log("sun hshsh", req.params.id)
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required",
            });
        }
        const products = await ProductModel.find({ sub_category: req.params.id }).sort({ createdAt: -1 }).populate('category');
        res.status(200).json({
            success: true,
            count: products.length,
            message: "Products fetched successfully",
            data: products,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Error fetching products",
            error: error.message,
        });
    }
};



exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Supports both the new SEO-friendly slug ("a2-desi-cow-ghee-1000ml-jar")
        // and the legacy MongoDB _id, so old bookmarked/shared links keep working.
        const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
        const query = isObjectId ? { _id: id } : { slug: id };

        const product = await ProductModel.findOne(query).populate('sub_category').populate('category');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching product",
            error: error.message,
        });
    }
};



exports.deleteProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });

        }
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting product",
            error: error.message,
        });
    }
}

exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateFields = {};

        const {
            product_name,
            product_description,
            isVarient,
            price,
            sub_category,
            discount,
            afterDiscountPrice,
            stock,
            Varient,
            category,
            extra_description,
            tag,
            isShowOnHomeScreen,
            color,
            imageOrder,     // 👈 NEW — final ordered image sequence
            removedImages,  // 👈 NEW — public_ids to delete from Cloudinary
        } = req.body;

        if (product_name !== undefined) updateFields.product_name = product_name;
        if (product_description !== undefined) updateFields.product_description = product_description;

        if (product_name !== undefined) {
            const existingProduct = await ProductModel.findById(productId).select('slug').lean();
            if (existingProduct && !existingProduct.slug) {
                updateFields.slug = await generateUniqueSlug(product_name, productId);
            }
        }

        if (price !== undefined) updateFields.price = price;
        if (discount !== undefined) updateFields.discount = discount;
        if (afterDiscountPrice !== undefined) updateFields.afterDiscountPrice = afterDiscountPrice;
        if (stock !== undefined) updateFields.stock = stock;
        if (category !== undefined) updateFields.category = category;
        if (extra_description !== undefined) updateFields.extra_description = extra_description;
        if (tag !== undefined) updateFields.tag = tag;
        if (sub_category !== undefined) {
            updateFields.sub_category = sub_category && sub_category !== '' ? sub_category : null;
        }

        if (color !== undefined) {
            if (typeof color === "string") {
                updateFields.color = color.split(',').map(c => c.trim()).filter(Boolean);
            } else if (Array.isArray(color)) {
                updateFields.color = color;
            } else {
                updateFields.color = [];
            }
        }

        if (isVarient !== undefined) {
            updateFields.isVarient = JSON.parse(isVarient);
        }

        if (Varient !== undefined) {
            let parsedVarients = JSON.parse(Varient || "[]");
            parsedVarients = parsedVarients.map(variant => {
                if (!variant.price_after_discount || variant.price_after_discount === '') {
                    const price = parseFloat(variant.price) || 0;
                    const discountPercentage = parseFloat(variant.discount_percentage) || 0;
                    const discountAmount = (price * discountPercentage) / 100;
                    variant.price_after_discount = (price - discountAmount).toFixed(2);
                }
                return variant;
            });
            updateFields.Varient = parsedVarients;
        }

        if (isShowOnHomeScreen !== undefined) {
            updateFields.isShowOnHomeScreen = JSON.parse(isShowOnHomeScreen);
        }

        // ✅ NEW: ordered image handling (reorder / set-main / remove)
        if (imageOrder !== undefined) {
            const order = JSON.parse(imageOrder || "[]");
            const slotNames = ["ProductMainImage", "SecondImage", "ThirdImage", "FourthImage", "FifthImage"];

            if (order.length > slotNames.length) {
                return res.status(400).json({
                    success: false,
                    message: `A product can have at most ${slotNames.length} images`,
                });
            }
            if (order.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one product image is required",
                });
            }

            // New files were appended under the "images" field, in order
            const newFiles = (req.files || []).filter(f => f.fieldname === "images");
            let newFileIndex = 0;

            const resolvedImages = [];
            for (const entry of order) {
                if (entry.type === "existing" && entry.public_id && entry.url) {
                    resolvedImages.push({ public_id: entry.public_id, url: entry.url });
                } else if (entry.type === "new") {
                    const file = newFiles[newFileIndex++];
                    if (!file) continue; // safety guard, shouldn't happen if frontend is consistent
                    const result = await uploadBufferToCloudinary(file.buffer, file.originalname);
                    resolvedImages.push({ public_id: result.public_id, url: result.secure_url });
                }
            }

            // Assign to fixed slots — clears any slot beyond the new count
            slotNames.forEach((slot, i) => {
                updateFields[slot] = resolvedImages[i] || null;
            });

            // Best-effort cleanup of removed images from Cloudinary
            if (removedImages) {
                try {
                    const idsToDelete = JSON.parse(removedImages || "[]");
                    await Promise.all(
                        idsToDelete.map((publicId) =>
                            cloudinary.uploader.destroy(publicId).catch((err) =>
                                console.error("Cloudinary delete failed for", publicId, err.message)
                            )
                        )
                    );
                } catch (err) {
                    console.error("Failed to parse/delete removedImages:", err.message);
                }
            }
        } else if (req.files && req.files.length > 0) {
            // Legacy path (kept for backward compatibility): files uploaded
            // under named fields like ProductMainImage, SecondImage, etc.
            for (const file of req.files) {
                const result = await uploadBufferToCloudinary(file.buffer, file.originalname);
                switch (file.fieldname) {
                    case "ProductMainImage":
                        updateFields.ProductMainImage = { public_id: result.public_id, url: result.secure_url };
                        break;
                    case "SecondImage":
                        updateFields.SecondImage = { public_id: result.public_id, url: result.secure_url };
                        break;
                    case "ThirdImage":
                        updateFields.ThirdImage = { public_id: result.public_id, url: result.secure_url };
                        break;
                    case "FourthImage":
                        updateFields.FourthImage = { public_id: result.public_id, url: result.secure_url };
                        break;
                    case "FifthImage":
                        updateFields.FifthImage = { public_id: result.public_id, url: result.secure_url };
                        break;
                    default:
                        console.log("Unknown file field:", file.fieldname);
                        break;
                }
            }
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            success: false,
            message: "Error updating product",
            error: error.message,
        });
    }
};



exports.search_product_and_filter = async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        const perPage = 10;
        let filter = {};

        if (query) {
            filter = {
                $or: [
                    { product_name: { $regex: query, $options: 'i' } },
                    { product_description: { $regex: query, $options: 'i' } },
                ],
            };
        }

        let totalProducts = await ProductModel.countDocuments(filter);
        let products = await ProductModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('category');

        let message = "Products found based on your search.";

        // If no products found, return all products as fallback
        if (products.length === 0) {
            totalProducts = await ProductModel.countDocuments();
            products = await ProductModel.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .populate('category');

            message = "No matching products found. Showing all available products.";
        }

        const totalPages = Math.ceil(totalProducts / perPage);

        res.json({
            success: true,
            message,
            totalProducts,
            totalPages,
            currentPage: Number(page),
            data: products,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};