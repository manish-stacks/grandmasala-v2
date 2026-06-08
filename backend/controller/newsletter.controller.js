const Newsletter = require('../models/Newsletter.model');

exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const existing = await Newsletter.findOne({ email });
        if (existing) {
            if (existing.isSubscribed) {
                return res.status(400).json({ success: false, message: 'You are already subscribed!' });
            }
            existing.isSubscribed = true;
            await existing.save();
            return res.status(200).json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
        }

        await Newsletter.create({ email });
        res.status(201).json({ success: true, message: 'Thank you for subscribing!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        const subscriber = await Newsletter.findOne({ email });
        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }
        subscriber.isSubscribed = false;
        await subscriber.save();
        res.status(200).json({ success: true, message: 'You have been unsubscribed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find({ isSubscribed: true }).sort({ subscribedAt: -1 });
        res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
