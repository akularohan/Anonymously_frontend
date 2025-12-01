import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">ANONYMOUSLY</h1>
        <p className="subtitle">Secure • Private • Ephemeral</p>
        <p className="tagline">Talk to anyone, anonymously.<br />Like it never existed.</p>
        
        <div className="button-group">
          <button 
            className="btn" 
            onClick={() => navigate('/join-room')}
          >
            Join Room
          </button>
          <button 
            className="btn" 
            onClick={() => navigate('/create-room')}
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home