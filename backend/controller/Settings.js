const Settings = require('../models/Setting');

// Create settings (first time)
exports.addSettings = async (req, res) => {
    try {
        // Check if settings already exist
        const existing = await Settings.findOne();
        if (existing) {
            // Update instead of create
            const updated = await Settings.findByIdAndUpdate(existing._id, req.body, { new: true, runValidators: false });
            return res.status(200).json({ success: true, data: updated });
        }
        const newSettings = new Settings(req.body);
        await newSettings.save();
        res.status(201).json({ success: true, data: newSettings });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Update settings by ID
exports.editSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedSettings = await Settings.findByIdAndUpdate(
            id, req.body, { new: true, runValidators: false }
        );
        if (!updatedSettings) {
            return res.status(404).json({ success: false, message: 'Settings not found' });
        }
        res.status(200).json({ success: true, data: updatedSettings });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Get settings (returns first doc or empty defaults)
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Return empty defaults — don't 404
            settings = {
                siteName: 'Grand Masala', siteUrl: '', supportEmail: '', contactNumber: '',
                address: '', codFee: 0, freeShippingThreshold: 299, shippingCost: 80,
                smtp_email: '', smtp_password: '', paymentImage: '',
                socialMediaLinks: { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '' },
                seo: { metaTitle: '', metaDesc: '', metaKeywords: '', ogImage: '', googleVerification: '', canonicalUrl: '', robots: 'index, follow', gaId: '', fbPixelId: '', headScript: '', bodyScript: '' },
            };
        }
        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// controller mein
exports.clearNextCache = async (req, res) => {
  try {
    const response = await fetch('https://grandmasala.in/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        secret: process.env.REVALIDATE_SECRET 
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(500).json({ success: false, message: data.message });
    }

    return res.json({ success: true, message: '✅ Cache cleared successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};