import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  let raw = req.headers['authorization'] || ''
  if (raw.startsWith('Bearer ')) raw = raw.slice(7).trim()
  const token = raw.trim()

  if (!token) return res.status(401).json({ error: 'Kein Token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.id, email: payload.email, username: payload.username }
    next()
  } catch (err) {
    console.error('Auth verify error:', err.message)
    return res.status(401).json({ error: 'Ungültiger Token' })
  }
}

/**
 * Optionales Middleware-Variant: setzt req.user, wenn Token da ist, sonst ignoriert.
 * Nützlich für Endpunkte, die auch ohne Login funktionieren sollen.
 */
export function attachUserIfPresent(req, _res, next) {
  try {
    let raw = req.headers['authorization'] || ''
    if (raw.startsWith('Bearer ')) raw = raw.slice(7).trim()
    const token = raw.trim()
    if (!token) return next()
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.id, email: payload.email, username: payload.username }
  } catch (_) {
    // still proceed without user
  }
  next()
}
