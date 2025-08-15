import TimerBadge from "../models/model.timerBadge.js";


export const createBadge = async (req, res, next) => {
    try {

        console.log("============================",req.body)
        const { shop, host } = req.query;
        let badgeData = req.body;

        // Validate required timerName
        if (!badgeData.timerName) {
            return res.status(400).json({ error: 'Timer name is required' });
        }

        // Map invalid urgencyNotification to 'None'
        const validUrgencyNotifications = ['Color pulse', 'Notification banner', 'None'];
        if (!validUrgencyNotifications.includes(badgeData.urgencyNotification)) {
            badgeData.urgencyNotification = 'None';
        }

        // Add shop and host to badgeData
        badgeData.shop = shop || '';
        badgeData.host = host || '';

        // Create and save the TimerBadge
        const badge = new TimerBadge(badgeData);
        await badge.save();

        return res.status(201).json({ message: 'TimerBadge created successfully', badge });
    } catch (error) {
        console.error('Error creating TimerBadge:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Timer name already exists' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};
