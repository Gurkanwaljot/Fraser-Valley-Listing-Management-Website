// routes/preview.js (ESM)
import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Listing from '../models/Listing.js';
import Agent from '../models/Agent.js';

const router = express.Router();

/* -------------------- helpers -------------------- */

console.log("process.env.SESSION_SECRET: ", process.env.REACT_APP_SESSION_SECRET)
// create a short, scoped token (no OTP; just a signed link)
function createPreviewToken({ listingId, agentId }) {
  return jwt.sign(
    { scope: 'preview', listingId: String(listingId), agentId: String(agentId || '') },
    process.env.REACT_APP_SESSION_SECRET
  );
}

function slugifyAddress(address = '', fallback = '') {
  const base = String(address).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || `listing-${String(fallback).slice(-6)}`;
}

async function ensureSlug(listing) {
  if (listing.slug) return listing.slug;
  const base = slugifyAddress(listing.address, listing._id);
  let slug = base, n = 1;
  while (await Listing.exists({ slug })) slug = `${base}-${n++}`;
  await Listing.updateOne({ _id: listing._id }, { $set: { slug } });
  return slug;
}

// nodemailer transport (falls back to JSON transport if SMTP_URL missing)

const transport = nodemailer.createTransport({
  host: 'mail.privateemail.com',                  // mail.privateemail.com
  port: 465,   // 465 or 587
  secure: true, // true for 465
  auth: {
    user: 'contact@fraservalleyphotography.pro',                // full mailbox
    pass: 'uest1onQ?',
  },
});

// One-time boot check
transport.verify((err) => {
  if (err) console.error('[email] SMTP verify failed:', err);
  else console.log('[email] SMTP ready');
});

async function sendPreviewEmail({ to, agentName, listingTitle, publicUrl }) {
  const name = agentName || 'there';
  const title = listingTitle || 'your listing';
  return transport.sendMail({
    from: 'contact@fraservalleyphotography.pro',
    to,
    subject: 'Your listing preview is ready',
    html: `
      <p>Hi ${name},</p>
      <p>Your listing for <strong>${title}</strong> is ready.</p>
      <p><a href="${publicUrl}" style="display:inline-block;padding:10px 16px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">Open Listing</a></p>
      <p>Thanks for doing business with us!</p>
    `,
  });
}

/* -------------------- routes -------------------- */

/** POST /api/preview/send
 * Body (choose one):
 *  - { listingId, agentId }  // preferred
 *  - { listingId, email, agentName } // fallback if you only have email
 * Admin-only; emails a scoped preview link to the agent.
 */
router.post('/send', async (req, res) => {
  try {
    const { listingId, agentId, email, agentName } = req.body;
    if (!listingId) return res.status(400).json({ message: 'listingId is required' });

    const listing = await Listing.findById(listingId).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    let toEmail = email;
    let toName = agentName;

    if (agentId) {
      const agent = await Agent.findById(agentId).lean();
      if (!agent?.email) return res.status(400).json({ message: 'Agent email missing' });
      toEmail = agent.email;
      toName = agent.name;
    }

    if (!toEmail) return res.status(400).json({ message: 'Agent email required' });
     // Ensure slug
    const slug = await ensureSlug(listing);
    const token = createPreviewToken({ listingId, agentId });
    console.log(token);
    const base  = (process.env.REACT_APP_CLIENT_BASE || '').replace(/\/+$/,'');
    const publicUrl = `${base}/${slug}?t=${encodeURIComponent(token)}`;
    const info = await sendPreviewEmail({
      to: toEmail,
      agentName: toName,
      listingTitle: listing.title,
      publicUrl,
    });
    console.log('[email] messageId:', info.messageId);
    console.log('[email] accepted:', info.accepted);
    console.log('[email] rejected:', info.rejected);
    console.log('[email] response:', info.response);

     // Consider "accepted" as success signal; still publish on 2xx
    const accepted = Array.isArray(info.accepted) ? info.accepted.length : 0;

    // Immediately publish the listing
    await Listing.updateOne(
      { _id: listingId },
      { $set: { status: 'Published', publishedAt: new Date(), slug } }
    );

    return res.json({ ok: true, url: publicUrl, accepted });
  } catch (e) {
    console.error('POST /api/preview/send error:', e);
    return res.status(500).json({ message: 'Failed to send email' });
  }
});

export default router;