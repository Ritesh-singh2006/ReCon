import mongoose, { Schema } from "mongoose";
const highlightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    selectedText: String,
    documentId: String,
    currentPage: Number,
});
export const highlightModel = mongoose.model('highlightModel', highlightSchema)
