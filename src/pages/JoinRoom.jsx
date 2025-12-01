import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function JoinRoom() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: room name, 2: password (if needed), 3: username
  const [formData, setFormData] = useState({
    roomName: '',
    password: '',
    username: ''
  })
  const [needsPassword, setNeedsPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const checkRoom = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/room/${encodeURIComponent(formData.roomName)}`)
      
      if (!response.ok) {
        throw new Error('Room not found')
      }

      const data = await response.json()
      setNeedsPassword(data.has_password)
      setStep(data.has_password ? 2 : 3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (step === 1) {
      checkRoom()
      return
    }

    if (step === 2) {
      setStep(3)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/join-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_name: formData.roomName,
          password: formData.password || null,
          username: formData.username
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to join room')
      }

      const data = await response.json()
      navigate(`/room/${encodeURIComponent(data.room_name)}`, { 
        state: { 
          username: formData.username, 
          roomName: data.room_name 
        } 
      })
    } catch (err) {
      setError(err.message)
      if (err.message === 'Incorrect password') {
        setStep(2)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        
        <h1 className="title">JOIN ROOM</h1>
        
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="input-group">
              <label>Room Name</label>
              <input
                type="text"
                placeholder="Enter room name"
                value={formData.roomName}
                onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter room password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          {step === 3 && (
            <div className="input-group">
              <label>Your Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Loading...' : step === 3 ? 'Join Room' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JoinRoom