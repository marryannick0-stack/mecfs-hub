// src/components/BasquiatMessage.jsx
// Geheime Nachricht für Leonie – Basquiat-Stil Animation
import { useState, useEffect, useRef } from 'react'

const BASQUIAT_WORDS = [
  'SAMO©', '⊕', '✗', '—', '□', '△', '©', '®',
  'PER FAVORE', 'QUALITY', 'FLESH', '// //', '…'
]

function randomBetween(a, b) { return Math.random() * (b - a) + a }

export default function BasquiatMessage({ message, onDone }) {
  const [phase, setPhase] = useState('writing') // writing | hold | dissolving
  const [displayedChars, setDisplayedChars] = useState([])
  const [decorations, setDecorations] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => {
    // Generate background decorations
    const decs = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      word: BASQUIAT_WORDS[Math.floor(Math.random() * BASQUIAT_WORDS.length)],
      top: randomBetween(5, 90),
      left: randomBetween(2, 85),
      rotation: randomBetween(-25, 25),
      opacity: randomBetween(0.06, 0.18),
      size: randomBetween(0.7, 1.4)
    }))
    setDecorations(decs)

    // Typewriter effect
    let i = 0
    const chars = message.split('')
    intervalRef.current = setInterval(() => {
      if (i < chars.length) {
        setDisplayedChars(prev => [...prev, { char: chars[i], id: i }])
        i++
      } else {
        clearInterval(intervalRef.current)
        setPhase('hold')
        setTimeout(() => setPhase('dissolving'), 2400)
        setTimeout(() => onDone(), 4200)
      }
    }, 55)

    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        overflow: 'hidden',
        animation: phase === 'dissolving' ? 'basquiatFade 1.8s ease forwards' : 'none'
      }}
    >
      <style>{`
        @keyframes basquiatFade {
          0% { opacity: 1; filter: blur(0px); }
          40% { opacity: 0.9; filter: blur(0px); }
          100% { opacity: 0; filter: blur(8px); }
        }
        @keyframes charFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.88; }
        }
        @keyframes scratch {
          0% { transform: rotate(-1deg) translateX(0px); }
          25% { transform: rotate(1.5deg) translateX(-2px); }
          75% { transform: rotate(-0.5deg) translateX(1px); }
          100% { transform: rotate(0.8deg) translateX(0px); }
        }
      `}</style>

      {/* Background decorations */}
      {decorations.map(d => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            top: `${d.top}%`,
            left: `${d.left}%`,
            fontFamily: '"Courier New", monospace',
            fontSize: `${d.size}rem`,
            color: '#c0392b',
            opacity: d.opacity,
            transform: `rotate(${d.rotation}deg)`,
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {d.word}
        </div>
      ))}

      {/* Crossed lines decoration */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '30px',
        height: '2px',
        background: '#c0392b',
        opacity: 0.4,
        transform: 'rotate(-8deg)'
      }} />
      <div style={{
        position: 'absolute',
        top: '75%',
        right: '12%',
        width: '40px',
        height: '2px',
        background: '#c0392b',
        opacity: 0.3,
        transform: 'rotate(12deg)'
      }} />

      {/* Main message */}
      <div
        style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: 'clamp(1.2rem, 4vw, 1.7rem)',
          color: '#fafafa',
          lineHeight: 1.5,
          maxWidth: '480px',
          textAlign: 'center',
          position: 'relative',
          animation: 'scratch 3s ease-in-out infinite',
          letterSpacing: '0.02em'
        }}
      >
        {displayedChars.map(({ char, id }) => (
          <span
            key={id}
            style={{
              display: 'inline',
              animation: Math.random() > 0.85 ? 'charFlicker 2s ease infinite' : 'none',
              color: char === '!' || char === '.' ? '#c0392b' : '#fafafa'
            }}
          >
            {char}
          </span>
        ))}
        {phase === 'writing' && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '1.2em',
            background: '#c0392b',
            verticalAlign: 'text-bottom',
            animation: 'charFlicker 0.5s step-end infinite'
          }} />
        )}
      </div>

      {/* SAMO signature */}
      {phase !== 'writing' && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          right: '32px',
          fontFamily: '"Courier New", monospace',
          fontSize: '0.75rem',
          color: '#c0392b',
          opacity: 0.6,
          transform: 'rotate(3deg)'
        }}>
          SAMO©
        </div>
      )}
    </div>
  )
}
