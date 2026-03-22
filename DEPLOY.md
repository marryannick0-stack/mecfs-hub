# 🚀 ME/CFS Hub – Deploy-Anleitung
## Schritt für Schritt, auch für Noobs

---

## Was du brauchst (alles kostenlos)
- ✅ GitHub Account (github.com)
- ✅ Netlify Account (netlify.com)
- ✅ Supabase Account (supabase.com)
- ✅ Groq Account (groq.com)
- ✅ Node.js installiert (nodejs.org → LTS Version)

---

## SCHRITT 1 — Groq API Key holen (5 Min)

1. **groq.com** öffnen → "Start Building" → Account erstellen
2. Links auf **"API Keys"** klicken
3. **"Create API Key"** → Namen eingeben (z.B. "mecfs-hub")
4. Den Key kopieren und sicher speichern (nur einmal sichtbar!)

> Format: `gsk_xxxxxxxxxxxxxxxxxxxx`

---

## SCHRITT 2 — Supabase einrichten (10 Min)

1. **supabase.com** → "Start your project" → Account erstellen
2. **"New Project"** → Name: `mecfs-hub` → Passwort setzen → Region: **Central EU (Frankfurt)**
3. Warten bis Projekt ready ist (ca. 1-2 Min)
4. Links auf **"SQL Editor"** → "New Query"
5. Den kompletten Inhalt von `supabase/schema.sql` reinkopieren → **"Run"** drücken
6. Grünes ✓ = alles ok

**Jetzt die Credentials holen:**
1. Links auf **"Settings"** → **"API"**
2. Kopieren:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public key**: `eyJ...` (der lange)

---

## SCHRITT 3 — Netlify Functions auf Groq umstellen (2 Min)

Öffne **`netlify/functions/claude.js`** und ersetze den Inhalt:

```js
import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  try {
    const { messages, system, max_tokens = 2048 } = JSON.parse(event.body)

    const allMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens,
      messages: allMessages
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: response.choices[0]?.message?.content || '',
        usage: response.usage
      })
    }
  } catch (err) {
    console.error('Groq API Error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    }
  }
}
```

Dasselbe für **`netlify/functions/analyze.js`** — erste Zeilen ändern:
```js
// ALT:
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// NEU:
import Groq from 'groq-sdk'
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
```

Und alle `client.messages.create(...)` ersetzen durch:
```js
// ALT:
const response = await client.messages.create({ model: '...', messages, system })
const text = response.content[0]?.text

// NEU:
const msgs = system ? [{ role: 'system', content: system }, ...messages] : messages
const response = await client.chat.completions.create({ model: 'llama-3.3-70b-versatile', max_tokens, messages: msgs })
const text = response.choices[0]?.message?.content
```

Für **`netlify/functions/news-scan.js`** analog — aber ohne Web-Search Tool (Groq hat das nicht).
Ersetze dort den Tool-Aufruf durch direkten Chat:
```js
const response = await client.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  max_tokens: 4096,
  messages: [
    { role: 'system', content: '...(system prompt)...' },
    { role: 'user', content: query }
  ]
})
const rawText = response.choices[0]?.message?.content || ''
```

Und in **`package.json`** das Anthropic SDK ersetzen:
```json
"dependencies": {
  "groq-sdk": "^0.7.0",
  "@supabase/supabase-js": "^2.43.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

---

## SCHRITT 4 — GitHub Repo erstellen (5 Min)

1. **github.com** → "+" oben rechts → "New repository"
2. Name: `mecfs-hub` → **Private** (Gesundheitsdaten!)  → "Create repository"
3. Auf deinem Computer: Terminal öffnen im `mecfs-app` Ordner

```bash
# Node-Module installieren
npm install

# Git initialisieren
git init
git add .
git commit -m "Initial commit: ME/CFS Hub"

# Mit GitHub verbinden (URL von GitHub-Seite kopieren)
git remote add origin https://github.com/DEIN-NAME/mecfs-hub.git
git branch -M main
git push -u origin main
```

✅ Wenn alles grün = Code ist auf GitHub

---

## SCHRITT 5 — Netlify deployen (5 Min)

1. **netlify.com** → "Add new site" → "Import an existing project"
2. **"GitHub"** → Repository `mecfs-hub` auswählen
3. Build settings (sollte auto-erkannt werden):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Noch NICHT deployen — erst Umgebungsvariablen!

**Umgebungsvariablen setzen:**
"Site settings" → "Environment variables" → "Add variable":

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | `gsk_xxxx...` (von Schritt 1) |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` (von Schritt 2) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (von Schritt 2) |

5. "Save" → "Deploy site"
6. Warten (ca. 2-3 Min) → grünes ✓

---

## SCHRITT 6 — App testen

1. Netlify gibt dir eine URL wie `https://amazing-name-123.netlify.app`
2. Diese URL auf allen Handys der Familie öffnen
3. Testen: Tagebuch-Eintrag erstellen → erscheint er in Supabase?

**PWA installieren:**
- **iPhone**: Safari → Teilen-Button → "Zum Home-Bildschirm"
- **Android**: Chrome → ⋮ Menü → "App installieren"

---

## SCHRITT 7 — Eigene Domain (optional, 5 Min)

In Netlify: "Domain settings" → "Add custom domain"
Oder die Netlify-URL einfach so nutzen — funktioniert genauso.

---

## Troubleshooting

**Build schlägt fehl?**
- Netlify → "Deploys" → Log anschauen → Fehlermeldung kopieren → Claude fragen

**Supabase-Daten kommen nicht an?**
- Supabase → "Authentication" → Row Level Security: sind die Policies erstellt?
- Browser-Konsole (F12) → Network-Tab: was antwortet Supabase?

**Groq antwortet nicht?**
- API Key nochmal prüfen (kein Leerzeichen vorne/hinten)
- Groq Dashboard → Usage: wird der Key benutzt?

**App funktioniert nicht offline?**
- Service Worker braucht HTTPS — auf Netlify ist das automatisch
- Lokal (localhost) auch ok

---

## Kosten-Übersicht (monatlich)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| Groq | Kostenlos | 6.000 req/Tag, 500k tokens/min |
| Supabase | Kostenlos | 500MB, 2 Projekte |
| Netlify | Kostenlos | 100GB Bandwidth, 300 Build-Min |

**Für eine Familie: 0€/Monat** 🎉

---

## Bei Problemen

Einfach den Fehler + die Datei in einen neuen Claude-Chat:
*"Beim Deployen meiner ME/CFS App bekomme ich diesen Fehler: [...]"*

Claude kennt den kompletten Code und hilft direkt weiter.

---

*Viel Erfolg — und alles Gute für Leonie. 🤍*
