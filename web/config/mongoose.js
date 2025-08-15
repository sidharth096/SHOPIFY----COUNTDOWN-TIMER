import mongoose from 'mongoose';
import configKeys from './config.js';


const connectToMongoDB = async () => {
    try {
        await mongoose.connect(configKeys.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectToMongoDB;