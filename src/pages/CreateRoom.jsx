import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function CreateRoom() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    roomName: '',
    password: '',
    username: '',
    expireMinutes: 60
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_name: formData.roomName,
          password: formData.password || null,
          username: formData.username,
          expire_minutes: parseInt(formData.expireMinutes)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create room')
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
        
        <h1 className="title">CREATE ROOM</h1>
        
        <form onSubmit={handleSubmit}>
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

          <div className="input-group">
            <label>Password (optional)</label>
            <input
              type="password"
              placeholder="Leave empty for no password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

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

          <div className="input-group">
            <label>Room Expiry</label>
            <select
              value={formData.expireMinutes}
              onChange={(e) => setFormData({ ...formData, expireMinutes: e.target.value })}
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={180}>3 hours</option>
              <option value={360}>6 hours</option>
              <option value={720}>12 hours</option>
              <option value={1440}>1 day</option>
            </select>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoom