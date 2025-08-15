import TimerBadge from "../models/model.timerBadge.js";
import createOrUpdateAppMeta from "../utils/createOrUpdateAppMeta.js";
import getAppInstallationID from "../utils/getAppInstallationID.js";


export const createBadge = async (req, res, next) => {
    try {

        const { shop, host } = req.query;
        let badgeData = req.body;
        const session = res.locals.shopify.session;

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

        const gid = await getAppInstallationID(shop, session);
        await createOrUpdateAppMeta(gid, session, badge, 'create');

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

export const getBadges = async (req, res, next) => {
    try {
        const badges = await TimerBadge.find();
        return res.status(200).json({ badges });
    } catch (error) {
        console.error('Error getting TimerBadges:', error);
        next(error);
    }
};

export const getBadge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const badge = await TimerBadge.findById(id);
        if (!badge) {
            return res.status(404).json({ error: 'TimerBadge not found' });
        }
        return res.status(200).json({ badge });
    } catch (error) {
        console.error('Error getting TimerBadge:', error);
        next(error);
    }
};

export const updateBadge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {shop} = req.query;
        const badgeData = req.body;
        const session = res.locals.shopify.session;

        const badge = await TimerBadge.findByIdAndUpdate(id, badgeData, { new: true });
        if (!badge) {
            return res.status(404).json({ error: 'TimerBadge not found' });
        }
        const gid = await getAppInstallationID(shop, session);
        await createOrUpdateAppMeta(gid, session, badge, 'update');

        return res.status(200).json({ badge });
    } catch (error) {
        console.error('Error updating TimerBadge:', error);
        next(error);
    }
};

export const deleteBadge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { shop } = req.query;
        const session = res.locals.shopify.session;
        const badge = await TimerBadge.findByIdAndDelete(id);


        if (!badge) {
            return res.status(404).json({ error: 'TimerBadge not found' });
        }
        const gid = await getAppInstallationID(shop, session);
        await createOrUpdateAppMeta(gid, session, badge, 'delete');

        return res.status(200).json({ message: 'TimerBadge deleted successfully' });
    } catch (error) {
        console.error('Error deleting TimerBadge:', error);
        next(error);
    }
};