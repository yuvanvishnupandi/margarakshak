import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

const API_BASE_URL = 'http://localhost:5000'

// Parse evidence_path which is stored as a JSON array (multi-photo support)
const getEvidencePaths = (evidencePath) => {
  if (!evidencePath) return []
  try {
    const parsed = JSON.parse(evidencePath)
    if (Array.isArray(parsed)) return parsed
    return [evidencePath]
  } catch {
    if (evidencePath.includes(',')) return evidencePath.split(',').map(p => p.trim())
    return [evidencePath]
  }
}

function ChallanCreation() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [report, setReport] = useState(null)
  const [rules, setRules] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const [fineAmount, setFineAmount] = useState('')
  const [notes, setNotes] = useState('')
  
  // Get logged-in police officer data
  const user = JSON.parse(localStorage.getItem('user'))
  const badgeNo = user?.badge_number || user?.id || 'POL-101'  // Fallback to POL-101

  useEffect(() => {
    fetchReportDetails()
    fetchRules()
  }, [reportId])

  const fetchReportDetails = async () => {
    try {
      // Use the new dedicated endpoint for single report details
      const res = await fetch(`${API_BASE_URL}/api/challans/report/${reportId}`)
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.detail || 'Failed to fetch report details')
      }
      
      const data = await res.json()
      setReport(data.report)
    } catch (err) {
      showError(err.message)
      navigate('/police/review-reports')
    } finally {
      setLoading(false)
    }
  }

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rules/all`)
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err)
    }
  }

  const handleRuleChange = (ruleId) => {
    const rule = rules.find(r => r.rule_id === parseInt(ruleId))
    setSelectedRule(rule)
    if (rule) {
      setFineAmount(rule.base_fine_amount.toString())
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedRule) {
      showError('Please select a violation rule')
      return
    }

    if (!fineAmount || parseFloat(fineAmount) <= 0) {
      showError('Please enter a valid fine amount')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/challans/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: parseInt(reportId),
          rule_id: selectedRule.rule_id,
          badge_no: badgeNo,  // Use logged-in officer's badge number
          total_amount: parseFloat(fineAmount),
          notes: notes
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.detail || 'Failed to create challan')
      }

      const data = await res.json()
      success(`Challan created successfully! Amount: Rs. ${data.total_amount}`)
      
      setTimeout(() => {
        navigate('/police/review-reports')
      }, 1500)
      
    } catch (err) {
      showError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report details...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Report not found</p>
          <button onClick={() => navigate('/police/review-reports')} className="mt-4 text-blue-600 hover:underline">
            Go back to Review Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pt-36">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Issue Challan</h1>
          <p className="text-gray-600">Create traffic violation challan for reported vehicle</p>
        </div>

        {/* Vehicle Information Profile */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-gray-900">Violator Vehicle Information</h2>
            <p className="text-sm text-gray-600 mt-1">Details from the reported violation</p>
          </div>
          
          <div className="p-6">
            {/* Violator Details Section */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3">🚗 Violator Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Plate Number</p>
                  <p className="text-lg font-bold font-mono text-blue-600">{report.plate_no}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Owner Name</p>
                  <p className="text-base font-semibold text-gray-900">{report.violator_name || 'Unknown'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Vehicle Type</p>
                  <p className="text-base font-semibold text-gray-900">{report.vehicle_type || 'N/A'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Vehicle Model</p>
                  <p className="text-base font-semibold text-gray-900">{report.vehicle_model || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Reporter Details Section */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3">👤 Reporter Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 mb-1">Reporter Name</p>
                  <p className="text-base font-semibold text-gray-900">{report.reporter_full_name || 'N/A'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 mb-1">Reporter ID</p>
                  <p className="text-base font-mono font-bold text-green-600">#{report.reporter_id}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{report.reporter_email || 'N/A'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-green-100">
                  <p className="text-xs text-gray-600 mb-1">Trust Score</p>
                  <p className="text-base font-bold text-green-600">{report.reporter_trust_score || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Violation Type</p>
                <p className="text-lg font-semibold text-gray-900">{report.violation_type || 'N/A'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Location</p>
                <p className="text-sm font-semibold text-gray-900">{report.location_address || 'N/A'}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Report Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {report.date_reported ? new Date(report.date_reported).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            {report.description && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-sm text-gray-900">{report.description}</p>
              </div>
            )}

            {/* Evidence Photos Section */}
            {report.evidence_path && (
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-3">
                  📸 Evidence Photos
                  <span className="ml-2 text-xs font-normal text-blue-600">
                    ({getEvidencePaths(report.evidence_path).length} photo{getEvidencePaths(report.evidence_path).length !== 1 ? 's' : ''})
                  </span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                  {getEvidencePaths(report.evidence_path).map((path, pi) => (
                    <div key={pi} style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => window.open(`http://localhost:5000${path}`, '_blank')}>
                      <img
                        src={`http://localhost:5000${path}`}
                        alt={`Evidence ${pi + 1}`}
                        style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #93c5fd', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.border = '2px solid #3b82f6'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(59,130,246,0.25)' }}
                        onMouseLeave={e => { e.currentTarget.style.border = '2px solid #93c5fd'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)' }}
                      />
                      <span style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px' }}>
                        {pi + 1}/{getEvidencePaths(report.evidence_path).length}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-3 text-center">Click any image to view full size</p>
              </div>
            )}
          </div>
        </div>

        {/* Challan Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <h2 className="text-2xl font-bold text-gray-900">Challan Details</h2>
            <p className="text-sm text-gray-600 mt-1">Fill in violation rule and fine amount</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Violation Rule Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Violation Rule *
              </label>
              <select
                value={selectedRule?.rule_id || ''}
                onChange={(e) => handleRuleChange(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select violation rule</option>
                {rules.map(rule => (
                  <option key={rule.rule_id} value={rule.rule_id}>
                    {rule.rule_name} ({rule.rule_code}) - Rs. {rule.base_fine_amount}
                  </option>
                ))}
              </select>
            </div>

            {/* Fine Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fine Amount (Rs.) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="Enter fine amount"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedRule && (
                <p className="text-xs text-gray-500 mt-1">
                  Standard fine for {selectedRule.rule_name}: Rs. {selectedRule.base_fine_amount}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for this challan..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Challan...' : 'Issue Challan'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/police/review-reports')}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChallanCreation
