import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api.js'

export default function Login() {
  const [emailOrUsername, setUser] = useState('')
  const [password, setPwd] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login({ emailOrUsername, password })
      navigate('/polls')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page form-page">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={onSubmit} className="form" autoComplete="on">
        <label>
          E-Mail oder Benutzername
          <input
            value={emailOrUsername}
            onChange={e=>setUser(e.target.value)}
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
            autoComplete="current-password"
          />
        </label>
        <button type="submit">Anmelden</button>
      </form>
      <p>Noch kein Konto? <Link to="/register">Registrieren</Link></p>
    </div>
  )
}
