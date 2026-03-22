// netlify/functions/news-scan.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Du bist ein medizinischer Recherche-Assistent für ME/CFS.
    
Erstelle eine Liste aktueller ME/CFS Forschungsneuigkeiten und Behandlungsansätze aus 2024/2025.
Fokus auf: PEM, Brain Fog, Behandlungen, Studien, LDN, BC007, NIH RECOVER.

Antworte NUR als JSON-Array, kein Markdown, kein Text davor oder danach:
[
  {
    "title": "Kurzer Titel auf Deutsch",
    "source": "Quellenname",
    "url": null,
    "summary": "2-3 Sätze Zusammenfassung auf Deutsch",
    "evidence_level": "Hoch|Mittel|Niedrig",
    "tags": ["tag1", "tag2"]
  }
]

Gib 6 Einträge zurück. Nur das JSON-Array, nichts sonst.`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()

    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Kein JSON in Antwort')

    const items = JSON.parse(jsonMatch[0])

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ items, scanned_at: new Date().toISOString() })
    }
  } catch (err) {
    console.error('News Scan Error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    }
  }
}
