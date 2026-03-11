export interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_km: number
  is_active: boolean
  created_at: string
}

export interface Keyword {
  id: string
  phrase: string
  is_active: boolean
  created_at: string
}

export interface Recipient {
  id: string
  email: string
  name: string | null
  is_active: boolean
  created_at: string
}

export interface DiscoveredPost {
  id: string
  source: string
  external_id: string
  location_id: string | null
  content: string
  author_name: string | null
  posted_at: string | null
  neighborhood: string | null
  source_url: string | null
  first_seen_at: string
}

export interface NotificationLog {
  id: string
  alert_id: string
  recipient_id: string
  sent_at: string | null
  status: 'pending' | 'sent' | 'failed'
  error_message: string | null
  attempt_count: number
}

export interface Alert {
  id: string
  post_id: string
  matched_keyword: string
  triggered_at: string
  post: DiscoveredPost | null
  notification_logs: NotificationLog[]
}

export interface SchedulerStatus {
  running: boolean
  sim_mode: boolean
  poll_interval_seconds: number
  next_run_time: string | null
  last_run_result: Record<string, unknown> | null
  last_run_error: string | null
}
