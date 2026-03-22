// api/news-scan.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Erstelle eine Liste aktueller ME/CFS Forschungsneuigkeiten aus 2024/2025.
Fokus auf: PEM, Behandlungen, Studien, LDN, NIH RECOVER.

Antworte NUR als JSON-Array, kein Text davor oder danach:
[
  {
    "title": "Titel auf Deutsch",
    "source": "Quellenname",
    "url": null,
    "summary": "2-3 Sätze auf Deutsch",
    "evidence_level": "Hoch|Mittel|Niedrig",
    "tags": ["tag1", "tag2"]
  }
]
Gib 6 Einträge zurück.`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()
    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Kein JSON in Antwort')
    const items = JSON.parse(jsonMatch[0])
    res.status(200).json({ items, scanned_at: new Date().toISOString() })
  } catch (err) {
    console.error('News Scan Error:', err)
    res.status(500).json({ error: err.message })
  }
}
