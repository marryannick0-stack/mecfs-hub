// src/tabs/Arzttermin.jsx
import { useState } from 'react'
import { api } from '../lib/api'

export default function Arzttermin({ allData }) {
  const [report, setReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [view, setView] = useState('report') // report | chat

  async function generateReport() {
    setReportLoading(true)
    try {
      const { content } = await api.doctorReport(
        allData.entries || [],
        allData.medications || [],
        allData.links || []
      )
      setReport(content)
    } catch (err) { setReport('Fehler: ' + err.message) }
    setReportLoading(false)
  }

  async function sendChat() {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', content: chatInput }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const { content } = await api.chat(newMessages, allData)
      setChatMessages(m => [...m, { role: 'assistant', content }])
    } catch (err) {
      setChatMessages(m => [...m, { role: 'assistant', content: 'Fehler: ' + err.message }])
    }
    setChatLoading(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2>Arzttermin</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${view === 'report' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('report')}>Bericht</button>
          <button className={`btn btn-sm ${view === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('chat')}>Chat</button>
        </div>
      </div>

      {view === 'report' && (
        <>
          <div className="card" style={{ marginBottom: 16, background: '#f8f8f8' }}>
            <p style={{ fontSize: '0.83rem', marginBottom: 12 }}>
              KI erstellt einen Arztbericht aus Tagebuch, Medis und Links.
              Off-Label Medikamente werden markiert.
            </p>
            <button className="btn btn-primary" onClick={generateReport} disabled={reportLoading}>
              {reportLoading ? <><span className="loading-spinner" /> Erstelle Bericht…</> : '🩺 Arztbericht erstellen'}
            </button>
          </div>

          {reportLoading && (
            <div className="loading-bar"><div className="loading-bar-inner" /></div>
          )}

          {report && (
            <>
              <div className="analysis-output" style={{ whiteSpace: 'pre-wrap' }}>{report}</div>
              <button className="btn btn-secondary" style={{ marginTop: 12, width: '100%' }}
                onClick={() => { navigator.clipboard?.writeText(report) }}>
                📋 In Zwischenablage kopieren
              </button>
            </>
          )}

          {!report && !reportLoading && (
            <div className="empty-state">
              <div className="empty-state-icon">🩺</div>
              <p className="empty-state-text">
                Bericht basiert auf allen Tagebuch-Einträgen,<br />
                Medikamenten und gespeicherten Links.
              </p>
            </div>
          )}
        </>
      )}

      {view === 'chat' && (
        <>
          <div className="card" style={{ marginBottom: 16, background: '#f8f8f8' }}>
            <p style={{ fontSize: '0.83rem' }}>
              Chat mit Zugang zu allen Daten. Stell Fragen wie:<br />
              <i>"Welche Auslöser sind am häufigsten?" · "Was sollten wir den Arzt fragen?"</i>
            </p>
          </div>

          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                Noch kein Chat. Frag mich etwas über Leonies Daten.
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
            ))}
            {chatLoading && (
              <div className="chat-bubble assistant">
                <span className="loading-spinner" />
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <input type="text" placeholder="Frage stellen…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !chatLoading && sendChat()} />
            <button className="btn btn-primary" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
              ↑
            </button>
          </div>
        </>
      )}
    </div>
  )
}
