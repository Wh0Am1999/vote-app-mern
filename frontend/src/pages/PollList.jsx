import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPolls } from '../services/api.js'
import ActionButton from '../components/ActionButton.jsx'

function cmpTitleAsc(a, b) {
  return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
}
function cmpTitleDesc(a, b) { return -cmpTitleAsc(a, b) }
function timeOf(x) { return new Date(x.createdAt || x.created_at || 0).getTime() || 0 }

function sortItems(items, mode) {
  const arr = [...items]
  switch (mode) {
    case 'oldest':
      arr.sort((a, b) => timeOf(a) - timeOf(b))
      break
    case 'az':
      arr.sort(cmpTitleAsc)
      break
    case 'za':
      arr.sort(cmpTitleDesc)
      break
    case 'newest':
    default:
      arr.sort((a, b) => timeOf(b) - timeOf(a))
      break
  }
  return arr
}

export default function PollList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortMode, setSortMode] = useState('newest')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setItems(await getPolls())
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const sorted = useMemo(() => sortItems(items, sortMode), [items, sortMode])

  if (loading) return <div className="page"><p>Lade…</p></div>
  if (error) return <div className="page"><div className="error">{error}</div></div>

  return (
    <div className="page">
      <div className="list-header list-header-stacked">
        <h2>Abstimmungen</h2>

        <div className="filter">
          <label htmlFor="poll-sort" className="sr-only">Sortieren</label>
          <select
            id="poll-sort"
            className="filter-select"
            value={sortMode}
            onChange={e => setSortMode(e.target.value)}
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>
      </div>

      <div className="poll-list">
        {sorted.length === 0 && <p>Keine Abstimmungen vorhanden.</p>}
        {sorted.map(p => (
          <Link key={p.id} to={`/polls/${p.id}`} className="poll-card">
            <h3>{p.title}</h3>
            {p.description && <p className="desc">{p.description}</p>}
            <div className="meta">
              <span>{new Date(p.createdAt).toLocaleString()}</span>
              {p.creator?.username && <span>· {p.creator.username}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* FAB: nur auf der Liste; via CSS auf Desktop versteckt */}
      <ActionButton />
    </div>
  )
}
