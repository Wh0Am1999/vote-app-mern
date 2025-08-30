import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/api.js'

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPwd] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('') // ← optionales Bild
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await register({ email, username, password, avatarUrl })
      navigate('/polls')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page form-page">
      <h2>Registrieren</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={onSubmit} className="form" autoComplete="on">
        <label>
          E-Mail
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Benutzername
          <input
            value={username}
            onChange={e=>setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Passwort
          <input
            type="password"
            value={password}
            onChange={e=>setPwd(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          Bild-URL (optional)
          <input
            type="url"
            value={avatarUrl}
            onChange={e=>setAvatarUrl(e.target.value)}
            placeholder="https://…/profil.jpg"
            inputMode="url"
            autoComplete="url"
          />
        </label>
        <button type="submit">Konto erstellen</button>
      </form>
      <p>Schon registriert? <Link to="/login">Login</Link></p>
    </div>
  )
}
