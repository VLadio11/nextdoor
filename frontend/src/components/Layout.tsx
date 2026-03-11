import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'System Status', icon: '📡' },
  { to: '/alerts', label: 'Alert History', icon: '🔔' },
  { to: '/locations', label: 'Locations', icon: '📍' },
  { to: '/keywords', label: 'Keywords', icon: '🔑' },
  { to: '/recipients', label: 'Recipients', icon: '📧' },
]

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>📡</span>Nextdoor Monitor
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
