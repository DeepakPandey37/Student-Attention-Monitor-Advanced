import { useState } from 'react'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '20px',
  },
  card: {
    background: 'var(--panel)',
    borderRadius: '16px',
    padding: '48px',
    width: '100%',
    maxWidth: '480px',
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  logo: {
    fontSize: '52px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--white)',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--subtext)',
    marginBottom: '36px',
    lineHeight: '1.6',
  },
  label: {
    display: 'block',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--subtext)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--accent)',
    border: '2px solid transparent',
    borderRadius: '10px',
    color: 'var(--white)',
    fontSize: '16px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    marginBottom: '24px',
  },
  permBox: {
    background: 'rgba(15,52,96,0.6)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '28px',
    textAlign: 'left',
  },
  permTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--green)',
    marginBottom: '10px',
  },
  permItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'var(--subtext)',
    marginBottom: '8px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '28px',
  },
  infoBox: {
    background: 'var(--accent)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
  },
  infoNum: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--green)',
  },
  infoLbl: {
    fontSize: '11px',
    color: 'var(--subtext)',
    marginTop: '2px',
  },
  error: {
    color: 'var(--red)',
    fontSize: '13px',
    marginBottom: '12px',
  }
}

export default function WelcomeScreen({ onStart }) {
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleStart = async () => {
    if (!name.trim()) {
      setError('Please enter your name to continue.')
      return
    }
    setError('')
    setLoading(true)

    try {
      
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      onStart(name.trim())
    } catch {
      setError('Camera/Microphone access is required. Please allow permissions and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.card}>
        <div style={styles.logo}>🎓</div>
        <h1 style={styles.title}>Student Attention Monitor</h1>
        <p style={styles.subtitle}>
          AI-powered mock test with real-time facial emotion detection.
          <br />Your attention is tracked throughout the session.
        </p>

        <div style={styles.infoGrid}>
          <div style={styles.infoBox}>
            <div style={styles.infoNum}>10</div>
            <div style={styles.infoLbl}>Questions</div>
          </div>
          <div style={styles.infoBox}>
            <div style={styles.infoNum}>10m</div>
            <div style={styles.infoLbl}>Duration</div>
          </div>
          <div style={styles.infoBox}>
            <div style={styles.infoNum}>GK+CS</div>
            <div style={styles.infoLbl}>Subject</div>
          </div>
        </div>

       
        <label style={styles.label}>Your Name</label>
        <input
          style={styles.input}
          type="text"
          placeholder="e.g. Deepak Pandey"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
          onFocus={e => (e.target.style.borderColor = 'var(--green)')}
          onBlur={e  => (e.target.style.borderColor = 'transparent')}
        />

        
        <div style={styles.permBox}>
          <div style={styles.permTitle}>🔐 Required Permissions</div>
          <div style={styles.permItem}><span>📷</span> Camera — for real-time emotion detection</div>
          <div style={styles.permItem}><span>🎙️</span> Microphone — for session monitoring</div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          className="btn btn-green"
          style={{ width: '100%', fontSize: '16px', padding: '15px' }}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? '⏳ Requesting access...' : '▶  Start Mock Test'}
        </button>
      </div>
    </div>
  )
}
