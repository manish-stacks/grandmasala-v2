const CartItem = require('../models/CartItem.model');

// Create a cart item
exports.createCartItem = async (req, res) => {
    try {
        const { product, size, color, price, quantity, userId } = req.body;

        // Basic validation
        if (!product || !size || !color || !price || !quantity || !userId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const newItem = await CartItem.create({
            product,
            size,
            color,
            price,
            quantity,
            userId
        });

        res.status(201).json({
            success: true,
            message: 'Cart item created successfully',
            data: newItem
        });
    } catch (error) {
        console.error("Internal server error", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get single cart item by ID
exports.getSingleCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await CartItem.findById(id).populate('product').populate('userId');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error("Error fetching cart item", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all cart items
exports.getAllCartItems = async (req, res) => {
    try {
        const items = await CartItem.find().populate('product').populate('userId');

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error("Error fetching cart items", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.getCartItemByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const findItem = await CartItem.find({ userId: id }).populate('product').populate('userId');
        if (!findItem) {
            return res.status(500).json({
                success: false,
                message: 'No item founded'
            })
        }
        return res.status(200).json({
            success: true,
            message: 'Cart item founded',
            data: findItem
        }
        )
    } catch (error) {
        console.error("Error fetching cart items", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}