import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'

const API_BASE_URL = 'http://localhost:5000'

function ReviewAppeals({ user }) {
  const { success, error: showError } = useToast()
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchAppeals()
    const iv = setInterval(fetchAppeals, 5000)
    return () => clearInterval(iv)
  }, [user])

  const fetchAppeals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/appeals/police/pending`)
      if (!res.ok) throw new Error('Failed to fetch appeals')
      const data = await res.json()
      setAppeals(data.appeals || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (appeal) => {
    setSelected(appeal)
    setNotes('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelected(null)
    setNotes('')
  }

  const handleDecision = async (decision) => {
    if (!selected) return
    setProcessing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/appeals/${selected.appeal_id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, review_notes: notes, badge_no: user.id })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Failed') }
      success(`Appeal ${decision.toLowerCase()} successfully`)
      closeModal()
      fetchAppeals()
    } catch (err) {
      showError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const statusStyle = (s) => {
    const map = {
      Pending: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
      'Under Review': { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
      Accepted: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
      Rejected: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    }
    return map[s] || { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
  }

  const total = appeals.length
  const pending = appeals.filter(a => a.status === 'Pending').length
  const underReview = appeals.filter(a => a.status === 'Under Review').length

  if (loading && appeals.length === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Loading appeals...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '104px 32px 56px' }}>

      {/* Review Modal */}
      {showModal && selected && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.15)', maxWidth: '580px', width: '100%', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Review Appeal #{selected.appeal_id}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Challan #{selected.challan_id}</p>
              </div>
              <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                Close
              </button>
            </div>

            {/* Appeal Details */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  {[
                    { label: 'Citizen', value: selected.citizen_name },
                    { label: 'Violation', value: selected.rule_name },
                    { label: 'Challan Amount', value: `Rs. ${parseFloat(selected.total_amount).toFixed(2)}` },
                    { label: 'Vehicle', value: selected.plate_no },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Appeal Reason</p>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.6, wordBreak: 'break-word' }}>
                      {selected.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Review Notes <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter your decision rationale..."
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', color: 'var(--text-primary)', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleDecision('Accepted')} disabled={processing}
                  style={{ flex: 1, padding: '11px', background: processing ? '#d1fae5' : '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!processing) e.currentTarget.style.background = '#15803d' }}
                  onMouseLeave={e => { if (!processing) e.currentTarget.style.background = '#16a34a' }}>
                  {processing ? 'Processing...' : 'Accept Appeal'}
                </button>
                <button onClick={() => handleDecision('Rejected')} disabled={processing}
                  style={{ flex: 1, padding: '11px', background: processing ? '#fee2e2' : '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!processing) e.currentTarget.style.background = '#b91c1c' }}
                  onMouseLeave={e => { if (!processing) e.currentTarget.style.background = '#dc2626' }}>
                  {processing ? 'Processing...' : 'Reject Appeal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Review Appeals</h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Review and decide on citizen challan disputes</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Appeals', value: total, color: 'var(--text-primary)' },
          { label: 'Pending Review', value: pending, color: '#d97706' },
          { label: 'Under Review', value: underReview, color: '#2563eb' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', minWidth: '160px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {appeals.length === 0 ? (
          <div style={{ padding: '72px 24px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>No Pending Appeals</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>All appeals have been reviewed.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '175px' }} />
              <col style={{ width: '165px' }} />
              <col style={{ width: '110px' }} />
              <col />
              <col style={{ width: '100px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '100px' }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Appeal', 'Challan', 'Citizen', 'Violation', 'Amount', 'Reason', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.7px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appeals.map(a => (
                <tr key={a.appeal_id} style={{ borderBottom: '1px solid #f1f5f9', background: 'var(--bg-card)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '16px 16px', fontSize: '13px', fontWeight: 800, color: '#4f46e5' }}>#{a.appeal_id}</td>
                  <td style={{ padding: '16px 16px', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>#{a.challan_id}</td>
                  <td style={{ padding: '16px 16px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.citizen_name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.citizen_email}</p>
                  </td>
                  <td style={{ padding: '16px 16px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.rule_name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{a.plate_no}</p>
                  </td>
                  <td style={{ padding: '16px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rs. {parseFloat(a.total_amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 16px', fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.reason}>
                    {a.reason}
                  </td>
                  <td style={{ padding: '16px 16px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '16px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, ...statusStyle(a.status) }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 16px' }}>
                    {a.status === 'Pending' && (
                      <button onClick={() => openModal(a)}
                        style={{ padding: '7px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                        onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ReviewAppeals
