import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getToken, logout, getMe } from '../services/api.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'

function useIsDesktop() {
  const getMatch = () =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 900px)').matches
      : true

  const [isDesktop, setIsDesktop] = useState(getMatch)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 900px)')
    const onChange = e => setIsDesktop(e.matches)
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange)
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange)
    }
  }, [])

  return isDesktop
}

export default function Nav() {
  const navigate = useNavigate()
  const authed = !!getToken()
  const [user, setUser] = useState(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    let alive = true
    async function load() {
      if (!authed) { setUser(null); return }
      try {
        const data = await getMe()
        if (alive) setUser(data.user || null)
      } catch { /* Avatar optional */ }
    }
    load()
    return () => { alive = false }
  }, [authed])

  function onLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="nav">
      <Link to="/" className="nav-title">VoteApp</Link>

      <ul className="nav-links">
        {authed && (
          <>
            {/* 'end' ⇒ nur exakt /polls ist aktiv */}
            <li><NavLink to="/polls" end>Abstimmungen</NavLink></li>

            {/* Nur auf Desktop rendern */}
            {isDesktop && (
              <li className="nav-newpoll">
                <NavLink to="/polls/new">Neue Abstimmung</NavLink>
              </li>
            )}
          </>
        )}

        {!authed ? (
          <>
            <li><NavLink to="/login">Login</NavLink></li>
            <li><NavLink to="/register">Registrieren</NavLink></li>
          </>
        ) : (
          <li>
            <button
              className="btn-logout"
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              type="button"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="icon-logout" />
              <span className="label">Logout</span>
            </button>
          </li>
        )}
      </ul>

      {/* Avatar: Div mit background-image für sauberes Cropping */}
      <div className="nav-avatar-container" title={user?.username || ''}>
        {authed && user?.avatarUrl ? (
          <div
            className="nav-avatar-bg"
            aria-label={user.username || 'User'}
            style={{ backgroundImage: `url(${user.avatarUrl})` }}
          />
        ) : null}
      </div>
    </nav>
  )
}
