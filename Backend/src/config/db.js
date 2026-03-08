import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        // ...existing code...
    } catch (error) {
        // ...existing code...
        process.exit(1); //1 means exit with failure.
    }
}
