import dotenv from 'dotenv';
dotenv.config();

const configKeys = {
    MONGODB_URI : process.env.MONGODB_URI,
}

export default configKeys;