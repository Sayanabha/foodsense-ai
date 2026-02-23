import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import Predictions from './pages/Predictions'
import Inventory from './pages/Inventory'
import AIAssistantPage from './pages/AIAssistant'
import Reports from './pages/Reports'
import PhotoWaste from './pages/PhotoWaste'
import DonationMatcher from './pages/DonationMatcher'
import ScenarioPlanner from './pages/ScenarioPlanner'

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem', background: 'var(--bg)' }}>
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/inventory"   element={<Inventory />} />
            <Route path="/assistant"   element={<AIAssistantPage />} />
            <Route path="/reports"     element={<Reports />} />
            <Route path="/photo-waste" element={<PhotoWaste />} />
            <Route path="/donations"   element={<DonationMatcher />} />
            <Route path="/scenarios"   element={<ScenarioPlanner />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}