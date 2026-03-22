// src/lib/firebase.js
// Ersetzt supabase.js komplett — gleiche Exports, gleiche Funktionen
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
 
// ── Config: aus .env Datei ──────────────────────────────
// Werte kommen von: Firebase Console → Projekteinstellungen → Web-App
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID
}
 
const app = initializeApp(firebaseConfig)
 
// Offline-Persistenz: alles wird lokal gecacht
// Mehrere Tabs gleichzeitig werden unterstützt
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})
 
// Firestore-Doc → Plain Object (mit id)
function toObj(d) {
  return { id: d.id, ...d.data() }
}
 
// ── Tagebuch ──────────────────────────────────────────────
export const diary = {
  async getAll() {
    const q = query(collection(db, 'diary_entries'), orderBy('entry_date', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(toObj)
  },
  async save(entry) {
    const { id, ...data } = entry
    if (id) {
      await setDoc(doc(db, 'diary_entries', id), data)
      return entry
    } else {
      const ref = await addDoc(collection(db, 'diary_entries'), {
        ...data,
        created_at: serverTimestamp()
      })
      return { ...data, id: ref.id }
    }
  },
  async delete(id) {
    await deleteDoc(doc(db, 'diary_entries', id))
  }
}
 
// ── Medikamente ───────────────────────────────────────────
export const meds = {
  async getAll() {
    const q = query(collection(db, 'medications'), orderBy('name'))
    const snap = await getDocs(q)
    return snap.docs.map(toObj)
  },
  async save(med) {
    const { id, ...data } = med
    if (id) {
      await setDoc(doc(db, 'medications', id), data)
      return med
    } else {
      const ref = await addDoc(collection(db, 'medications'), {
        ...data,
        created_at: serverTimestamp()
      })
      return { ...data, id: ref.id }
    }
  },
  async delete(id) {
    await deleteDoc(doc(db, 'medications', id))
  }
}
 
// ── Links ─────────────────────────────────────────────────
export const links = {
  async getAll() {
    const snap = await getDocs(collection(db, 'links'))
    return snap.docs.map(toObj).sort((a, b) =>
      new Date(b.created_at?.toDate?.() || b.created_at) - new Date(a.created_at?.toDate?.() || a.created_at)
    )
  },
  async save(link) {
    const { id, ...data } = link
    if (id) {
      await setDoc(doc(db, 'links', id), data)
      return link
    } else {
      const ref = await addDoc(collection(db, 'links'), {
        ...data,
        created_at: serverTimestamp()
      })
      return { ...data, id: ref.id }
    }
  },
  async updateSummary(id, summary) {
    await updateDoc(doc(db, 'links', id), {
      summary,
      summary_updated_at: new Date().toISOString()
    })
  },
  async delete(id) {
    await deleteDoc(doc(db, 'links', id))
  }
}
 
// ── News ──────────────────────────────────────────────────
export const news = {
  async getAll() {
    const snap = await getDocs(collection(db, 'news_items'))
    return snap.docs.map(toObj).sort((a, b) =>
      new Date(b.scanned_at) - new Date(a.scanned_at)
    )
  },
  async saveMany(items) {
    await Promise.all(items.map(item =>
      addDoc(collection(db, 'news_items'), item)
    ))
  }
}
 
// ── Wissensbasis ──────────────────────────────────────────
export const knowledge = {
  async get() {
    const snap = await getDocs(collection(db, 'knowledge_base'))
    if (snap.empty) return null
    const docs = snap.docs.map(toObj).sort((a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at)
    )
    return docs[0]
  },
  async save(content) {
    const existing = await this.get()
    if (existing) {
      await updateDoc(doc(db, 'knowledge_base', existing.id), {
        content,
        updated_at: new Date().toISOString(),
        version: (existing.version || 1) + 1
      })
    } else {
      await addDoc(collection(db, 'knowledge_base'), {
        content,
        updated_at: new Date().toISOString(),
        version: 1
      })
    }
  }
}
 
// ── Symptom-Liste ─────────────────────────────────────────
export const symptoms = {
  async getAll() {
    const snap = await getDocs(collection(db, 'symptom_list'))
    return snap.docs.map(toObj)
      .filter(s => s.active !== false)
      .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
  },
  async add(name, category = 'Allgemein') {
    const ref = await addDoc(collection(db, 'symptom_list'), {
      name, category, sort_order: 99, active: true
    })
    return { id: ref.id, name, category, sort_order: 99, active: true }
  },
  async delete(id) {
    await updateDoc(doc(db, 'symptom_list', id), { active: false })
  }
}
 
// ── Secret Messages (Basquiat) ────────────────────────────
export const secret = {
  async getPending() {
    const snap = await getDocs(collection(db, 'secret_messages'))
    const pending = snap.docs.map(toObj)
      .filter(m => !m.shown)
      .sort((a, b) => new Date(b.created_at?.toDate?.() || b.created_at) - new Date(a.created_at?.toDate?.() || a.created_at))
    return pending[0] || null
  },
  async save(message) {
    await addDoc(collection(db, 'secret_messages'), {
      message,
      shown: false,
      created_at: serverTimestamp()
    })
  },
  async markShown(id) {
    await updateDoc(doc(db, 'secret_messages', id), {
      shown: true,
      shown_at: new Date().toISOString()
    })
  }
}
 
// ── WhatsApp-Analysen ─────────────────────────────────────
export const whatsapp = {
  async getAll() {
    const snap = await getDocs(collection(db, 'whatsapp_analyses'))
    return snap.docs.map(toObj).sort((a, b) =>
      new Date(b.created_at?.toDate?.() || b.created_at) - new Date(a.created_at?.toDate?.() || a.created_at)
    )
  },
  async save(analysis, message_count) {
    await addDoc(collection(db, 'whatsapp_analyses'), {
      analysis,
      message_count,
      created_at: serverTimestamp()
    })
  }
}
 