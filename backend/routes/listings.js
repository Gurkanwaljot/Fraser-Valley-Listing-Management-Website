import express from "express";
import Listing from "../models/Listing.js";
// import { requireAdmin } from "../lib/auth.js";

const router = express.Router();


router.get('/by-slug/:slug', async (req, res) => {
  const doc = await Listing.findOne({ slug: req.params.slug }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});
// GET all listings
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a listing by ID
router.get("/:id", async (req, res) => {
  try{
    const listing = await Listing.findById(req.params.id);
    console.log(listing)
    if(!listing){
      return res.status(404).json({ message: "Listing Not Found"});
    }
    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(400).json({message: err.message});
  }
})

// POST a new listing
router.post("/", async (req, res) => {
  try {
    
    const listing = new Listing(req.body);
    const saved = await listing.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Update an Existing Listing
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const options = { new: true, runValidators: true };
    const updated = await Listing.findByIdAndUpdate(req.params.id, updates, options);
    if (!updated) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(400).json({ message: err.message });
  }
});
// DELETE a listing by ID
router.delete("/:id", async (req, res) => {
   try{
    const removed =  await Listing.findByIdAndDelete(req.params.id);
    if(!removed) return res.status(404).json({message: "Listing Not Found"});
    res.json({message: "Listing Deleted"})
   } catch (err){
    console.error(err)
    res.status(400).json({ message: err.message })
   }
})

export default router;