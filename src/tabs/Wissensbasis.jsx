// src/tabs/Wissensbasis.jsx
import { useState, useEffect } from 'react'
import { knowledge } from '../lib/firebase'
import { api } from '../lib/api'

function renderMarkdown(text) {
  // Simple markdown renderer
  return text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} style={{ marginTop: 20, marginBottom: 8 }}>{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} style={{ marginTop: 14, marginBottom: 6 }}>{line.slice(4)}</h3>
      if (line.startsWith('# ')) return <h2 key={i} style={{ marginTop: 20, marginBottom: 8, fontSize: '1.1rem' }}>{line.slice(2)}</h2>
      if (line.startsWith('- ') || line.startsWith('* '))
        return <li key={i} style={{ marginLeft: 16, marginBottom: 3, lineHeight: 1.6, color: '#555' }}>{line.slice(2)}</li>
      if (line.startsWith('**') && line.endsWith('**'))
        return <p key={i} style={{ fontWeight: 600, marginBottom: 4, color: '#0a0a0a' }}>{line.slice(2, -2)}</p>
      if (line === '') return <div key={i} style={{ height: 8 }} />
      return <p key={i} style={{ marginBottom: 4, lineHeight: 1.65 }}>{line}</p>
    })
}

export default function Wissensbasis() {
  const [content, setContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | loaded | error

  useEffect(() => {
    loadFromDB()
  }, [])

  async function loadFromDB() {
    setStatus('loading')
    try {
      const data = await knowledge.get()
      if (data) {
        setContent(data.content)
        setUpdatedAt(data.updated_at)
        setStatus('loaded')
      } else {
        setStatus('idle')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  async function fetchKnowledge() {
    setLoading(true)
    setStatus('loading')
    try {
      const { content: newContent } = await api.loadKnowledgeBase()
      await knowledge.save(newContent)
      setContent(newContent)
      setUpdatedAt(new Date().toISOString())
      setStatus('loaded')
    } catch (err) {
      console.error(err)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const dateStr = updatedAt
    ? new Date(updatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Wissensbasis</h2>
          {dateStr && (
            <div className="card-meta">Aktualisiert: {dateStr}</div>
          )}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchKnowledge}
          disabled={loading}
        >
          {loading ? <span className="loading-spinner" /> : '↻'}
          {loading ? ' Lädt…' : content ? ' Refresh' : ' Laden'}
        </button>
      </div>

      {status === 'loading' && !content && (
        <div>
          <div className="loading-bar"><div className="loading-bar-inner" /></div>
          <p style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
            KI erstellt Wissensbasis… dauert ca. 30s
          </p>
        </div>
      )}

      {status === 'idle' && !content && (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <p className="empty-state-text">
            Noch keine Wissensbasis vorhanden.<br />
            Einmalig laden, dann dauerhaft gespeichert.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={fetchKnowledge} disabled={loading}>
            {loading ? 'Wird geladen…' : 'Wissensbasis erstellen'}
          </button>
        </div>
      )}

      {content && (
        <div style={{ fontSize: '0.88rem' }}>
          {renderMarkdown(content)}
        </div>
      )}

      {status === 'error' && (
        <div className="card" style={{ borderColor: '#fde8e8', background: '#fde8e8' }}>
          <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>
            Fehler beim Laden. API Key konfiguriert?
          </p>
        </div>
      )}
    </div>
  )
}
