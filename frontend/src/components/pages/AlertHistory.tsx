import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Alert } from '../../types'

const PAGE = 50

export default function AlertHistory() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offset, setOffset] = useState(0)

  const load = (o: number) => {
    setLoading(true)
    api.getAlerts({ limit: PAGE, offset: o })
      .then(setAlerts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(offset) }, [offset])

  const statusBadge = (status: string) => {
    if (status === 'sent') return <span className="badge badge-green">sent</span>
    if (status === 'failed') return <span className="badge badge-red">failed</span>
    return <span className="badge badge-yellow">{status}</span>
  }

  const fmt = (dt: string | null) => dt ? new Date(dt).toLocaleString() : '—'

  return (
    <div>
      <div className="page-header">
        <h1>Alert History</h1>
        <p>All keyword match alerts, most recent first.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Alerts</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setOffset(Math.max(0, offset - PAGE))} disabled={offset === 0}>← Prev</button>
            <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{offset + 1}–{offset + alerts.length}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setOffset(offset + PAGE)} disabled={alerts.length < PAGE}>Next →</button>
          </div>
        </div>

        {loading ? (
          <div className="empty"><span className="spinner" /></div>
        ) : alerts.length === 0 ? (
          <div className="empty">No alerts yet. Add a location and keyword, then trigger a poll.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Triggered</th>
                  <th>Keyword</th>
                  <th>Post content</th>
                  <th>Author</th>
                  <th>Neighborhood</th>
                  <th>Notifications</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(a.triggered_at)}</td>
                    <td><span className="badge badge-green">{a.matched_keyword}</span></td>
                    <td>
                      <div className="truncate" title={a.post?.content ?? ''}>
                        {a.post?.content ?? '—'}
                      </div>
                      {a.post?.source_url && (
                        <a href={a.post.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>view post ↗</a>
                      )}
                    </td>
                    <td>{a.post?.author_name ?? '—'}</td>
                    <td>{a.post?.neighborhood ?? '—'}</td>
                    <td>
                      {a.notification_logs.length === 0 ? (
                        <span className="badge badge-gray">none</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {a.notification_logs.map(n => (
                            <div key={n.id}>{statusBadge(n.status)}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
