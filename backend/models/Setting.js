const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Grand Masala' },
    siteUrl: { type: String, default: '' },
    smtp_email: { type: String, default: '' },
    smtp_password: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    codFee: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 299 },
    shippingCost: { type: Number, default: 80 },
    paymentImage: { type: String, default: '' },
    socialMediaLinks: {
        facebook:  { type: String, default: '' },
        twitter:   { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin:  { type: String, default: '' },
        youtube:   { type: String, default: '' },
    },
    // SEO & Meta
    seo: {
        metaTitle:           { type: String, default: '' },
        metaDesc:            { type: String, default: '' },
        metaKeywords:        { type: String, default: '' },
        ogImage:             { type: String, default: '' },
        googleVerification:  { type: String, default: '' },
        canonicalUrl:        { type: String, default: '' },
        robots:              { type: String, default: 'index, follow' },
        // Analytics / Tracking
        gaId:          { type: String, default: '' },   // Google Analytics G-XXXX
        fbPixelId:     { type: String, default: '' },   // Facebook Pixel ID
        headScript:    { type: String, default: '' },   // Custom <head> scripts
        bodyScript:    { type: String, default: '' },   // Custom <body> scripts
    },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
