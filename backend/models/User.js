import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model("User", userSchema);