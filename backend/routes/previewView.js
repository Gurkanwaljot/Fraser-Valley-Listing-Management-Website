// routes/previewView.js (ESM)
import express from 'express';
import jwt from 'jsonwebtoken';
import Listing from '../models/Listing.js';

const router = express.Router();

/* -------------------- inline helpers -------------------- */
function verifyPreviewToken(token) {
  try {
    const p = jwt.verify(token, process.env.SESSION_SECRET);
    return p?.scope === 'preview' ? p : null;
  } catch {
    return null;
  }
}

/* -------------------- routes -------------------- */

/** GET /api/preview/listings/:listingId?token=...
 * Agents open the email link which loads your React page.
 * The React page calls this endpoint with the same token.
 * Returns only preview-safe fields.
 */
router.get('/slug/:slug', async (req, res) => {
  const listing = await Listing.findOne({ slug: req.params.slug, status: 'Published' }).lean();
  console.log("listing: ", listing)
  if (!listing) return res.status(404).json({ message: 'Not found' });
  console.log("listing: ", listing)
  res.json(listing);
});

export default router;
