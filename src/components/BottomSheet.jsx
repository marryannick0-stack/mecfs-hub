// src/components/BottomSheet.jsx
import { useEffect, useRef } from 'react'

export default function BottomSheet({ open, onClose, title, children }) {
  const firstInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    // Auto-focus first input after animation
    const t = setTimeout(() => {
      const el = document.querySelector('.sheet input, .sheet textarea, .sheet select')
      el?.focus()
    }, 350)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" ref={firstInputRef}>
        <div className="sheet-handle" />
        {title && <div className="sheet-title">{title}</div>}
        {children}
      </div>
    </>
  )
}
