import mongoose from 'mongoose'

export async function connectDB(url) {
  if (!url) throw new Error('MONGO_URL fehlt')
  mongoose.set('strictQuery', true)
  await mongoose.connect(url, {
    // Optionen falls nötig
  })
  console.log('MongoDB connected:', url)
}
