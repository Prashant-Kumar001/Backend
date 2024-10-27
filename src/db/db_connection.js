import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// const LOCAL_uri = process.env.MONGODB_URI;
const REMOTE_uri = process.env.MONGODB_REMOTE_URI;

if (!REMOTE_uri && !LOCAL_uri) {
    throw new Error("Environment variable MONGODB_URI is missing");
}

async function connectToDatabase({ enableConnectionEvents = false } = {}) {
    const mongooseOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        autoIndex: false,
    };

    // Enable connection events if requested
    if (enableConnectionEvents) {
        mongoose.connection.on('error', (err) => {
            console.error("MongoDB connection error:", err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log("MongoDB disconnected");
        });

        mongoose.connection.on('connected', () => {
            console.log("MongoDB connected");
        });

        mongoose.connection.on('reconnected', () => {
            console.log("MongoDB reconnected");
        });
    }

    try {
        // Attempt to connect to MongoDB
        await mongoose.connect(REMOTE_uri, mongooseOptions);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Initial MongoDB connection error:", error);
        process.exit(1); // Exit with a failure code
    }

    // Graceful shutdown on application exit
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
}

async function gracefulShutdown() {
    console.log("Initiating shutdown..."); // Log when shutdown begins
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed due to application termination");
        process.exit(0); // Exit with success code
    } catch (error) {
        console.error("Error during MongoDB disconnection:", error);
        process.exit(1); // Exit with failure code if disconnection fails
    }
}

export default connectToDatabase; 
