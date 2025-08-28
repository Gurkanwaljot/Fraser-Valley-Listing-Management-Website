import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  phone:        { type: String, required: true },
  email:        { type: String, required: true },
  url:          { type: String, required: true },
  brokerage:    { type: String, required: true },
  fileId:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true }]
}, { timestamps: true });

export default mongoose.model('Agent', agentSchema);