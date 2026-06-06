import { API_BASE_URL } from './config';
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import PoliceLogin from './pages/PoliceLogin'
import PoliceRegister from './pages/PoliceRegister'
import ReviewReports from './pages/ReviewReports'
import ReviewAppeals from './pages/ReviewAppeals'
import Profile from './pages/Profile'
import About from './pages/About'
import Rules from './pages/Rules'
import Analytics from './pages/Analytics'
import CitizenDashboard from './pages/CitizenDashboard'
import PoliceCommand from './pages/PoliceCommand'
import SubmitReport from './pages/SubmitReport'
import MyReports from './pages/MyReports'
import MyChallans from './pages/MyChallans'
import PaymentPage from './pages/PaymentPage'
import ChallanCreation from './pages/ChallanCreation'
import Hero from './pages/Hero'
import VehicleSearch from './pages/VehicleSearch'
import Leaderboard from './pages/Leaderboard'
import FutureScopes from './pages/FutureScopes'
import RewardsRedeem from './pages/RewardsRedeem'
import Settings from './pages/Settings'
import MyVehicles from './pages/MyVehicles'
import OfficerStats from './pages/OfficerStats'
import OverdueLog from './pages/OverdueLog'
import PaymentHistory from './pages/PaymentHistory'
import NotFound from './pages/NotFound'
import Navbar from './components/Navbar'
import NotificationWidget from './components/NotificationWidget'
import RoadConditions from './pages/RoadConditions'

function AppContent() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        // Refresh from server to get full_name and latest data
        fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }).then(r => r.ok ? r.json() : null).then(profile => {
          if (profile) {
            const updated = { ...parsedUser, ...profile }
            localStorage.setItem('user', JSON.stringify(updated))
            setUser(updated)
          }
        }).catch(() => {})
      } catch (err) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

const handleLogin = (data) => {
    console.log('Login response data:', data)
    
    // FastAPI sends 'token', but we check for 'access_token' too just in case
    const token = data.access_token || data.token;
    
    if (!token) {
      console.error('No token found in login response!', data)
      return
    }
    
    console.log('Saving to localStorage:', { token: token.substring(0, 20) + '...', user: data.user })
    
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    
    console.log('User state updated:', data.user)
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (e) { /* ignore network errors on logout */ }
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-white">
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <Login onLogin={handleLogin} />
            ) : user.role === 'citizen' ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/police" replace />
            )
          }
        />
        <Route
          path="/hero"
          element={
            user ? <Hero /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/register"
          element={
            !user ? (
              <Register onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <Profile user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/about"
          element={
            user ? <About /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/rules"
          element={
            user ? <Rules /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/analytics"
          element={
            user ? <Analytics user={user} /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/road-conditions"
          element={
            user ? <RoadConditions /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/dashboard"
          element={
            user?.role === 'citizen' ? (
              <CitizenDashboard user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/submit-report"
          element={
            user?.role === 'citizen' ? <SubmitReport /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/my-reports"
          element={
            user ? <MyReports /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/my-challans"
          element={
            user?.role === 'citizen' ? (
              <MyChallans user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/payment/:challanId"
          element={
            user?.role === 'citizen' ? (
              <PaymentPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/police"
          element={
            user?.role === 'police' ? (
              <PoliceCommand user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/vehicle-search"
          element={
            user?.role === 'police' ? (
              <VehicleSearch />
            ) : (
              <Navigate to="/hero" replace />
            )
          }
        />
        <Route
          path="/police/login"
          element={
            !user ? (
              <PoliceLogin onLogin={handleLogin} />
            ) : (
              <Navigate to="/hero" replace />
            )
          }
        />
        <Route
          path="/police/register"
          element={
            !user ? (
              <PoliceRegister onLogin={handleLogin} />
            ) : (
              <Navigate to="/hero" replace />
            )
          }
        />
        <Route
          path="/police/review-reports"
          element={
            user?.role === 'police' ? (
              <ReviewReports user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/police/review-appeals"
          element={
            user?.role === 'police' ? (
              <ReviewAppeals user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/police/create-challan/:reportId"
          element={
            user?.role === 'police' ? (
              <ChallanCreation user={user} />
            ) : (
              <Navigate to="/police" replace />
            )
          }
        />
        <Route
          path="/leaderboard"
          element={
            user ? <Leaderboard /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/rewards"
          element={
            user?.role === 'citizen' ? (
              <RewardsRedeem />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/future-scopes"
          element={
            user ? <FutureScopes /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/settings"
          element={
            user ? <Settings /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/my-vehicles"
          element={
            user?.role === 'citizen' ? <MyVehicles /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/payment-history"
          element={
            user?.role === 'citizen' ? <PaymentHistory /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/police/officer-stats"
          element={
            user?.role === 'police' ? <OfficerStats /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/police/overdue-log"
          element={
            user?.role === 'police' ? <OverdueLog /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Floating Notification Widget */}
      {user && <NotificationWidget user={user} />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  )
}
