const API_ROOT = import.meta.env.VITE_API_ROOT || ""
const API_BASE = `${API_ROOT}/api`

export function getToken() { return localStorage.getItem('token') || '' }
function authHeader() { const t = getToken(); return t ? { authorization: `Bearer ${t}` } : {} }

async function handle(res) {
  if (!res.ok) { const txt = await res.text(); throw new Error(`HTTP ${res.status}: ${txt}`) }
  return res.json()
}

/* Auth */
export async function register({ email, username, password, avatarUrl = '' }) {
  const body = { email, username, password }
  if (avatarUrl?.trim()) body.avatarUrl = avatarUrl.trim()
  const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await handle(res); if (data?.token) localStorage.setItem('token', data.token); return data
}
export async function login({ emailOrUsername, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emailOrUsername, password }) })
  const data = await handle(res); if (data?.token) localStorage.setItem('token', data.token); return data
}
export async function getMe() { const res = await fetch(`${API_BASE}/auth/me`, { headers: { ...authHeader() } }); return handle(res) }
export function logout() { localStorage.removeItem('token') }

/* Polls */
export async function getPolls() { const res = await fetch(`${API_BASE}/polls`, { headers: { ...authHeader() } }); return handle(res) }
export async function getPoll(id) { const res = await fetch(`${API_BASE}/polls/${id}`, { headers: { ...authHeader() } }); return handle(res) }
export async function createPoll({ title, description = '', options = [], allowMultiple = false }) {
  const res = await fetch(`${API_BASE}/polls`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ title, description, options, allowMultiple }) })
  return handle(res)
}
export async function updatePollTitle(id, { title, creatorId }) {
  const res = await fetch(`${API_BASE}/polls/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ title, creatorId }) })
  return handle(res)
}
export async function vote({ pollId, optionId, by }) {
  const res = await fetch(`${API_BASE}/polls/${pollId}/votes`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ optionId, by }) })
  return handle(res)
}
export async function deletePoll(id) {
  const res = await fetch(`${API_BASE}/polls/${id}`, { method: 'DELETE', headers: { ...authHeader() } })
  return handle(res)
}
