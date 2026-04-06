import mongoose, { Schema } from "mongoose";
const highlightSchema = new mongoose.Schema({
    selectedText:String,
    documentId:String,
    currentPage:Number,
});
export const highlightModel = mongoose.model('highlightModel',highlightSchema)
