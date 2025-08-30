import { Router } from 'express'
import mongoose from 'mongoose'
import { Poll } from '../models/Poll.js'
import { attachUserIfPresent, requireAuth } from '../middleware/auth.js'

const router = Router()

function countVotes(pollDoc) {
  const counts = {}
  for (const opt of pollDoc.options) counts[String(opt._id)] = 0
  for (const v of pollDoc.votes) {
    const key = String(v.optionId)
    if (counts[key] != null) counts[key]++
  }
  return counts
}

function coerceBool(v) {
  return v === true || v === 'true' || v === 1 || v === '1'
}

// optionaler User aus Token für alle Poll-Routen
router.use(attachUserIfPresent)

// GET /api/polls
router.get('/', async (_req, res) => {
  const polls = await Poll.find().sort({ createdAt: -1 }).lean()
  const list = polls.map(p => {
    const options = (p.options || []).map(o => ({ id: String(o._id), text: o.text }))
    const counts = (() => {
      const c = {}
      for (const o of p.options || []) c[String(o._id)] = 0
      for (const v of p.votes || []) {
        const key = String(v.optionId)
        if (c[key] != null) c[key]++
      }
      return c
    })()
    return {
      id: String(p._id),
      title: p.title,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      allowMultiple: !!p.allowMultiple,
      createdAt: p.createdAt?.toISOString?.() || p.createdAt,
      creator: p.creator || null,
      options,
      counts
    }
  })
  res.json(list)
})

// POST /api/polls
// Body: { title, description?, imageUrl?, allowMultiple?, options:[string], creator?:{id,username} }
router.post('/', async (req, res) => {
  const { title, description, options, imageUrl, allowMultiple } = req.body || {}
  if (!title || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Titel und mindestens 2 Optionen sind erforderlich.' })
  }

  let creator = null
  if (req.body?.creator && req.body.creator.id) {
    creator = { id: String(req.body.creator.id), username: String(req.body.creator.username || '') }
  } else if (req.user) {
    creator = { id: String(req.user.id), username: String(req.user.username || '') }
  }

  const poll = await Poll.create({
    title: String(title),
    description: description ? String(description) : '',
    imageUrl: imageUrl ? String(imageUrl) : '',
    allowMultiple: coerceBool(allowMultiple),
    creator,
    options: options.map(txt => ({ text: String(txt) }))
  })

  const publicPoll = poll.toPublic()
  const counts = {}
  for (const o of publicPoll.options) counts[o.id] = 0

  res.status(201).json({ ...publicPoll, counts })
})

// GET /api/polls/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Poll nicht gefunden.' })
  const poll = await Poll.findById(id)
  if (!poll) return res.status(404).json({ error: 'Poll nicht gefunden.' })
  const publicPoll = poll.toPublic()
  const counts = countVotes(poll)
  res.json({ ...publicPoll, counts })
})

// PATCH /api/polls/:id  (nur Titel; nur Ersteller; nur solange 0 Stimmen)
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { title } = req.body || {}

  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Poll nicht gefunden.' })
  const poll = await Poll.findById(id)
  if (!poll) return res.status(404).json({ error: 'Poll nicht gefunden.' })

  // Nur der Ersteller darf
  if (!poll.creator?.id) {
    return res.status(403).json({ error: 'Titeländerung nicht erlaubt (kein Ersteller gesetzt).' })
  }
  if (String(poll.creator.id) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Nur der Ersteller darf den Titel ändern.' })
  }

  // Sobald eine Stimme existiert → gesperrt
  if ((poll.votes?.length || 0) > 0) {
    return res.status(409).json({ error: 'Titel kann nach der ersten Stimme nicht mehr geändert werden.' })
  }

  if (!title) return res.status(400).json({ error: 'Neuer Titel fehlt.' })

  poll.title = String(title)
  await poll.save()
  res.json(poll.toPublic())
})

// POST /api/polls/:id/votes
// Body: { optionId, by? }
// - Einzelauswahl: erneuter Klick auf andere Option ersetzt alte Stimme.
// - Mehrfachauswahl: erneuter Klick auf dieselbe Option entfernt die Stimme (Toggle).
router.post('/:id/votes', async (req, res) => {
  const { id } = req.params
  const { optionId } = req.body || {}

  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Poll nicht gefunden.' })
  const poll = await Poll.findById(id)
  if (!poll) return res.status(404).json({ error: 'Poll nicht gefunden.' })

  // Option existiert?
  const exists = poll.options.some(o => String(o._id) === String(optionId))
  if (!exists) return res.status(400).json({ error: 'Ungültige Option' })

  // Nutzer identifizieren (aus Body oder Token)
  let byUser = undefined
  if (req.body?.by?.id) {
    byUser = { id: String(req.body.by.id), username: String(req.body.by.username || '') }
  } else if (req.user) {
    byUser = { id: String(req.user.id), username: String(req.user.username || '') }
  }

  // Falls kein User identifizierbar, einfach addieren (dein UI ist aber geschützt → user vorhanden)
  if (!byUser?.id) {
    poll.votes.push({ optionId: new mongoose.Types.ObjectId(optionId), at: new Date() })
    await poll.save()
    const counts = countVotes(poll)
    return res.status(201).json({ ok: true, counts })
  }

  if (!poll.allowMultiple) {
    // EINZELAUSWAHL: vorhandene Stimme (egal welche Option) durch neue Option ersetzen
    const idx = poll.votes.findIndex(v => v.by?.id === byUser.id)
    if (idx >= 0) {
      poll.votes[idx].optionId = new mongoose.Types.ObjectId(optionId)
      poll.votes[idx].at = new Date()
      await poll.save()
      const counts = countVotes(poll)
      return res.status(200).json({ ok: true, replaced: true, counts })
    }
    // noch keine Stimme → hinzufügen
    poll.votes.push({ optionId: new mongoose.Types.ObjectId(optionId), at: new Date(), by: byUser })
    await poll.save()
    const counts = countVotes(poll)
    return res.status(201).json({ ok: true, counts })
  } else {
    // MEHRFACH: erneuter Klick auf dieselbe Option → Stimme entfernen (Toggle)
    const idx = poll.votes.findIndex(v => v.by?.id === byUser.id && String(v.optionId) === String(optionId))
    if (idx >= 0) {
      poll.votes.splice(idx, 1)
      await poll.save()
      const counts = countVotes(poll)
      return res.status(200).json({ ok: true, removed: true, counts })
    }
    // sonst hinzufügen
    poll.votes.push({ optionId: new mongoose.Types.ObjectId(optionId), at: new Date(), by: byUser })
    await poll.save()
    const counts = countVotes(poll)
    return res.status(201).json({ ok: true, counts })
  }
})

// DELETE /api/polls/:id  (nur Ersteller)
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Poll nicht gefunden.' })

  const poll = await Poll.findById(id)
  if (!poll) return res.status(404).json({ error: 'Poll nicht gefunden.' })

  if (!poll.creator?.id) return res.status(403).json({ error: 'Löschen nicht erlaubt.' })
  if (String(poll.creator.id) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Nur der Ersteller darf diese Umfrage löschen.' })
  }

  await Poll.deleteOne({ _id: id })
  res.json({ ok: true })
})

// (Optional) GET /api/polls/:id/results
router.get('/:id/results', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Poll nicht gefunden.' })
  const poll = await Poll.findById(id)
  if (!poll) return res.status(404).json({ error: 'Poll nicht gefunden.' })
  res.json({ id: String(poll._id), counts: countVotes(poll) })
})

export default router
