import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Location } from '../../types'
import ConfirmDialog from '../shared/ConfirmDialog'
import FormModal from '../shared/FormModal'

interface Form { name: string; latitude: string; longitude: string; radius_km: string; is_active: boolean }
const EMPTY: Form = { name: '', latitude: '', longitude: '', radius_km: '5', is_active: true }

export default function Locations() {
  const [items, setItems] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<null | 'create' | Location>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = () =>
    api.getLocations()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (loc: Location) => {
    setForm({ name: loc.name, latitude: String(loc.latitude), longitude: String(loc.longitude), radius_km: String(loc.radius_km), is_active: loc.is_active })
    setModal(loc)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    const body = { name: form.name, latitude: +form.latitude, longitude: +form.longitude, radius_km: +form.radius_km, is_active: form.is_active }
    try {
      if (modal === 'create') await api.createLocation(body)
      else await api.updateLocation((modal as Location).id, body)
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
    await api.deleteLocation(confirmId).catch(e => setError(e.message))
    setConfirmId(null)
    load()
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: k === 'is_active' ? e.target.checked : e.target.value }))

  return (
    <div>
      <div className="page-header">
        <h1>Locations</h1>
        <p>Geographic areas to monitor. Each location is polled independently.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Monitored locations</h2>
          <button className="btn btn-primary" onClick={openCreate}>+ Add location</button>
        </div>

        {loading ? (
          <div className="empty"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty">No locations yet. Add one to start monitoring.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Latitude</th><th>Longitude</th><th>Radius (km)</th><th>Active</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map(loc => (
                  <tr key={loc.id}>
                    <td>{loc.name}</td>
                    <td>{loc.latitude}</td>
                    <td>{loc.longitude}</td>
                    <td>{loc.radius_km}</td>
                    <td>{loc.is_active ? <span className="badge badge-green">yes</span> : <span className="badge badge-gray">no</span>}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(loc)}>Edit</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(loc.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <FormModal title={modal === 'create' ? 'Add location' : 'Edit location'} onClose={() => setModal(null)} onSubmit={handleSubmit} submitting={submitting}>
          <div className="form-group">
            <label>Name</label>
            <input placeholder="e.g. Downtown SF" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" placeholder="37.7749" value={form.latitude} onChange={set('latitude')} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" placeholder="-122.4194" value={form.longitude} onChange={set('longitude')} />
            </div>
          </div>
          <div className="form-group">
            <label>Radius (km)</label>
            <input type="number" step="0.5" min="0.5" max="500" value={form.radius_km} onChange={set('radius_km')} />
          </div>
          <div className="toggle form-group">
            <input type="checkbox" id="active" checked={form.is_active} onChange={set('is_active')} />
            <label htmlFor="active">Active</label>
          </div>
        </FormModal>
      )}

      {confirmId && (
        <ConfirmDialog message="Delete this location? This will not delete associated posts." onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  )
}
