// src/tabs/News.jsx
import { useState, useEffect } from 'react'
import { news as newsDB } from '../lib/firebase'
import { api } from '../lib/api'

function EvidenceBadge({ level }) {
  const cls = { Hoch: 'badge-hoch', Mittel: 'badge-mittel', Niedrig: 'badge-niedrig' }
  return <span className={`badge ${cls[level] || 'badge-niedrig'}`}>{level}</span>
}

function NewsCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(item.scanned_at).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="card" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <div style={{ flex: 1 }}>
          <div className="card-title">{item.title}</div>
          <div className="card-meta">{item.source} · {date}</div>
        </div>
        <EvidenceBadge level={item.evidence_level} />
      </div>

      {expanded && (
        <>
          <p style={{ fontSize: '0.85rem', marginBottom: 10, marginTop: 8 }}>{item.summary}</p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#0a0a0a', textDecoration: 'underline' }}
            >
              Quelle öffnen ↗
            </a>
          )}
          {item.tags?.length > 0 && (
            <div className="tags">
              {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function News() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadArchive() }, [])

  async function loadArchive() {
    try {
      const data = await newsDB.getAll()
      setItems(data || [])
    } catch (err) { console.error(err) }
  }

  async function runScan() {
    setLoading(true)
    setError('')
    try {
      const { items: newItems } = await api.scanNews()
      const itemsWithMeta = newItems.map(item => ({
        ...item,
        tags: item.tags || [],
        scanned_at: new Date().toISOString()
      }))
      await newsDB.saveMany(itemsWithMeta)
      await loadArchive()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(item =>
    !search || [item.title, item.source, item.summary].some(s =>
      s?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const lastScan = items[0]
    ? new Date(items[0].scanned_at).toLocaleString('de-DE', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      })
    : null

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>ME/CFS News</h2>
          {lastScan && <div className="card-meta">Letzter Scan: {lastScan}</div>}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={runScan} disabled={loading}>
          {loading ? <span className="loading-spinner" /> : '📡'}
          {loading ? ' Scannt…' : ' Scan'}
        </button>
      </div>

      {loading && (
        <div>
          <div className="loading-bar"><div className="loading-bar-inner" /></div>
          <p style={{ fontSize: '0.82rem', color: '#999', textAlign: 'center', marginBottom: 16 }}>
            KI durchsucht wissenschaftliche Quellen…
          </p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: '#fde8e8', background: '#fde8e8', marginBottom: 16 }}>
          <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</p>
        </div>
      )}

      {items.length > 0 && (
        <input
          className="search-input"
          placeholder="News durchsuchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}

      {filtered.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📡</div>
          <p className="empty-state-text">
            {items.length === 0
              ? 'Noch kein Scan. Klick auf "Scan" für aktuelle ME/CFS-News.'
              : 'Keine Ergebnisse für diese Suche.'}
          </p>
        </div>
      )}

      {filtered.map(item => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  )
}
