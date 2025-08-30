import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    username: { type: String, required: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' } // ← optionales Bild / Profilbild-URL
  },
  { timestamps: true }
)

UserSchema.method('checkPassword', function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash)
})

UserSchema.method('toPublic', function () {
  return {
    id: String(this._id),
    email: this.email,
    username: this.username,
    avatarUrl: this.avatarUrl || ''
  }
})

export const User = mongoose.model('User', UserSchema)
