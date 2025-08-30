import React from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../services/api.js'

export default function Home() {
  const authed = !!getToken()
  return (
    <div className="page">
      <h1>Willkommen</h1>
      {!authed ? (
        <p>
          Bitte <Link to="/login">anmelden</Link> oder <Link to="/register">registrieren</Link>, um fortzufahren.
        </p>
      ) : (
        <p>
          Weiter zu <Link to="/polls">Abstimmungen</Link>.
        </p>
      )}
    </div>
  )
}
