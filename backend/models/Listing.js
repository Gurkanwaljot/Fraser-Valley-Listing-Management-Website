import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  address:     { type: String, required: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true },
  agentIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true }],
  fileId:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true }],
  status:      { type: String, default: "Draft"},
  specs: {
    beds:        { type: Number, required: true },
    baths:       { type: Number, required: true },
    garage:      { type: Number, required: true },
    yearBuilt:   { type: Number, required: true },
    livingArea:  { type: Number, required: true },
    lotSize:     { type: Number, required: true },
    propertyType:{ type: String, enum: ['Detached','Townhome','Condo'], default: 'Detached' },
    propertyTax: { type: Number, required: true },
    taxYear:     { type: Number, required: true },
  } ,
  cubicasaInfo: {
    html: {type: String, required: false}
  },
  slug: { type: String, unique: true, index: true, sparse: true, required: false },
  publishedAt: { type: Date, required: false }
}, { timestamps: true });

export default mongoose.model('Listing', listingSchema);