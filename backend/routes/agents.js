import express from "express";
import Agent from "../models/Agent.js";

const router = express.Router();

// GET all agents
router.get("/", async (req, res) => {
  try {
    const { ids } = req.query;
    let agents;
    if (ids) {
      const idArray = ids.split(",");
      agents = await Agent.find({ _id: { $in: idArray } }).sort({ createdAt: -1 });
    } else {
      agents = await Agent.find().sort({ createdAt: -1 });
    }
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Get a Agent by ID
router.get("/:id", async (req, res) => {
  try{
    const listing = await Agent.findById(req.params.id);
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

// POST a new agent
router.post("/", async (req, res) => {
  try {
    const agent = new Agent(req.body);
    const saved = await agent.save();
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
    console.log("updates: ", updates);
    console.log("Agent ID: ", req.params.id);
    const options = { new: true, runValidators: true };
    const updated = await Agent.findByIdAndUpdate(req.params.id, updates, options);
    if (!updated) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE a agent by using the id
router.delete('/:id', async (req, res) => {
  try{
    const removed =  await Agent.findByIdAndDelete(req.params.id);
    if(!removed) return res.status(404).json({message: "Agent Not Found"});
    res.json({message: "Agent Deleted"})
  } catch (err){
    console.error(err)
    res.status(400).json({ message: err.message })
  }
})

export default router;
