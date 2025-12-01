import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './ChatRoom.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'

function ChatRoom() {
  const { code: roomNameParam } = useParams()
  const roomName = decodeURIComponent(roomNameParam)
  const location = useLocation()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [users, setUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [expireAt, setExpireAt] = useState(null)
  const [showUsers, setShowUsers] = useState(false)
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  
  const username = location.state?.username

  useEffect(() => {
    if (!username) {
      navigate('/join-room')
      return
    }

    // Fetch room info
    fetchRoomInfo()
    
    // Connect to WebSocket
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [roomName, username])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!expireAt) return

    const updateTimer = () => {
      const now = new Date()
      const diff = expireAt - now

      if (diff <= 0) {
        setTimeLeft('Expired')
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/')
        }, 2000)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expireAt, navigate])

  const fetchRoomInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/room/${encodeURIComponent(roomName)}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        if (data.expire_at) {
          const expireDate = new Date(data.expire_at)
          setExpireAt(expireDate)
        }
      } else if (response.status === 410 || response.status === 404) {
        // Room expired or not found
        navigate('/')
      }
    } catch (error) {
      console.error('Failed to fetch room info:', error)
    }
  }

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_BASE}/ws/${encodeURIComponent(roomName)}/${username}`)
    
    ws.onopen = () => {
      setConnected(true)
      console.log('Connected to WebSocket')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          username: data.username,
          content: data.content,
          message_type: data.message_type || 'text',
          timestamp: data.timestamp,
          type: 'message'
        }])
      } else if (data.type === 'user_joined') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `${data.username} joined the room`,
          timestamp: data.timestamp,
          type: 'system'
        }])
        fetchRoomInfo() // Refresh user list
      } else if (data.type === 'user_left') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `${data.username} left the room`,
          timestamp: data.timestamp,
          type: 'system'
        }])
        fetchRoomInfo() // Refresh user list
      }
    }
    
    ws.onclose = () => {
      setConnected(false)
      console.log('Disconnected from WebSocket')
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnected(false)
    }
    
    wsRef.current = ws
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim() && wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        content: newMessage.trim()
      }))
      setNewMessage('')
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (wsRef.current && connected) {
        wsRef.current.send(JSON.stringify({
          type: 'image',
          content: event.target.result
        }))
      }
    }
    reader.readAsDataURL(file)
    e.target.value = '' // Reset input
  }

  const leaveRoom = async () => {
    try {
      await fetch(`${API_BASE}/api/leave-room/${encodeURIComponent(roomName)}/${username}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Failed to leave room:', error)
    } finally {
      if (wsRef.current) {
        wsRef.current.close()
      }
      navigate('/')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const copyRoomName = () => {
    navigator.clipboard.writeText(roomName)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="room-info">
          <h2>{roomName}</h2>
          <button 
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={copyRoomName}
          >
            {copied ? 'Copied!' : 'Copy Name'}
          </button>
        </div>
        <div className="room-actions">
          {timeLeft && (
            <span className="timer">⏱ {timeLeft}</span>
          )}
          <span className="user-count" onClick={() => setShowUsers(true)} style={{cursor: 'pointer'}}>
            {users.length} online
          </span>
          <button className="leave-btn" onClick={leaveRoom}>
            Exit
          </button>
        </div>
      </div>

      {showUsers && (
        <div className="modal-overlay" onClick={() => setShowUsers(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Users in Room</h3>
            <div className="users-list">
              {users.map((user, index) => (
                <div key={index} className="user-item">
                  {user} {user === username && '(you)'}
                </div>
              ))}
            </div>
            <button className="btn" onClick={() => setShowUsers(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.type} ${message.username === username ? 'own' : ''}`}
            >
              {message.type === 'message' ? (
                <>
                  <div className="message-header">
                    <span className="username">{message.username}</span>
                    <span className="timestamp">{formatTime(message.timestamp)}</span>
                  </div>
                  {message.message_type === 'image' ? (
                    <img 
                      src={message.content} 
                      alt="Shared image" 
                      className="message-image"
                      onClick={() => window.open(message.content, '_blank')}
                    />
                  ) : (
                    <div className="message-content">{message.content}</div>
                  )}
                </>
              ) : (
                <div className="system-message">{message.content}</div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={!connected}
            maxLength={500}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-upload"
            disabled={!connected}
          />
          <label 
            htmlFor="image-upload" 
            className={`image-btn ${!connected ? 'disabled' : ''}`}
            title="Send image"
          >
            📷
          </label>
          <button type="submit" disabled={!connected || !newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatRoom