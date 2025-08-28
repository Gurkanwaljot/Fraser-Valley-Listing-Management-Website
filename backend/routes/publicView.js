import express from 'express';
import Listing from '../models/Listing.js';

const router = express.Router();

router.get('/slug/:slug', async (req, res) => {
  const listing = await Listing.findOne({ slug: req.params.slug, status: 'Published' }).lean();
  if (!listing) return res.status(404).json({ message: 'Not found' });
  const { _id, title, address, description, specs, price, cubicasaInfo } = listing;
  res.json({ _id, title, address, description, specs, price, cubicasaInfo });
});

export default router;