import mongoose from 'mongoose'

const OptionSchema = new mongoose.Schema(
  { text: { type: String, required: true } },
  { _id: true, timestamps: false }
)

const VoteSchema = new mongoose.Schema(
  {
    optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    at: { type: Date, default: Date.now },
    by: {
      id: { type: String },
      username: { type: String }
    }
  },
  { _id: false, timestamps: false }
)

const PollSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    allowMultiple: { type: Boolean, default: false }, // ← NEU
    createdAt: { type: Date, default: Date.now },
    creator: {
      id: { type: String },
      username: { type: String }
    },
    options: { type: [OptionSchema], validate: v => Array.isArray(v) && v.length >= 2 },
    votes: { type: [VoteSchema], default: [] }
  },
  { timestamps: false }
)

PollSchema.method('toPublic', function () {
  const doc = this
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description || '',
    imageUrl: doc.imageUrl || '',
    allowMultiple: !!doc.allowMultiple,
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    creator: doc.creator || null,
    options: (doc.options || []).map(o => ({ id: String(o._id), text: o.text }))
  }
})

export const Poll = mongoose.model('Poll', PollSchema)
