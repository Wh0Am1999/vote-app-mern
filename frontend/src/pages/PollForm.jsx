import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPoll } from '../services/api.js'

export default function PollForm() {
  const [title, setTitle] = useState('')
  const [description, setDesc] = useState('')
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [options, setOptions] = useState(['', ''])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function setOption(i, val) {
    const next = options.slice()
    next[i] = val
    setOptions(next)
  }

  function addOption() {
    setOptions([...options, ''])
  }

  function removeOption(i) {
    if (i < 2) return
    if (options.length <= 2) return
    const next = options.slice()
    next.splice(i, 1)
    setOptions(next)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const clean = options.map(s => s.trim()).filter(Boolean)
    if (clean.length < 2) {
      setError('Bitte mindestens zwei Optionen angeben.')
      return
    }
    try {
      const p = await createPoll({
        title: title.trim(),
        description: description.trim(),
        allowMultiple,
        options: clean
        // kein imageUrl mehr
      })
      navigate(`/polls/${p.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page form-page">
      <h2>Neue Abstimmung</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={onSubmit} className="form">
        <label>
          Titel
          <input value={title} onChange={e=>setTitle(e.target.value)} required />
        </label>

        <label>
          Beschreibung (optional)
          <textarea value={description} onChange={e=>setDesc(e.target.value)} rows={3} />
        </label>

        <div className="field-inline">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={e=>setAllowMultiple(e.target.checked)}
            />
            Mehrfachauswahl erlauben
          </label>
        </div>

        <div className="options">
          <div className="opt-head">Optionen (mind. 2)</div>
          {options.map((val, i) => (
            <div className="opt-row" key={i}>
              <input
                value={val}
                onChange={e=>setOption(i, e.target.value)}
                placeholder={`Option ${i+1}`}
                required={i < 2}
              />
              {i >= 2 && (
                <button
                  type="button"
                  className="opt-remove"
                  onClick={() => removeOption(i)}
                  title="Option entfernen"
                  aria-label={`Option ${i+1} entfernen`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn" onClick={addOption}>Weitere Option</button>
        </div>

        <button type="submit">Erstellen</button>
      </form>
    </div>
  )
}
