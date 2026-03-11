import { ReactNode, useEffect } from 'react'

interface Props {
  title: string
  onClose: () => void
  onSubmit: () => void
  submitting?: boolean
  children: ReactNode
}

export default function FormModal({ title, onClose, onSubmit, submitting, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{title}</h2>
        {children}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
