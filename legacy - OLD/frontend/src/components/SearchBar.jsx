import { useState } from 'react'

export default function SearchBar({ onSearch, error, onClearError }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const sym = value.trim().toUpperCase()
    if (sym) {
      onSearch(sym)
      setValue('')
    }
  }

  return (
    <div style={{ flex: 1, maxWidth: '420px' }}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={e => { setValue(e.target.value); onClearError() }}
          placeholder="Search symbol (e.g. AAPL, SHOP.TO)..."
          style={{
            width: '100%',
            padding: '7px 14px',
            backgroundColor: '#0d1117',
            border: `1px solid ${error ? '#f85149' : '#30363d'}`,
            borderRadius: '6px',
            color: '#e6edf3',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = '#58a6ff' }}
          onBlur={e => { e.target.style.borderColor = error ? '#f85149' : '#30363d' }}
        />
      </form>
      {error && (
        <div style={{ color: '#f85149', fontSize: '12px', marginTop: '4px' }}>{error}</div>
      )}
    </div>
  )
}
