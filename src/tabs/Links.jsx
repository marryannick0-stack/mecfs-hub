// src/tabs/Links.jsx
import { useState, useEffect } from 'react'
import BottomSheet from '../components/BottomSheet'
import Confirm from '../components/Confirm'
import { links as linksDB } from '../lib/firebase'
import { api } from '../lib/api'

const CATEGORIES = ['Arztbrief', 'Studie', 'Google Drive', 'Leitlinie', 'Allgemein']

export default function Links() {
  const [items, setItems] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [summarizing, setSummarizing] = useState(null)
  const [form, setForm] = useState({ title: '', url: '', category: 'Allgemein' })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await linksDB.getAll()
    setItems(data || [])
  }

  async function handleSave() {
    if (!form.title || !form.url) return
    setSaving(true)
    try {
      await linksDB.save(form)
      await load()
      setSheetOpen(false)
      setForm({ title: '', url: '', category: 'Allgemein' })
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  async function handleSummarize(item) {
    setSummarizing(item.id)
    try {
      const { content } = await api.summarizeLink(item.url, item.title)
      await linksDB.updateSummary(item.id, content)
      await load()
    } catch (err) { console.error(err) }
    setSummarizing(null)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await linksDB.delete(confirmDelete.id)
    setConfirmDelete(null)
    await load()
  }

  return (
    <div>
      <div className="section-header">
        <h2>Links & Dokumente</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setSheetOpen(true)}>+ Link</button>
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <p className="empty-state-text">Arztbriefe, Studien,<br />Google Drive Links — alles hier.</p>
        </div>
      )}

      {items.map(item => (
        <div key={item.id} className="card">
          <div className="card-header">
            <div style={{ flex: 1 }} onClick={() => setExpanded(expanded === item.id ? null : item.id)} style={{ flex: 1, cursor: 'pointer' }}>
              <div className="card-title">{item.title}</div>
              <div className="card-meta">
                <span className="badge" style={{ background: '#f0f0f0', color: '#555', marginRight: 6 }}>{item.category}</span>
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#0a0a0a' }}>
                  öffnen ↗
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm"
                onClick={() => handleSummarize(item)}
                disabled={summarizing === item.id}
                title="KI-Zusammenfassung">
                {summarizing === item.id ? <span className="loading-spinner" /> : '↻'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(item)}>✕</button>
            </div>
          </div>

          {expanded === item.id && item.summary && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 8 }}>
              <div className="card-meta" style={{ marginBottom: 6 }}>KI-Zusammenfassung</div>
              <p style={{ fontSize: '0.83rem', whiteSpace: 'pre-wrap' }}>{item.summary}</p>
            </div>
          )}
          {expanded === item.id && !item.summary && (
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: 8 }}>
              Noch keine Zusammenfassung. ↻ klicken zum Laden.
            </p>
          )}
        </div>
      ))}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Link hinzufügen">
        <div className="form-group">
          <label>Titel</label>
          <input type="text" placeholder="z.B. Arztbrief Charité März 2025"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>URL</label>
          <input type="url" placeholder="https://…"
            value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Kategorie</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title || !form.url}>
          {saving ? 'Speichern…' : 'Link speichern'}
        </button>
      </BottomSheet>

      <Confirm open={!!confirmDelete} title="Link löschen?"
        message={confirmDelete?.title}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
