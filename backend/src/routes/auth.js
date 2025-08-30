import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function makeToken(user) {
  const payload = { id: String(user._id), email: user.email, username: user.username }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// POST /api/auth/register
// Body: { email, username, password, avatarUrl? }  (alias: imageUrl wird auch akzeptiert)
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body || {}
    // Abwärtskompatible Feldnamen
    const avatarUrl = (req.body?.avatarUrl ?? req.body?.imageUrl ?? '').toString().trim()

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username und password sind erforderlich.' })
    }

    const exists = await User.findOne({
      $or: [{ email: String(email).toLowerCase() }, { username: String(username) }]
    })
    if (exists) return res.status(409).json({ error: 'E-Mail oder Benutzername bereits vergeben.' })

    const passwordHash = await bcrypt.hash(String(password), 10)
    const user = await User.create({
      email: String(email).toLowerCase(),
      username: String(username),
      passwordHash,
      avatarUrl: avatarUrl || ''
    })

    const token = makeToken(user)
    res.status(201).json({ token, user: user.toPublic() })
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'email/username'
      return res.status(409).json({ error: `${field} bereits vergeben.` })
    }
    console.error('Register error:', err)
    res.status(500).json({ error: 'Serverfehler' })
  }
})

// POST /api/auth/login
// Body: { emailOrUsername, password }
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body || {}
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'emailOrUsername und password sind erforderlich.' })
    }

    let user = await User.findOne({ email: String(emailOrUsername).toLowerCase() })
    if (!user) user = await User.findOne({ username: String(emailOrUsername) })
    if (!user) return res.status(401).json({ error: 'Ungültige Anmeldedaten' })

    const ok = await user.checkPassword(String(password))
    if (!ok) return res.status(401).json({ error: 'Ungültige Anmeldedaten' })

    const token = makeToken(user)
    res.json({ token, user: user.toPublic() })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Serverfehler' })
  }
})

// GET /api/auth/me  (auth required)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) return res.status(404).json({ error: 'User nicht gefunden' })
  res.json({ user: user.toPublic() })
})

export default router
