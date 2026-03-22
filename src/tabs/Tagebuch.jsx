// src/tabs/Tagebuch.jsx
import { useState, useEffect } from 'react'
import BottomSheet from '../components/BottomSheet'
import Confirm from '../components/Confirm'
import { diary, symptoms as symptomsDB } from '../lib/supabase'
import { api } from '../lib/api'

const TEAM = ['Leonie', 'Lilli', 'Paula', 'Michael', 'Andere']

function SliderField({ label, value, onChange, min = 1, max = 10 }) {
  const labelLow = min === 1 ? 'Gut' : String(min)
  const labelHigh = max === 10 ? 'Schlecht' : String(max)
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="slider-wrapper">
        <div className="slider-value">{value}<span style={{ fontSize: '0.9rem', color: '#999' }}>/10</span></div>
        <div className="slider-labels"><span>{labelLow}</span><span>{labelHigh}</span></div>
        <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} />
      </div>
    </div>
  )
}

function EntryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(entry.entry_date).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: 'short'
  })

  const avgScore = ((entry.fatigue + entry.pain + (10 - entry.sleep)) / 3).toFixed(1)
  const severity = avgScore >= 7 ? 'Schwer' : avgScore >= 4.5 ? 'Mittel' : 'Gut'
  const sevColor = { Schwer: '#c0392b', Mittel: '#b8860b', Gut: '#1a7a4a' }

  return (
    <div className="card" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="card-title">{date}</span>
            {entry.pem_crash && <span className="badge badge-crash">PEM</span>}
          </div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            Fatigue {entry.fatigue} · Schmerz {entry.pain} · Schlaf {entry.sleep}
            <span style={{ marginLeft: 8, color: sevColor[severity] }}>● {severity}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#999' }}>{entry.entered_by}</span>
          <button
            className="btn-danger"
            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
            onClick={e => { e.stopPropagation(); onDelete(entry) }}
          >✕</button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 8 }}>
          {entry.symptoms?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="card-meta" style={{ marginBottom: 4 }}>Symptome</div>
              <div className="tags">
                {entry.symptoms.map(s => <span key={s} className="tag">{s}</span>)}
              </div>
            </div>
          )}
          {entry.activity && <p style={{ fontSize: '0.83rem', marginBottom: 6 }}><b>Aktivität:</b> {entry.activity}</p>}
          {entry.triggers && <p style={{ fontSize: '0.83rem', marginBottom: 6 }}><b>Auslöser:</b> {entry.triggers}</p>}
          {entry.medications && <p style={{ fontSize: '0.83rem', marginBottom: 6 }}><b>Medis:</b> {entry.medications}</p>}
          {entry.notes && <p style={{ fontSize: '0.83rem' }}><b>Notizen:</b> {entry.notes}</p>}
        </div>
      )}
    </div>
  )
}

