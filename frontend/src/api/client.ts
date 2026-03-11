const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Locations
  getLocations: () => request<import('../types').Location[]>('/locations/'),
  createLocation: (body: object) => request<import('../types').Location>('/locations/', { method: 'POST', body: JSON.stringify(body) }),
  updateLocation: (id: string, body: object) => request<import('../types').Location>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLocation: (id: string) => request<void>(`/locations/${id}`, { method: 'DELETE' }),

  // Keywords
  getKeywords: () => request<import('../types').Keyword[]>('/keywords/'),
  createKeyword: (body: object) => request<import('../types').Keyword>('/keywords/', { method: 'POST', body: JSON.stringify(body) }),
  updateKeyword: (id: string, body: object) => request<import('../types').Keyword>(`/keywords/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteKeyword: (id: string) => request<void>(`/keywords/${id}`, { method: 'DELETE' }),

  // Recipients
  getRecipients: () => request<import('../types').Recipient[]>('/recipients/'),
  createRecipient: (body: object) => request<import('../types').Recipient>('/recipients/', { method: 'POST', body: JSON.stringify(body) }),
  updateRecipient: (id: string, body: object) => request<import('../types').Recipient>(`/recipients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRecipient: (id: string) => request<void>(`/recipients/${id}`, { method: 'DELETE' }),

  // Alerts
  getAlerts: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    return request<import('../types').Alert[]>(`/alerts/?${qs}`)
  },

  // System
  getStatus: () => request<import('../types').SchedulerStatus>('/system/status'),
  pollNow: () => request<{ message: string }>('/system/poll-now', { method: 'POST' }),
}
