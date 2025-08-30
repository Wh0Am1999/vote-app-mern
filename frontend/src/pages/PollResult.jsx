import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPoll, updatePollTitle, vote, getMe, deletePoll } from '../services/api.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

export default function PollResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState(null)
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')

  async function load() {
    try {
      setLoading(true)
      const p = await getPoll(id)
      setPoll(p)
      setNewTitle(p.title)
      try {
        const meRes = await getMe()
        setMe(meRes.user)
      } catch { /* ignorieren */ }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const counts = poll?.counts || {}
  const totalVotes = useMemo(() => {
    return Object.values(counts).reduce((sum, n) => sum + Number(n || 0), 0)
  }, [counts])

  const byOptionId = useMemo(() => {
    const map = {}
    poll?.options?.forEach(o => { map[o.id] = o })
    return map
  }, [poll])

  async function onVote(optionId) {
    setError('')
    try {
      await vote({ pollId: id, optionId })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onUpdateTitle(e) {
    e.preventDefault()
    setError('')
    try {
      const updated = await updatePollTitle(id, { title: newTitle }) // Ersteller-Check serverseitig
      setPoll({ ...poll, title: updated.title })
    } catch (e) {
      setError(e.message)
    }
  }

  async function onDelete() {
    if (!window.confirm('Diese Umfrage wirklich löschen?')) return
    try {
      await deletePoll(id)
      navigate('/polls')
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div className="page"><p>Lade…</p></div>
  if (error) return <div className="page"><div className="error">{error}</div></div>
  if (!poll) return <div className="page"><p>Poll nicht gefunden.</p></div>

  const isCreator = me?.id && poll?.creator?.id && String(me.id) === String(poll.creator.id)
  const canEditTitle = isCreator && totalVotes === 0

  return (
    <div className="page">
      <div className="poll-head" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <h2 style={{ marginRight: 'auto' }}>{poll.title}</h2>

        {canEditTitle && (
          <form onSubmit={onUpdateTitle} className="inline-form">
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
            <button type="submit">Titel speichern</button>
          </form>
        )}
      </div>

      {poll.description && <p className="desc">{poll.description}</p>}
      {poll.imageUrl && <p><img src={poll.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} /></p>}

      <div className="options">
        <h3>Abstimmen</h3>
        <p style={{ marginTop: -8, color: '#555' }}>
          {poll.allowMultiple ? 'Mehrfachauswahl erlaubt' : 'Einzelauswahl'}
        </p>
        <div className="opt-grid">
          {poll.options.map(o => (
            <button key={o.id} className="opt-btn" onClick={() => onVote(o.id)}>
              {o.text}
            </button>
          ))}
        </div>
      </div>

      <div className="results">
        <h3>Resultate</h3>
        <ul className="result-list">
          {Object.entries(counts).map(([optId, n]) => (
            <li key={optId}>
              <span className="opt-text">{byOptionId[optId]?.text ?? 'Option'}</span>
              <span className="opt-count">{n}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Aktionen unten: Zurück + (falls Ersteller) Löschen rechts daneben */}
      <div className="footer-actions">
        <button className="btn" onClick={() => navigate('/polls')} title="Zurück zur Liste">
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 8 }} />
          <span>Zurück zur Liste</span>
        </button>
        {isCreator && (
          <button className="btn-danger" onClick={onDelete} title="Umfrage löschen">
            <FontAwesomeIcon icon={faTrash} />
            <span>Umfrage löschen</span>
          </button>
        )}
      </div>
    </div>
  )
}
