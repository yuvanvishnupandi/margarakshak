import { useState } from 'react'

function PaymentModal({ challan, onClose, onPay }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!challan) return null

  const handlePay = async () => {
    setLoading(true)
    setError('')
    
    try {
      await onPay(challan.challan_id)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md border-2 border-gov-navy shadow-xl">
        <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wide">Payment Portal</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-gov-success mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gov-success mb-2">Payment Successful</h3>
              <p className="text-slate-600 text-sm">Challan #{challan.challan_id} has been paid.</p>
              <button onClick={onClose} className="gov-btn-primary mt-6">Close</button>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Challan ID</span>
                  <span className="text-sm font-bold">#{challan.challan_id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Violation</span>
                  <span className="text-sm font-semibold">{challan.violation_description || challan.rule_code}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Issued Date</span>
                  <span className="text-sm">{new Date(challan.issued_at).toLocaleDateString()}</span>
                </div>
                <div className="border-t border-slate-300 mt-3 pt-3 flex justify-between">
                  <span className="text-base font-bold text-slate-800">Total Amount</span>
                  <span className="text-xl font-bold text-gov-navy">Rs. {challan.amount}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-300 text-gov-danger px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 border-2 border-slate-300 text-slate-600 font-semibold px-4 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="flex-1 gov-btn-success disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-4">
                Secured by Government Payment Gateway. This transaction uses row-level database locking.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
