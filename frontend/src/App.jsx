import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PollList from './pages/PollList.jsx'
import PollForm from './pages/PollForm.jsx'
import PollResult from './pages/PollResult.jsx'
import { getToken } from './services/api.js'

function Protected({ children }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/polls"
            element={
              <Protected>
                <PollList />
              </Protected>
            }
          />
          <Route
            path="/polls/new"
            element={
              <Protected>
                <PollForm />
              </Protected>
            }
          />
          <Route
            path="/polls/:id"
            element={
              <Protected>
                <PollResult />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}
