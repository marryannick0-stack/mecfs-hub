// src/App.jsx
import { useState, useEffect, useRef } from 'react'
import BottomNav from './components/BottomNav'
import BasquiatMessage from './components/BasquiatMessage'
import { secret } from './lib/firebase'

import Wissensbasis from './tabs/Wissensbasis'
import News from './tabs/News'
import Tagebuch from './tabs/Tagebuch'
import Links from './tabs/Links'
import Medis from './tabs/Medis'
import Arzttermin from './tabs/Arzttermin'
import Mehr from './tabs/Mehr'

export default function App() {
  const [tab, setTab] = useState('tagebuch')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [allMeds, setAllMeds] = useState([])
  const [allEntries, setAllEntries] = useState([])
  const [allLinks, setAllLinks] = useState([])
  const [secretMessage, setSecretMessage] = useState(null)
  const [showBasquiat, setShowBasquiat] = useState(false)
  const logoTapCount = useRef(0)
  const logoTapTimer = useRef(null)

  // Online/Offline detection
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Check for pending Basquiat message on load
  useEffect(() => {
    checkSecretMessage()
  }, [])

  async function checkSecretMessage() {
    try {
      const msg = await secret.getPending()
      if (msg) {
        // Small delay for dramatic effect
        setTimeout(() => {
          setSecretMessage(msg)
          setShowBasquiat(true)
        }, 800)
      }
    } catch (err) { /* no secret, no problem */ }
  }

  async function handleBasquiatDone() {
    setShowBasquiat(false)
    if (secretMessage) {
      await secret.markShown(secretMessage.id)
      setSecretMessage(null)
    }
  }

  // Logo: 5x tap → Mehr tab → secret section
  function handleLogoTap() {
    logoTapCount.current += 1
    clearTimeout(logoTapTimer.current)
    logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0 }, 2000)
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0
      setTab('mehr')
    }
  }

  const allData = { entries: allEntries, medications: allMeds, links: allLinks }

  return (
    <>
      {showBasquiat && secretMessage && (
        <BasquiatMessage message={secretMessage.message} onDone={handleBasquiatDone} />
      )}

      {!isOnline && (
        <div className="offline-banner">OFFLINE — Daten werden lokal gespeichert</div>
      )}

      <header className="app-header">
        <div className="app-header-inner" onClick={handleLogoTap}>
          <span className="app-logo">ME/CFS Hub</span>
          <span className="app-subtitle">für Leonie & Familie</span>
        </div>
      </header>

      <main className="tab-content">
        {tab === 'wissen'     && <Wissensbasis />}
        {tab === 'news'       && <News />}
        {tab === 'tagebuch'   && <Tagebuch allMeds={allMeds} onEntriesChange={setAllEntries} />}
        {tab === 'links'      && <Links onLinksChange={setAllLinks} />}
        {tab === 'medis'      && <Medis onMedsChange={setAllMeds} />}
        {tab === 'arzttermin' && <Arzttermin allData={allData} />}
        {tab === 'mehr'       && <Mehr />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </>
  )
}
