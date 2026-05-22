import { useState } from 'react'
import { supabase } from '../lib/supabase'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#e6edf3',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Account created — check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0d1117',
    }}>
      <div style={{
        width: '360px',
        backgroundColor: '#161b22',
        border: '1px solid #21262d',
        borderRadius: '10px',
        padding: '36px 32px',
      }}>
        <h1 style={{ color: '#58a6ff', fontSize: '20px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
          Ghost Trade
        </h1>
        <p style={{ color: '#8b949e', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', color: '#8b949e', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#58a6ff')}
              onBlur={e => (e.target.style.borderColor = '#30363d')}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#8b949e', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#58a6ff')}
              onBlur={e => (e.target.style.borderColor = '#30363d')}
            />
          </div>

          {error && (
            <div style={{ color: '#f85149', fontSize: '13px', backgroundColor: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '6px', padding: '8px 12px' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ color: '#3fb950', fontSize: '13px', backgroundColor: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: '6px', padding: '8px 12px' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: loading ? '#21262d' : '#238636',
              color: loading ? '#8b949e' : '#fff',
              border: '1px solid rgba(240,246,252,0.1)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              marginTop: '4px',
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#8b949e' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
            style={{ color: '#58a6ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0 }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
