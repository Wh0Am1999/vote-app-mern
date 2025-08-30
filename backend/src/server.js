import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './db.js'
import pollsRouter from './routes/polls.js'
import authRouter from './routes/auth.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/polls', pollsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const PORT = process.env.PORT || 3000
const MONGO_URL = process.env.MONGO_URL

connectDB(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('Mongo connect error:', err)
    process.exit(1)
  })
