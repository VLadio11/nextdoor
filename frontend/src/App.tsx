import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AlertHistory from './components/pages/AlertHistory'
import Keywords from './components/pages/Keywords'
import Locations from './components/pages/Locations'
import Recipients from './components/pages/Recipients'
import SystemStatus from './components/pages/SystemStatus'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SystemStatus />} />
        <Route path="alerts" element={<AlertHistory />} />
        <Route path="locations" element={<Locations />} />
        <Route path="keywords" element={<Keywords />} />
        <Route path="recipients" element={<Recipients />} />
      </Route>
    </Routes>
  )
}
