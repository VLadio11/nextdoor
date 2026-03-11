import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Keyword } from '../../types'
import ConfirmDialog from '../shared/ConfirmDialog'
import FormModal from '../shared/FormModal'

interface Form { phrase: string; is_active: boolean }
const EMPTY: Form = { phrase: '', is_active: true }

export default function Keywords() {
  const [items, setItems] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<null | 'create' | Keyword>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = () =>
    api.getKeywords()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (kw: Keyword) => { setForm({ phrase: kw.phrase, is_active: kw.is_active }); setModal(kw) }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      if (modal === 'create') await api.createKeyword(form)
      else await api.updateKeyword((modal as Keyword).id, form)
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
    await api.deleteKeyword(confirmId).catch(e => setError(e.message))
    setConfirmId(null)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Keywords</h1>
        <p>Phrases to match against post content (case-insensitive). Stored in lowercase.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Keyword list</h2>
          <button className="btn btn-primary" onClick={openCreate}>+ Add keyword</button>
        </div>

        {loading ? (
          <div className="empty"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty">No keywords yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Phrase</th><th>Active</th><th>Added</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map(kw => (
                  <tr key={kw.id}>
                    <td><code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{kw.phrase}</code></td>
                    <td>{kw.is_active ? <span className="badge badge-green">yes</span> : <span className="badge badge-gray">no</span>}</td>
                    <td>{new Date(kw.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(kw)}>Edit</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(kw.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <FormModal title={modal === 'create' ? 'Add keyword' : 'Edit keyword'} onClose={() => setModal(null)} onSubmit={handleSubmit} submitting={submitting}>
          <div className="form-group">
            <label>Phrase</label>
            <input placeholder="e.g. break-in" value={form.phrase} onChange={e => setForm(f => ({ ...f, phrase: e.target.value }))} />
          </div>
          <div className="toggle form-group">
            <input type="checkbox" id="kw-active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            <label htmlFor="kw-active">Active</label>
          </div>
        </FormModal>
      )}

      {confirmId && (
        <ConfirmDialog message="Delete this keyword?" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  )
}
