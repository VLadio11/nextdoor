import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Recipient } from '../../types'
import ConfirmDialog from '../shared/ConfirmDialog'
import FormModal from '../shared/FormModal'

interface Form { email: string; name: string; is_active: boolean }
const EMPTY: Form = { email: '', name: '', is_active: true }

export default function Recipients() {
  const [items, setItems] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<null | 'create' | Recipient>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = () =>
    api.getRecipients()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (r: Recipient) => { setForm({ email: r.email, name: r.name ?? '', is_active: r.is_active }); setModal(r) }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const body = { ...form, name: form.name || null }
    try {
      if (modal === 'create') await api.createRecipient(body)
      else await api.updateRecipient((modal as Recipient).id, body)
      setModal(null)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    await api.deleteRecipient(confirmId).catch(e => setError(e.message))
    setConfirmId(null)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Email Recipients</h1>
        <p>Everyone on this list receives an email when a keyword match is found.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Recipient list</h2>
          <button className="btn btn-primary" onClick={openCreate}>+ Add recipient</button>
        </div>

        {loading ? (
          <div className="empty"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty">No recipients yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Email</th><th>Name</th><th>Active</th><th>Added</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>{r.name ?? '—'}</td>
                    <td>{r.is_active ? <span className="badge badge-green">yes</span> : <span className="badge badge-gray">no</span>}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <FormModal title={modal === 'create' ? 'Add recipient' : 'Edit recipient'} onClose={() => setModal(null)} onSubmit={handleSubmit} submitting={submitting}>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="alice@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Name (optional)</label>
            <input placeholder="Alice" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="toggle form-group">
            <input type="checkbox" id="rec-active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            <label htmlFor="rec-active">Active</label>
          </div>
        </FormModal>
      )}

      {confirmId && (
        <ConfirmDialog message="Remove this recipient? They will no longer receive alerts." onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  )
}
