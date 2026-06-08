const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    size: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const CartItem = mongoose.model('CartItem', CartItemSchema);
module.exports = CartItem;
