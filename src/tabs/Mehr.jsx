// src/tabs/Mehr.jsx
import { useState, useEffect } from 'react'
import BottomSheet from '../components/BottomSheet'
import { symptoms as symptomsDB, secret, whatsapp } from '../lib/firebase'
import { api } from '../lib/api'

export default function Mehr({ onSecretTap }) {
  const [view, setView] = useState('main')
  const [symptomList, setSymptomList] = useState([])
  const [newSymptom, setNewSymptom] = useState('')
  const [waText, setWaText] = useState('')
  const [waAnalysis, setWaAnalysis] = useState('')
  const [waLoading, setWaLoading] = useState(false)
  const [waHistory, setWaHistory] = useState([])
  const [secretMsg, setSecretMsg] = useState('')
  const [secretSaved, setSecretSaved] = useState(false)
  const [addingSymptom, setAddingSymptom] = useState(false)

  useEffect(() => {
    symptomsDB.getAll().then(s => setSymptomList(s || []))
    whatsapp.getAll().then(h => setWaHistory(h || []))
  }, [])

  async function handleAddSymptom() {
    if (!newSymptom.trim()) return
    setAddingSymptom(true)
    try {
      await symptomsDB.add(newSymptom.trim())
      const updated = await symptomsDB.getAll()
      setSymptomList(updated)
      setNewSymptom('')
    } catch (err) { console.error(err) }
    setAddingSymptom(false)
  }

  async function handleDeleteSymptom(id) {
    await symptomsDB.delete(id)
    setSymptomList(s => s.filter(x => x.id !== id))
  }

  async function handleWaAnalysis() {
    if (!waText.trim()) return
    setWaLoading(true)
    try {
      const { content } = await api.analyzeWhatsapp(waText)
      setWaAnalysis(content)
      await whatsapp.save(content, waText.split('\n').length)
      const h = await whatsapp.getAll()
      setWaHistory(h)
    } catch (err) { setWaAnalysis('Fehler: ' + err.message) }
    setWaLoading(false)
  }

  async function handleSaveSecret() {
    if (!secretMsg.trim()) return
    await secret.save(secretMsg.trim())
    setSecretMsg('')
    setSecretSaved(true)
    setTimeout(() => setSecretSaved(false), 3000)
  }

  const SECTIONS = [
    { id: 'whatsapp', icon: '💬', label: 'WhatsApp-Analyse' },
    { id: 'symptoms', icon: '⚙️', label: 'Symptom-Liste' },
    { id: 'secret', icon: '🎨', label: 'Nachricht für Leonie' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Mehr</h2>

      {SECTIONS.map(s => (
        <div key={s.id} className="card" style={{ cursor: 'pointer', marginBottom: 10 }}
          onClick={() => setView(view === s.id ? 'main' : s.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
            <span style={{ fontWeight: 500 }}>{s.label}</span>
            <span style={{ marginLeft: 'auto', color: '#999' }}>{view === s.id ? '▲' : '▽'}</span>
          </div>

          {view === s.id && s.id === 'whatsapp' && (
            <div onClick={e => e.stopPropagation()} style={{ marginTop: 16 }}>
              <textarea
                placeholder="WhatsApp-Chat hier einfügen (Nachrichten exportieren → Text kopieren)…"
                value={waText}
                onChange={e => setWaText(e.target.value)}
                style={{ minHeight: 120, marginBottom: 10 }}
              />
              <button className="btn btn-primary" onClick={handleWaAnalysis}
                disabled={waLoading || !waText.trim()}>
                {waLoading ? <><span className="loading-spinner" /> Analysiere…</> : '🧠 Analysieren'}
              </button>
              {waLoading && <div className="loading-bar" style={{ marginTop: 12 }}><div className="loading-bar-inner" /></div>}
              {waAnalysis && (
                <div className="analysis-output" style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
                  {waAnalysis}
                </div>
              )}
              {waHistory.length > 0 && !waAnalysis && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#999', marginBottom: 8 }}>
                    FRÜHERE ANALYSEN
                  </p>
                  {waHistory.slice(0, 3).map(h => (
                    <div key={h.id} className="card" style={{ cursor: 'pointer' }}
                      onClick={() => setWaAnalysis(h.analysis)}>
                      <div className="card-meta">
                        {new Date(h.created_at).toLocaleDateString('de-DE')} · {h.message_count} Nachrichten
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === s.id && s.id === 'symptoms' && (
            <div onClick={e => e.stopPropagation()} style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="text" placeholder="Neues Symptom…"
                  value={newSymptom} onChange={e => setNewSymptom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSymptom()}
                  style={{ flex: 1 }} />
                <button className="btn btn-secondary btn-sm" onClick={handleAddSymptom}
                  disabled={addingSymptom}>+</button>
              </div>
              {symptomList.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: '0.88rem' }}>{s.name}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSymptom(s.id)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {view === s.id && s.id === 'secret' && (
            <div onClick={e => e.stopPropagation()} style={{ marginTop: 16 }}>
              <p style={{ fontSize: '0.82rem', marginBottom: 12, color: '#555' }}>
                Nachricht für Leonie — erscheint als Basquiat-Animation beim nächsten App-Start.
              </p>
              <textarea
                placeholder="Was soll Leonie lesen?…"
                value={secretMsg}
                onChange={e => setSecretMsg(e.target.value)}
                style={{ minHeight: 80 }}
              />
              <button className="btn btn-primary" style={{ marginTop: 8 }}
                onClick={handleSaveSecret} disabled={!secretMsg.trim()}>
                {secretSaved ? '✓ Gespeichert' : '💌 Für Leonie speichern'}
              </button>
              <p style={{ fontSize: '0.75rem', color: '#999', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                Tipp: 5x auf "ME/CFS Hub" im Header tippen → öffnet diesen Editor direkt.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
