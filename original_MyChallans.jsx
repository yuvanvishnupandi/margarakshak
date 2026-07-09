import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;

function MyChallans({ user }) {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [challans, setChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(null)
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedChallan, setSelectedChallan] = useState(null)
  const [disputeReason, setDisputeReason] = useState('')

  const isOverdue = (challan) => {
    if (challan.payment_status !== 'Unpaid') return false
    const due = new Date(challan.due_date)
    due.setHours(23, 59, 59, 999)
    return new Date() > due
  }

  const getEffectiveAmount = (challan) => {
    const base = parseFloat(challan.total_amount)
    return isOverdue(challan) ? +(base * 1.1).toFixed(2) : base
  }

  useEffect(() => {
    fetchChallans()
    
    const interval = setInterval(fetchChallans, 3000)
    
    return () => clearInterval(interval)
  }, [user])

  const fetchChallans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/challans/my?citizen_id=${user?.id}`)
      
      if (!res.ok) throw new Error('Failed to fetch challans')
      
      const data = await res.json()
      setChallans(data.challans || [])
    } catch (err) {
      console.error('Error fetching challans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChallanClick = (challanId, paymentStatus) => {
    if (paymentStatus === 'Unpaid') {
      
      navigate(`/payment/${challanId}`)
    }
    
  }

  const getStatusBadge = (status) => {
    const styles = {
      'Unpaid': 'bg-red-100 text-red-800 border-red-300',
      'Paid': 'bg-green-100 text-green-800 border-green-300',
      'Overdue': 'bg-orange-100 text-orange-800 border-orange-300',
      'Waived': 'bg-blue-100 text-blue-800 border-blue-300',
      'Disputed': 'bg-yellow-100 text-yellow-800 border-yellow-300'
    }
    return styles[status] || 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)]'
  }

  const handleViewEvidence = (challan) => {
    if (challan.evidence_photos && challan.evidence_photos.length > 0) {
      setSelectedEvidence(challan.evidence_photos)
      setCurrentPhotoIndex(0)
      setShowEvidenceModal(true)
    }
  }

  const handleDispute = (challan) => {
    setSelectedChallan(challan)
    setDisputeReason('')
    setShowDisputeModal(true)
  }

  const handleViewReceipt = (challan) => {
    setSelectedChallan(challan)
    setShowReceiptModal(true)
  }

  const submitDispute = async () => {
    if (disputeReason.trim().length < 50) {
      showError('Please provide at least 50 characters explaining your dispute')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/appeals/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challan_id: selectedChallan.challan_id,
          citizen_id: user.id,
          reason: disputeReason.trim()
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.detail || 'Failed to submit appeal')
      }

      success('Appeal submitted successfully! Police will review your case.')
      setShowDisputeModal(false)
      fetchChallans()
    } catch (err) {
      showError(err.message)
    }
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev >= selectedEvidence.length - 1 ? 0 : prev + 1
    )
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev <= 0 ? selectedEvidence.length - 1 : prev - 1
    )
  }

  const calculateSummary = () => {
    const total = challans.length
    const unpaid = challans.filter(c => c.payment_status === 'Unpaid').length
    const totalDue = challans
      .filter(c => c.payment_status === 'Unpaid')
      .reduce((sum, c) => sum + getEffectiveAmount(c), 0)
    return { total, unpaid, totalDue }
  }

  const summary = calculateSummary()

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-4">Loading your challans...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'144px', paddingBottom:'32px', paddingLeft:'16px', paddingRight:'16px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px 64px' }}>
        {}
        <div className="mb-8 mt-6">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold mb-2">My Challans</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and manage your traffic violation challans</p>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="p-6 rounded-2xl shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm  mb-1">Total Challans</p>
                <p style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold">{summary.total}</p>
              </div>
              <div style={{ background: 'var(--bg-secondary)' }} className="w-12 h-12  rounded-full flex items-center justify-center">
                <svg style={{ color: 'var(--text-secondary)' }} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="p-6 rounded-2xl shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm  mb-1">Unpaid Challans</p>
                <p className="text-3xl font-bold text-red-600">{summary.unpaid}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="p-6 rounded-2xl shadow-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm  mb-1">Total Due Amount</p>
                <p className="text-3xl font-bold text-amber-600">Rs. {summary.totalDue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {}
        <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="rounded-2xl shadow-lg border  overflow-hidden">
          {challans.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4 text-green-600 font-bold">✓</div>
              <h3 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold  mb-2">No Challans</h3>
              <p style={{ color: 'var(--text-secondary)' }} className="">You have no traffic violation challans. Keep driving safely!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="border-b">
                  <tr>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Challan ID</th>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Violation</th>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Vehicle Plate</th>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Amount <span style={{fontSize:'10px',color:'#dc2626',fontWeight:700}}>+10% if overdue</span></th>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Issue Date</th>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Due Date</th>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Status</th>
                    <th style={{ color: 'var(--text-secondary)' }} className="text-left py-4 px-6 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((challan) => (
                    <tr key={challan.challan_id} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="border-b  hover:">
                      <td style={{ color: 'var(--text-primary)' }} className="py-4 px-6 text-sm font-mono">#{challan.challan_id}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">{challan.rule_name}</p>
                          <p style={{ color: 'var(--text-secondary)' }} className="text-xs">{challan.rule_code}</p>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-primary)' }} className="py-4 px-6 text-sm font-mono">{challan.plate_no}</td>
                      <td className="py-4 px-6">
                        {isOverdue(challan) ? (
                          <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                            <span style={{textDecoration:'line-through',color:'#9ca3af',fontSize:'12px'}}>Rs. {parseFloat(challan.total_amount).toFixed(2)}</span>
                            <span style={{fontWeight:800,color:'#dc2626',fontSize:'14px'}}>Rs. {getEffectiveAmount(challan).toFixed(2)}</span>
                            <span className="late-fee-badge">⚠ Late Fee Applied</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">Rs. {parseFloat(challan.total_amount).toFixed(2)}</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }} className="py-4 px-6 text-sm">
                        {new Date(challan.issue_date).toLocaleDateString()}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }} className="py-4 px-6 text-sm">
                        {new Date(challan.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(challan.payment_status)}`}>
                          {challan.payment_status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {challan.payment_status === 'Unpaid' && (
                            <button
                              onClick={() => handleChallanClick(challan.challan_id, challan.payment_status)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Pay Fine
                            </button>
                          )}
                          {challan.payment_status === 'Paid' && (
                            <button
                              onClick={() => handleViewReceipt(challan)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                              View Receipt
                            </button>
                          )}
                          {challan.evidence_photos && challan.evidence_photos.length > 0 && (
                            <button
                              onClick={() => handleViewEvidence(challan)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              View Evidence
                            </button>
                          )}
                          {(challan.payment_status === 'Unpaid' || challan.payment_status === 'Overdue') && (
                            <button
                              onClick={() => handleDispute(challan)}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Dispute
                            </button>
                          )}
                          {challan.payment_status === 'Disputed' && (
                            <span className="text-xs text-yellow-600 font-semibold">Under Review</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {}
        <div style={{
          marginTop: '24px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1.5px solid #bbf7d0',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', background: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#065f46' }}>View Your Payment History</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#047857' }}>See all paid challans, amounts, dates and transaction references</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/payment-history')}
            style={{
              padding: '10px 22px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#059669'}
            onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
          >
            See Payment History →
          </button>
        </div>
      </div>

      {}
      {showEvidenceModal && selectedEvidence.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl w-full">
            {}
            <button
              onClick={() => setShowEvidenceModal(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {}
            <div style={{ background: 'var(--bg-card)' }} className="rounded-2xl overflow-hidden">
              <div className="relative h-[500px] bg-gray-900">
                <img
                  src={`${API_BASE_URL}${selectedEvidence[currentPhotoIndex].image_url}`}
                  alt={selectedEvidence[currentPhotoIndex].caption}
                  className="w-full h-full object-contain"
                />
                
                {}
                {selectedEvidence.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {}
              <div style={{ background: 'var(--bg-card)' }} className="p-6">
                <div className="flex justify-between items-center">
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    {selectedEvidence[currentPhotoIndex].caption || 'Evidence Photo'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    {currentPhotoIndex + 1} / {selectedEvidence.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {showDisputeModal && selectedChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div style={{ background: 'var(--bg-card)' }} className="rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">Dispute Challan #{selectedChallan.challan_id}</h2>
              <button
                onClick={() => setShowDisputeModal(false)}
                style={{ color: 'var(--text-secondary)' }} className="hover:"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {}
            <div style={{ background: 'var(--bg-secondary)' }} className="rounded-lg p-4 mb-6 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Violation</p>
                  <p style={{ color: 'var(--text-primary)' }} className="font-semibold">{selectedChallan.rule_name}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Vehicle</p>
                  <p style={{ color: 'var(--text-primary)' }} className="font-semibold">{selectedChallan.plate_no}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Amount</p>
                  <p style={{ color: 'var(--text-primary)' }} className="font-semibold">Rs. {parseFloat(selectedChallan.total_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Issue Date</p>
                  <p style={{ color: 'var(--text-primary)' }} className="font-semibold">
                    {new Date(selectedChallan.issue_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="mb-6">
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold  mb-2">
                Reason for Dispute <span className="text-red-600">*</span>
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why you believe this challan is incorrect. Please provide detailed information (minimum 50 characters)..."
                style={{ borderColor: 'var(--border)' }} className="w-full px-4 py-3 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
              />
              <p style={{ color: 'var(--text-secondary)' }} className="text-xs  mt-1">
                {disputeReason.length} / 50 characters minimum
              </p>
            </div>

            {}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-800 font-semibold">Important Information</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Filing a false appeal may result in additional penalties. Your challan status will be updated to "Disputed" while under review. 
                    Please provide accurate and honest information.
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="flex gap-4">
              <button
                onClick={() => setShowDisputeModal(false)}
                style={{ color: 'var(--text-primary)' }} className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300  font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDispute}
                disabled={disputeReason.trim().length < 50}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Appeal
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showReceiptModal && selectedChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div style={{ background: 'var(--bg-card)', maxHeight: '90vh' }} className="rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
            {}
            <div className="bg-purple-600 p-4 flex justify-between items-center text-white shrink-0">
              <h2 className="text-lg font-bold">Digital Payment Receipt</h2>
              <button onClick={() => setShowReceiptModal(false)} className="hover:text-purple-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {}
            <div id="challan-receipt" style={{ background: 'var(--bg-secondary)' }} className="p-8 overflow-y-auto  flex-1">
              <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="border-2  rounded-xl p-8 shadow-sm relative overflow-hidden">
                {}
                <div style={{ borderColor: 'var(--border)' }} className="text-center border-b-2  pb-6 mb-6">
                  <div className="flex justify-center mb-4">
                    <div style={{ width:'60px', height:'60px', background:'#f3e8ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                  </div>
                  <h3 style={{ color: 'var(--text-primary)' }} className="text-xl font-black  uppercase tracking-tight">Government of Tamil Nadu</h3>
                  <p className="text-sm font-bold text-purple-700">Marga Rakshak Traffic Enforcement Portal</p>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-xs  mt-1">State Transport Authority, Chennai</p>
                </div>

                {}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 pointer-events-none opacity-[0.03]">
                  <span className="text-9xl font-black">PAID</span>
                </div>

                {}
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8">
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold  uppercase tracking-widest mb-1">Receipt Number</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm font-mono font-bold">RCPT-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold  uppercase tracking-widest mb-1">Payment Date</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">{new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold  uppercase tracking-widest mb-1">Challan ID</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">#{selectedChallan.challan_id}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold  uppercase tracking-widest mb-1">Vehicle Plate</p>
                    <p className="text-sm font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded inline-block">{selectedChallan.plate_no}</p>
                  </div>
                </div>

                {}
                <div style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="rounded-lg p-5 border  mb-8">
                  <div style={{ borderColor: 'var(--border)' }} className="flex justify-between items-center mb-4 pb-4 border-b  border-dashed">
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-semibold">{selectedChallan.rule_name}</p>
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">₹{parseFloat(selectedChallan.total_amount).toFixed(2)}</p>
                  </div>
                  {isOverdue(selectedChallan) && (
                    <div style={{ borderColor: 'var(--border)' }} className="flex justify-between items-center mb-4 pb-4 border-b  border-dashed">
                      <p className="text-sm font-semibold text-red-600">Late Payment Penalty (10%)</p>
                      <p className="text-sm font-bold text-red-600">₹{(parseFloat(selectedChallan.total_amount) * 0.1).toFixed(2)}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p style={{ color: 'var(--text-primary)' }} className="text-base font-black  uppercase">Total Amount Paid</p>
                    <p className="text-xl font-black text-purple-700">₹{getEffectiveAmount(selectedChallan).toFixed(2)}</p>
                  </div>
                </div>

                {}
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold  uppercase tracking-widest">Transaction Ref</p>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[11px] font-mono">TXN_{Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[11px]  mt-2 italic">This is a computer-generated digital receipt. No signature is required.</p>
                  </div>
                  <div className="text-right">
                    {}
                    <div style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="w-20 h-20  border  p-1 flex items-center justify-center rounded">
                      <div className="w-full h-full opacity-40 grid grid-cols-4 grid-rows-4 gap-1">
                        {[...Array(16)].map((_, i) => <div key={i} className={Math.random() > 0.5 ? 'bg-gray-800' : 'bg-transparent'} />)}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-[9px] font-bold  mt-1 uppercase">Verify Receipt</p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="p-4  border-t  flex gap-4 shrink-0">
              <button 
                onClick={() => setShowReceiptModal(false)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }} className="flex-1 py-3  border   font-bold rounded-xl hover: transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  const printContents = document.getElementById('challan-receipt').innerHTML;
                  const originalContents = document.body.innerHTML;
                  document.body.innerHTML = printContents;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload(); 
                }}
                className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  )
}

export default MyChallans
