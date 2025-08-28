// lib/auth.js (ESM)
import jwt from 'jsonwebtoken';

/** Read admin from cookie/bearer; return payload or null */
export function getAdminFromReq(req) {
  // A) Cookie session (preferred)
  const cookieToken = req.cookies?.admin_session;
  console.log("cookieToken: ", cookieToken)
  if (cookieToken) {
    try {
      const p = jwt.verify(cookieToken, process.env.REACT_APP_SESSION_SECRET);
      if (p?.role === 'admin') return { ...p, via: 'cookie' };
    } catch {}
  }

  // B) Bearer (optional, only if you use it)
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const bearer = auth.slice(7);
    try {
      const p = jwt.verify(bearer, process.env.REACT_APP_SESSION_SECRET);
      if (p?.role === 'admin') return { ...p, via: 'bearer' };
    } catch {}
  }

  return null;
}

export function requireAdmin(req, res, next) {
  const u = getAdminFromReq(req);
  if (!u) return res.status(401).json({ message: 'Auth required' });
  req.user = u;
  next();
}
