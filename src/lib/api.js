// src/lib/api.js
// Wrapper für Netlify Functions

const BASE = '/.netlify/functions'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  claude: (messages, system, max_tokens) =>
    post('/claude', { messages, system, max_tokens }),

  scanNews: (query) =>
    post('/news-scan', { query }),

  analyze: (type, data) =>
    post('/analyze', { type, data }),

  diaryAnalysis: (entries, medications) =>
    post('/analyze', { type: 'diary_analysis', data: { entries, medications } }),

  doctorReport: (entries, medications, links) =>
    post('/analyze', { type: 'doctor_report', data: { entries, medications, links } }),

  chat: (messages, allData) =>
    post('/analyze', { type: 'chat', data: { messages, allData } }),

  analyzeWhatsapp: (text) =>
    post('/analyze', { type: 'whatsapp', data: { text } }),

  summarizeLink: (url, title) =>
    post('/analyze', { type: 'summarize_link', data: { url, title } }),

  loadKnowledgeBase: () =>
    post('/analyze', { type: 'knowledge_base', data: {} })
}