export default function Tagebuch({ allMeds }) {
  const [entries, setEntries] = useState([])
  const [symptomList, setSymptomList] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [analysis, setAnalysis] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    fatigue: 5, pain: 5, sleep: 5,
    pem_crash: false,
    symptoms: [],
    activity: '', triggers: '', medications: '', notes: '',
    entered_by: 'Lilli'
  })

  useEffect(() => {
    loadData()
    symptomsDB.getAll().then(s => setSymptomList(s || []))
  }, [])

  async function loadData() {
    const data = await diary.getAll()
    setEntries(data || [])
  }

  function toggleSymptom(name) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(name)
        ? f.symptoms.filter(s => s !== name)
        : [...f.symptoms, name]
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await diary.save(form)
      await loadData()
      setSheetOpen(false)
      setForm({
        entry_date: new Date().toISOString().split('T')[0],
        fatigue: 5, pain: 5, sleep: 5,
        pem_crash: false, symptoms: [],
        activity: '', triggers: '', medications: '', notes: '',
        entered_by: 'Lilli'
      })
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    await diary.delete(confirmDelete.id)
    setConfirmDelete(null)
    await loadData()
  }

  async function runAnalysis() {
    setAnalysisLoading(true)
    setAnalysisOpen(true)
    try {
      const { content } = await api.diaryAnalysis(entries.slice(0, 30), allMeds || [])
      setAnalysis(content)
    } catch (err) { setAnalysis('Fehler: ' + err.message) }
    setAnalysisLoading(false)
  }

  const canAnalyze = entries.length >= 7

  return (
    <div>
      <div className="section-header">
        <h2>Tagebuch</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setSheetOpen(true)}>+ Eintrag</button>
      </div>

      {canAnalyze && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 16 }}
          onClick={runAnalysis}
        >
          🧠 KI-Analyse ({entries.length} Einträge)
        </button>
      )}

      {entries.length < 7 && entries.length > 0 && (
        <div className="card" style={{ background: '#fdf6e3', borderColor: '#fde68a', marginBottom: 16 }}>
          <p style={{ fontSize: '0.82rem', color: '#856404' }}>
            {7 - entries.length} weitere Einträge bis zur KI-Analyse
          </p>
        </div>
      )}

      {entries.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p className="empty-state-text">Noch kein Eintrag.<br />Wie geht es Leonie heute?</p>
        </div>
      )}

      {entries.map(e => (
        <EntryCard key={e.id} entry={e} onDelete={setConfirmDelete} />
      ))}

      {/* New Entry Sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Neuer Eintrag">
        <div className="form-group">
          <label>Datum</label>
          <input type="date" value={form.entry_date}
            onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} />
        </div>

        <SliderField label="Fatigue" value={form.fatigue} onChange={v => setForm(f => ({ ...f, fatigue: v }))} />
        <SliderField label="Schmerz" value={form.pain} onChange={v => setForm(f => ({ ...f, pain: v }))} />
        <SliderField label="Schlaf" value={form.sleep} onChange={v => setForm(f => ({ ...f, sleep: v }))}
          // Invert: 1 = schlecht, 10 = gut
        />

        <div className="form-group">
          <label>PEM-Crash</label>
          <div
            className={`pem-toggle ${form.pem_crash ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, pem_crash: !f.pem_crash }))}
          >
            <div className="pem-toggle-label">
              {form.pem_crash ? '⚠️ PEM-Crash aktiv' : 'Kein PEM-Crash'}
            </div>
            <div className="pem-indicator">{form.pem_crash ? '✓' : ''}</div>
          </div>
        </div>

        <div className="form-group">
          <label>Symptome</label>
          <div className="checkbox-grid">
            {symptomList.map(s => (
              <div
                key={s.id}
                className={`checkbox-chip ${form.symptoms.includes(s.name) ? 'checked' : ''}`}
                onClick={() => toggleSymptom(s.name)}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Aktivität</label>
          <input type="text" placeholder="Was hat Leonie heute gemacht?"
            value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} />
        </div>

        <div className="form-group">
          <label>Mögliche Auslöser</label>
          <input type="text" placeholder="z.B. Telefonat, Spaziergang, Stress…"
            value={form.triggers} onChange={e => setForm(f => ({ ...f, triggers: e.target.value }))} />
        </div>

        <div className="form-group">
          <label>Medikamente heute</label>
          <input type="text" placeholder="Abweichungen von Standarddosis?"
            value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} />
        </div>

        <div className="form-group">
          <label>Notizen</label>
          <textarea placeholder="Alles weitere…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="form-group">
          <label>Eingetragen von</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TEAM.map(name => (
              <div
                key={name}
                className={`checkbox-chip ${form.entered_by === name ? 'checked' : ''}`}
                onClick={() => setForm(f => ({ ...f, entered_by: name }))}
                style={{ borderRadius: 8 }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern…' : 'Eintrag speichern'}
        </button>
      </BottomSheet>

      {/* Analysis Sheet */}
      <BottomSheet open={analysisOpen} onClose={() => setAnalysisOpen(false)} title="KI-Analyse">
        {analysisLoading ? (
          <div>
            <div className="loading-bar"><div className="loading-bar-inner" /></div>
            <p style={{ textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>Analysiere {entries.length} Einträge…</p>
          </div>
        ) : (
          <div className="analysis-output" style={{ whiteSpace: 'pre-wrap' }}>{analysis}</div>
        )}
      </BottomSheet>

      <Confirm
        open={!!confirmDelete}
        title="Eintrag löschen?"
        message={`Eintrag vom ${confirmDelete ? new Date(confirmDelete.entry_date).toLocaleDateString('de-DE') : ''} unwiderruflich löschen?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
