// netlify/functions/analyze.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const SYSTEM_BASE = `Du bist ein medizinischer Assistent spezialisiert auf ME/CFS (Myalgische Enzephalomyelitis/Chronisches Fatigue-Syndrom).
Du arbeitest für eine Familie in Deutschland. Die Patientin heißt Leonie.
Sei präzise, mitfühlend und wissenschaftlich fundiert.
Nutze aktuelle ME/CFS-Leitlinien (NICE 2021, IOM 2015).
Wichtig: Du ersetzt keinen Arzt. Empfehle bei Unsicherheiten immer Rücksprache mit Fachärzten.`

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
    const { type, data } = JSON.parse(event.body)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    let prompt = ''

    switch (type) {
      case 'diary_analysis': {
        const { entries, medications } = data
        prompt = `${SYSTEM_BASE}
Antworte auf Deutsch, strukturiert mit ## Überschriften.

Analysiere diese ${entries.length} Tagebuch-Einträge von Leonie:

EINTRÄGE:
${JSON.stringify(entries, null, 2)}

MEDIKAMENTE:
${JSON.stringify(medications, null, 2)}

Erstelle:
## Wochen-Analyse
Trends bei Fatigue, Schmerz, Schlaf.

## Erkannte Auslöser
Welche Faktoren korrelieren mit PEM-Crashes?

## Medikamenten-Effekt
Beobachtbare Wirkungen.

## Empfehlungen
Konkrete Hinweise für Pacing und Symptommanagement.

## Arztbericht (kopierbereit)
Kompakte Zusammenfassung für den nächsten Termin.`
        break
      }

      case 'doctor_report': {
        const { entries, medications, links } = data
        prompt = `${SYSTEM_BASE}
Erstelle einen formellen deutschen Arztbrief.

SYMPTOM-VERLAUF (${entries.length} Einträge):
${JSON.stringify(entries, null, 2)}

MEDIKAMENTE:
${JSON.stringify(medications, null, 2)}

Format:
**Datum:** ${new Date().toLocaleDateString('de-DE')}

**Aktuelle Symptomatik**
[Konkrete Beschreibung mit Durchschnittswerten]

**Verlauf**
[Trends, PEM-Ereignisse, Schlafqualität]

**Aktuelle Medikation**
[Liste mit Dosierung, Off-Label markiert]

**Offene Fragen an den Arzt**
[Basierend auf Daten]

**Funktionsfähigkeit (Bell-Skala)**
[Schätzung]`
        break
      }

      case 'chat': {
        const { messages, allData } = data
        const lastMessage = messages[messages.length - 1].content
        prompt = `${SYSTEM_BASE}
Du hast Zugang zu allen Familien-Daten von Leonie. Beantworte Fragen präzise auf Deutsch.
Kontext: ${JSON.stringify(allData, null, 2).substring(0, 6000)}

Frage: ${lastMessage}`
        break
      }

      case 'whatsapp': {
        const { text } = data
        prompt = `${SYSTEM_BASE}
Analysiere diese WhatsApp-Nachrichten der Familie auf Deutsch:

${text}

Erstelle:
## Symptom-Erwähnungen
## Belastungsmuster
## Kommunikation
## Empfehlungen`
        break
      }

      case 'summarize_link': {
        const { url, title } = data
        prompt = `${SYSTEM_BASE}
Fasse diesen Link für eine ME/CFS-Familie zusammen (auf Deutsch, klar und verständlich):
Titel: ${title}
URL: ${url}

Beschreibe was du über diese Quelle weißt und bewerte die Evidenzqualität.`
        break
      }

      case 'knowledge_base': {
        prompt = `${SYSTEM_BASE}
Erstelle eine umfassende ME/CFS-Wissensbasis auf Deutsch mit:

## Was ist ME/CFS?
## Diagnose-Kriterien
## Kernsymptome
## Aktuelle Behandlungsansätze
## Pacing & Energiemanagement
## Ernährung & Schlaf
## Off-Label Behandlungen (LDN, BC007)
## Für Angehörige
## Ressourcen & Selbsthilfe

Schreibe umfassend aber verständlich.`
        break
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unbekannter Typ' }) }
    }

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: text })
    }
  } catch (err) {
    console.error('Analyze Error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    }
  }
}
