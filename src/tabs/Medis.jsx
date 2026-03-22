// src/tabs/Medis.jsx
import { useState, useEffect } from 'react'
import BottomSheet from '../components/BottomSheet'
import Confirm from '../components/Confirm'
import { meds } from '../lib/firebase'

const EMPTY = {
  name: '', dose: '', since: '', indication: '',
  off_label: false, effect: '', notes: '', active: true
}

export default function Medis({ onMedsChange }) {
  const [items, setItems] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await meds.getAll()
    setItems(data || [])
    onMedsChange?.(data || [])
  }

  function openNew() { setForm(EMPTY); setEditItem(null); setSheetOpen(true) }
  function openEdit(item) { setForm(item); setEditItem(item); setSheetOpen(true) }

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    try {
      await meds.save(editItem ? { ...form, id: editItem.id } : form)
      await load()
      setSheetOpen(false)
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await meds.delete(confirmDelete.id)
    setConfirmDelete(null)
    await load()
  }

  const active = items.filter(m => m.active)
  const inactive = items.filter(m => !m.active)

  return (
    <div>
      <div className="section-header">
        <h2>Medikamente</h2>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Medi</button>
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">💊</div>
          <p className="empty-state-text">Noch keine Medikamente erfasst.</p>
        </div>
      )}

      {active.map(item => (
        <div key={item.id} className="card" onClick={() => openEdit(item)} style={{ cursor: 'pointer' }}>
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="card-title">{item.name}</span>
                {item.off_label && <span className="badge badge-offlabel">Off-Label</span>}
              </div>
              <div className="card-meta">
                {item.dose && <span>{item.dose}</span>}
                {item.since && <span> · seit {new Date(item.since).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}</span>}
                {item.indication && <span> · {item.indication}</span>}
              </div>
              {item.effect && <p style={{ fontSize: '0.8rem', marginTop: 6, color: '#555' }}>{item.effect}</p>}
            </div>
            <button className="btn btn-danger btn-sm"
              onClick={e => { e.stopPropagation(); setConfirmDelete(item) }}>✕</button>
          </div>
        </div>
      ))}

      {inactive.length > 0 && (
        <>
          <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#999', marginTop: 16, marginBottom: 8 }}>INAKTIV</p>
          {inactive.map(item => (
            <div key={item.id} className="card" style={{ opacity: 0.5 }} onClick={() => openEdit(item)}>
              <div className="card-title" style={{ fontSize: '0.88rem' }}>{item.name}</div>
            </div>
          ))}
        </>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}
        title={editItem ? 'Medikament bearbeiten' : 'Neues Medikament'}>
        <div className="form-group">
          <label>Name *</label>
          <input type="text" placeholder="z.B. Low Dose Naltrexon"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Dosis</label>
          <input type="text" placeholder="z.B. 1,5mg täglich abends"
            value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Seit</label>
          <input type="date" value={form.since}
            onChange={e => setForm(f => ({ ...f, since: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Indikation / Zweck</label>
          <input type="text" placeholder="Wofür?"
            value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Beobachtete Wirkung</label>
          <textarea placeholder="Was wurde besser/schlechter?"
            value={form.effect} onChange={e => setForm(f => ({ ...f, effect: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Notizen</label>
          <textarea placeholder="Besonderheiten, Wechselwirkungen…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', gap: 16 }}>
            <div className={`checkbox-chip ${form.off_label ? 'checked' : ''}`}
              onClick={() => setForm(f => ({ ...f, off_label: !f.off_label }))}>
              ⚠️ Off-Label
            </div>
            <div className={`checkbox-chip ${!form.active ? 'checked' : ''}`}
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
              Inaktiv
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name}>
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </BottomSheet>

      <Confirm open={!!confirmDelete} title="Medikament löschen?"
        message={confirmDelete?.name}
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
