import mongoose from "mongoose";
const DbSchema = new mongoose.Schema({
  name: String,
  path:String,
  uploadedAt:{
    type:Date,
    default:Date.now //why not use Date.now()?
    }
});
export const DocumentModel = mongoose.model('DocumentModel',DbSchema)