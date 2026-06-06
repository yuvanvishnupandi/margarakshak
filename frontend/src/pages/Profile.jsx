import { useState, useEffect } from 'react'
import { Card, Button, Input, Badge, Skeleton } from '../components/ui/BaseComponents'
import { useToast } from '../context/ToastContext'

function Profile({ user }) {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone_no: '',
    trust_score: 0,
    reward_points: 0,
    account_status: 'Active',
    badge_number: '',
    rank: '',
    station: '',
    total_processed: 0,
    total_reports: 0,
    pending_challans: 0,
    verified_reports: 0
  })
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    fetchProfileData()
  }, [user])

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch profile data
      let profile = {}
      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        })
        if (profileRes.ok) {
          profile = await profileRes.json()
        }
      } catch (err) {
        console.warn('Profile API failed, using localStorage:', err)
      }
      
      // Fetch reports
      let reports = { reports: [] }
      try {
        const reportsRes = await fetch(`${API_BASE_URL}/api/reports/my-reports/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (reportsRes.ok) {
          reports = await reportsRes.json()
        }
      } catch (err) {
        console.warn('Reports API failed:', err)
      }
      
      // Fetch challans
      let challans = { challans: [] }
      try {
        const challansRes = await fetch(`${API_BASE_URL}/api/challans/citizen/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (challansRes.ok) {
          challans = await challansRes.json()
        }
      } catch (err) {
        console.warn('Challans API failed:', err)
      }
      
      if (user?.role === 'citizen') {
        const reportsList = reports.reports || []
        const challansList = challans.challans || []
        const verifiedCount = reportsList.filter(r => r.status === 'Verified' || r.status === 'Challan Issued').length || 0
        
        const newProfileData = {
          full_name: profile.name || user?.name || '',
          email: profile.email || user?.email || '',
          phone_no: profile.phone_no || user?.phone || 'Not provided',
          trust_score: profile.trust_score ?? user?.trust_score ?? 50,
          reward_points: profile.reward_points ?? user?.reward_points ?? 0,
          account_status: profile.account_status || 'Active',
          total_reports: reportsList.length,
          pending_challans: challansList.filter(c => c.payment_status === 'Unpaid').length,
          verified_reports: verifiedCount
        }
        
        setProfileData(newProfileData)
        
        // Extract unique vehicles from reports
        const vehicleMap = {}
        reportsList.forEach(report => {
          if (report.plate_no && !vehicleMap[report.plate_no]) {
            vehicleMap[report.plate_no] = {
              plate_no: report.plate_no,
              violation_count: 0,
              last_reported: report.reported_at,
              status: report.status
            }
          }
          if (report.plate_no) {
            vehicleMap[report.plate_no].violation_count++
            if (new Date(report.reported_at) > new Date(vehicleMap[report.plate_no].last_reported)) {
              vehicleMap[report.plate_no].last_reported = report.reported_at
              vehicleMap[report.plate_no].status = report.status
            }
          }
        })
        setVehicles(Object.values(vehicleMap))
        
        // Update localStorage with latest trust score
        const currentUser = JSON.parse(localStorage.getItem('user'))
        if (currentUser) {
          currentUser.trust_score = newProfileData.trust_score
          currentUser.reward_points = newProfileData.reward_points
          localStorage.setItem('user', JSON.stringify(currentUser))
        }
      } else {
        setProfileData({
          full_name: profile.name || user?.name || '',
          email: profile.email || user?.email || '',
          phone_no: profile.phone_no || user?.phone || 'Not provided',
          badge_number: profile.badge_number || user?.badge_number || 'N/A',
          rank: profile.rank || user?.rank || 'N/A',
          station: profile.station || user?.station || 'N/A',
          total_processed: 0
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile data:', err)
      // Fallback to localStorage data
      if (user?.role === 'citizen') {
        setProfileData({
          full_name: user?.name || '',
          email: user?.email || '',
          phone_no: user?.phone || 'Not provided',
          trust_score: user?.trust_score ?? 50,
          reward_points: user?.reward_points ?? 0,
          account_status: 'Active',
          total_reports: 0,
          pending_challans: 0,
          verified_reports: 0
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          phone_no: profileData.phone_no
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      setEditing(false)
      success('Profile updated successfully')
    } catch (err) {
      showError('Failed to update profile')
    }
  }


  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'128px', paddingBottom:'32px', paddingLeft:'16px', paddingRight:'16px' }}>
        <div className="w-full max-w-[1920px] mx-auto">
          <Card className="p-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'128px', paddingBottom:'32px', paddingLeft:'16px', paddingRight:'16px' }}>
      <div className="w-full max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold  mb-2">My Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="">Manage your account information and view your activity</p>
        </div>

        {/* Citizen Profile */}
        {user?.role === 'citizen' && (
          <div className="space-y-8">

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card hover className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Total Reports</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">{profileData.total_reports}</p>
                  </div>
                </div>
              </Card>

              <Card hover className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Verified Reports</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">{profileData.verified_reports}</p>
                  </div>
                </div>
              </Card>

              <Card hover className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Pending Challans</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">{profileData.pending_challans}</p>
                  </div>
                </div>
              </Card>

              <Card hover className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Vehicles Reported</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">{vehicles.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Registered Vehicles */}
            {vehicles.length > 0 && (
              <Card>
                <div style={{ borderColor: 'var(--border)' }} className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Registered Vehicles</h2>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-sm  mt-1">Vehicles you have reported violations for</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((vehicle, index) => (
                      <div key={index} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="rounded-xl p-5 border hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ color: 'var(--text-secondary)' }} className="text-xs">Vehicle Plate</p>
                              <p style={{ color: 'var(--text-primary)' }} className="text-lg font-bold font-mono">{vehicle.plate_no}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            vehicle.status === 'Verified' || vehicle.status === 'Challan Issued' 
                              ? 'bg-green-100 text-green-800' 
                              : vehicle.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {vehicle.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p style={{ color: 'var(--text-secondary)' }} className="text-xs">Violation Count</p>
                            <p style={{ color: 'var(--text-primary)' }} className="font-semibold">{vehicle.violation_count}</p>
                          </div>
                          <div className="text-right">
                            <p style={{ color: 'var(--text-secondary)' }} className="text-xs">Last Reported</p>
                            <p style={{ color: 'var(--text-primary)' }} className="font-semibold">{new Date(vehicle.last_reported).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Account Information */}
            <Card>
              <div style={{ borderColor: 'var(--border)' }} className="p-6 border-b  flex items-center justify-between">
                <div>
                  <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Account Information</h2>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm  mt-1">Your personal details and contact information</p>
                </div>
                {!editing && (
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    disabled={!editing}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!editing}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />

                  <Input
                    label="Phone Number"
                    value={profileData.phone_no}
                    onChange={(e) => setProfileData({ ...profileData, phone_no: e.target.value })}
                    disabled={!editing}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    }
                  />

                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium  mb-1.5">Role</label>
                    <div style={{ background: 'var(--bg-secondary)' }} className="flex items-center gap-2 px-3 py-2.5  rounded-lg border border-gray-300">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span style={{ color: 'var(--text-primary)' }} className="font-medium capitalize">{user?.role || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {editing && (
                  <div style={{ borderColor: 'var(--border)' }} className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleSave} variant="primary" size="md">
                      Save Changes
                    </Button>
                    <Button onClick={() => setEditing(false)} variant="secondary" size="md">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Police Profile */}
        {user?.role === 'police' && (
          <div className="space-y-8">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div style={{ background: 'var(--bg-card)' }} className="w-24 h-24 /20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium opacity-90 mb-1">Badge Number</p>
                      <p className="text-5xl font-bold font-mono">{profileData.badge_number}</p>
                      <p className="text-lg mt-2 opacity-90">{profileData.rank} - {profileData.station}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ borderColor: 'var(--border)' }} className="p-6 border-b">
                <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Account Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={profileData.full_name} disabled icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
                  <Input label="Email" value={profileData.email} disabled icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
                  <Input label="Phone" value={profileData.phone_no} disabled icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium  mb-1.5">Role</label>
                    <div style={{ background: 'var(--bg-secondary)' }} className="flex items-center gap-2 px-3 py-2.5  rounded-lg border border-gray-300">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <span style={{ color: 'var(--text-primary)' }} className="font-medium capitalize">Police Officer</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
