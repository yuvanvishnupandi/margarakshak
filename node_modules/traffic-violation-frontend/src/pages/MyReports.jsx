import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;

function MyReports() {
  const { success, error: showError } = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingReport, setEditingReport] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchReports(true)
    
    const interval = setInterval(fetchReports, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchReports = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        showError('Please login to view your reports')
        return
      }

      const user = JSON.parse(userStr)
      const res = await fetch(`${API_BASE_URL}/api/reports/my-reports/${user.id}`)
      
      if (!res.ok) throw new Error('Failed to fetch reports')
      
      const data = await res.json()
      const filtered = (data.reports || []).filter(r => r.violation_type !== 'Direct Citation')
      setReports(filtered)
    } catch (err) {
      if (isInitial) showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/delete/${reportId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.detail || 'Failed to delete report')
      }

      success('Report deleted successfully')
      fetchReports()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleEdit = (report) => {
    setEditingReport(report.report_id)
    setEditForm({
      plate_no: report.plate_no,
      location_address: report.location_address || '',
      description: report.description || ''
    })
  }

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/update/${editingReport}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.detail || 'Failed to update report')
      }

      success('Report updated successfully')
      setEditingReport(null)
      setEditForm({})
      fetchReports()
    } catch (err) {
      showError(err.message)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-amber-100 text-amber-800',
      'Verified': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'128px', paddingBottom:'32px', paddingLeft:'16px', paddingRight:'16px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px 64px' }}>
        {}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>My Violation Reports</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>View and track all your submitted traffic violation reports</p>
        </div>

        {}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {reports.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No Reports Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>You haven't submitted any traffic violation reports.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Plate</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Violation Type</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.report_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>#{report.report_id}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>{report.plate_no}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--text-primary)' }}>{report.violation_type}</td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{report.location_address || 'N/A'}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: '1px solid transparent', ...{
                          'Pending': { background:'var(--warning-light)', color:'var(--warning)', borderColor:'var(--warning)' },
                          'Verified': { background:'var(--success-light)', color:'var(--success)', borderColor:'var(--success)' },
                          'Rejected': { background:'var(--danger-light)', color:'var(--danger)', borderColor:'var(--danger)' },
                          'Challan Issued': { background:'var(--accent-light)', color:'var(--accent)', borderColor:'var(--accent)' }
                        }[report.status] || { background:'var(--bg-secondary)', color:'var(--text-secondary)', borderColor:'var(--border)' } }}>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {new Date(report.reported_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => report.status === 'Pending' ? handleEdit(report) : null}
                            disabled={report.status !== 'Pending'}
                            title={report.status !== 'Pending' ? `Cannot edit — report is ${report.status}` : 'Edit this report'}
                            style={{
                              padding: '6px 12px',
                              background: report.status === 'Pending' ? 'var(--info)' : 'var(--bg-secondary)',
                              color: report.status === 'Pending' ? '#fff' : 'var(--text-secondary)',
                              borderRadius: '8px',
                              border: report.status === 'Pending' ? 'none' : '1px solid var(--border)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: report.status === 'Pending' ? 'pointer' : 'not-allowed',
                              opacity: report.status === 'Pending' ? 1 : 0.6,
                              transition: 'all 0.2s'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => report.status === 'Pending' ? handleDelete(report.report_id) : null}
                            disabled={report.status !== 'Pending'}
                            title={report.status !== 'Pending' ? `Cannot delete — report is ${report.status}` : 'Delete this report'}
                            style={{
                              padding: '6px 12px',
                              background: report.status === 'Pending' ? 'var(--danger)' : 'var(--bg-secondary)',
                              color: report.status === 'Pending' ? '#fff' : 'var(--text-secondary)',
                              borderRadius: '8px',
                              border: report.status === 'Pending' ? 'none' : '1px solid var(--border)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: report.status === 'Pending' ? 'pointer' : 'not-allowed',
                              opacity: report.status === 'Pending' ? 1 : 0.6,
                              transition: 'all 0.2s'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingReport && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>Edit Report</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Vehicle Plate Number</label>
                  <input
                    type="text"
                    value={editForm.plate_no || ''}
                    onChange={(e) => setEditForm({...editForm, plate_no: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Location Address</label>
                  <input
                    type="text"
                    value={editForm.location_address || ''}
                    onChange={(e) => setEditForm({...editForm, location_address: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows="4"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleUpdate}
                  style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingReport(null)
                    setEditForm({})
                  }}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyReports
