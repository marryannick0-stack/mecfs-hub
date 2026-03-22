// src/components/Confirm.jsx
export default function Confirm({ open, title, message, onConfirm, onCancel, danger = true }) {
  if (!open) return null
  return (
    <div className="confirm-dialog">
      <div className="confirm-box">
        <h3>{title || 'Bist du sicher?'}</h3>
        {message && <p>{message}</p>}
        <div className="btn-row">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Abbrechen</button>
          <button
            className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
            style={danger ? { background: '#fde8e8', fontWeight: 600 } : {}}
            onClick={onConfirm}
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  )
}
