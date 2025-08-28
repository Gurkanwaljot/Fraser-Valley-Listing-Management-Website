// routes/auth.js (ESM)
import express from 'express';
import jwt from 'jsonwebtoken';
import { getAdminFromReq } from '../lib/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Sets httpOnly cookie "admin_session" if credentials are valid.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  // Replace this with your real user lookup + password check.
  const ok =
    email === process.env.REACT_APP_ADMIN_EMAIL &&
    password === process.env.REACT_APP_ADMIN_PASSWORD;

  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { role: 'admin', sub: email },
    process.env.REACT_APP_SESSION_SECRET
  );

  res.cookie('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    // ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {})
  });

  return res.json({ ok: true, role: 'admin' });
});

/** POST /api/auth/logout — clears the cookie */
router.post('/logout', (_req, res) => {
  res.clearCookie('admin_session', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {})
  });
  res.json({ ok: true });
});

/** GET /api/auth/me — used by the frontend probe in App.js */
router.get('/me', (req, res) => {
  const u = getAdminFromReq(req);
  if (!u) return res.status(401).json({ message: 'not admin' });
  res.json({ ok: true, role: 'admin', via: u.via });
});

export default router;