import mongoose from "mongoose";

const UrlAltSchema = new mongoose.Schema({
    url: { type: String, required: true },
    altText: { type: String, default: '' },    
    selected: {type: Boolean, default: false}
},
{_id: false})

const FileItemSchema = new mongoose.Schema({
    // NOW AN ARRAY:
    listingimagesAndVideos: { type: [UrlAltSchema], default: [] },
    // keep these if you still want separate buckets too (optional):
    floorplans:       { type: [UrlAltSchema], default: [] },
    listingDocuments: { type: [UrlAltSchema], default: [] }
},
{_id: false})

const fileSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent'
    },
    listingFiles: {
        type: [FileItemSchema],
        default: []
    },
    agentImages: {
        type: [UrlAltSchema],
        default: []
    },
    uploadedBy: {
        type: String, // could also be ref to User model
    }
},
 {timestamps: true}
)

export default mongoose.model('File', fileSchema);