// src/components/BottomNav.jsx
const TABS = [
  { id: 'wissen',     icon: '📖', label: 'Wissen' },
  { id: 'news',       icon: '📡', label: 'News' },
  { id: 'tagebuch',   icon: '📅', label: 'Tagebuch' },
  { id: 'links',      icon: '🔗', label: 'Links' },
  { id: 'medis',      icon: '💊', label: 'Medis' },
  { id: 'arzttermin', icon: '🩺', label: 'Arzt' },
  { id: 'mehr',       icon: '⋯', label: 'Mehr' },
]

export { TABS }

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
