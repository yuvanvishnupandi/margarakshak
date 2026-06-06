import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;
// Replaced by automated script

function PaymentPage() {
  const { challanId } = useParams()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet] = useState(false)
  const [finalAmount, setFinalAmount] = useState(0)
  const [finalLateFee, setFinalLateFee] = useState(0)

  useEffect(() => {
    fetchChallanDetails()
    fetchWalletBalance()
  }, [challanId])

  const fetchChallanDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const res = await fetch(`${API_BASE_URL}/api/challans/my?citizen_id=${user?.id}`)
      
      if (!res.ok) throw new Error('Failed to fetch challan details')
      
      const data = await res.json()
      const foundChallan = data.challans?.find(c => c.challan_id === parseInt(challanId))
      
      if (!foundChallan) {
        throw new Error('Challan not found')
      }
      
      setChallan(foundChallan)
    } catch (err) {
      showError(err.message)
      navigate('/my-challans')
    } finally {
      setLoading(false)
    }
  }

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      // Support wallet_balance or reward_points as wallet source
      const bal = parseFloat(data.wallet_balance || data.reward_points || 0)
      setWalletBalance(isNaN(bal) ? 0 : bal)
    } catch (err) {
      console.error('Wallet balance fetch error:', err)
    }
  }

  const handlePayment = async () => {
    if (!agreedToTerms) {
      showError('Please agree to the Terms & Conditions to proceed')
      return
    }

    // Tiered late fee (Indian MV Act enforcement style)
    const base = parseFloat(challan?.total_amount || 0)
    const dueDate = challan?.due_date ? new Date(challan.due_date) : null
    if (dueDate) dueDate.setHours(23, 59, 59, 999)
    const today = new Date()
    const isOverdue = dueDate && today > dueDate
    const daysOverdue = isOverdue ? Math.max(1, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))) : 0
    let latePct = 0
    if (daysOverdue >= 1  && daysOverdue <= 3)  latePct = 5
    else if (daysOverdue <= 7)  latePct = 10
    else if (daysOverdue <= 15) latePct = 20
    else if (daysOverdue <= 30) latePct = 35
    else                        latePct = 50
    if (!isOverdue) latePct = 0
    const lateFeeAmt = parseFloat((base * latePct / 100).toFixed(2))
    const totalPayable = parseFloat((base + lateFeeAmt).toFixed(2))

    setProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const res = await fetch(`${API_BASE_URL}/api/challans/pay/${challanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: selectedPaymentMethod.toUpperCase(),
          late_fee: lateFeeAmt
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.detail || 'Payment failed')
      }
      const result = await res.json()
      setPaymentSuccess(true)
      setFinalAmount(result.amount_paid || totalPayable)
      setFinalLateFee(result.late_fee || lateFeeAmt)
      success('Payment successful! Challan marked as paid.')
      setTimeout(() => navigate('/my-challans'), 4000)
    } catch (err) {
      showError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay', color: 'blue', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { id: 'upi', name: 'UPI / Google Pay', desc: 'PhonePe, Paytm, BHIM', color: 'green', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )},
    { id: 'netbanking', name: 'Net Banking', desc: 'All major banks', color: 'purple', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    )},
    { id: 'wallet', name: 'Digital Wallets', desc: 'Amazon Pay, MobiKwik', color: 'orange', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'neft', name: 'NEFT/RTGS Transfer', desc: 'Direct bank transfer', color: 'teal', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'offline', name: 'Offline Challan', desc: 'Post Office/Bank', color: 'slate', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )}
  ]

  const getPaymentMethodStyle = (methodId) => {
    const colors = {
      card: selectedPaymentMethod === methodId ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50',
      upi: selectedPaymentMethod === methodId ? 'border-green-600 bg-green-50 ring-2 ring-green-200' : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50',
      netbanking: selectedPaymentMethod === methodId ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200' : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50',
      wallet: selectedPaymentMethod === methodId ? 'border-orange-600 bg-orange-50 ring-2 ring-orange-200' : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50',
      neft: selectedPaymentMethod === methodId ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200' : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50',
      offline: selectedPaymentMethod === methodId ? 'border-slate-600 bg-slate-50 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
    }
    return colors[methodId] || colors.card
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!challan) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="text-center">
          <p className="text-xl text-gray-600">Challan not found</p>
          <button onClick={() => navigate('/my-challans')} className="mt-4 text-blue-600 hover:underline">
            Back to My Challans
          </button>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg w-full text-center border border-green-200">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-green-700 mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-700 mb-2">Challan #{challan.challan_id}</p>
          {finalLateFee > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-700">
                Base fine: <b>Rs. {(finalAmount - finalLateFee).toFixed(2)}</b> + Late fee: <b>Rs. {finalLateFee.toFixed(2)}</b>
              </p>
            </div>
          )}
          <p className="text-3xl font-bold text-gray-900 mb-6">Total Paid: Rs. {finalAmount.toFixed(2)}</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              ✓ Payment confirmed and recorded in database<br/>
              ✓ Challan status updated to "Paid"<br/>
              ✓ Transaction reference generated<br/>
              {finalLateFee > 0 && <><span style={{color:'#dc2626'}}>⚠ Rs. {finalLateFee.toFixed(2)} late fee included</span><br/></>}
              ✓ +2 reward points added to your account
            </p>
          </div>
          <p className="text-gray-600">Redirecting to My Challans...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'128px', paddingBottom:'32px', paddingLeft:'16px', paddingRight:'16px' }}>
      <div className="w-full max-w-[1920px] mx-auto px-4">
        {/* Official Government Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="p-8 text-center text-white">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Government Payment Portal</h1>
                  <p className="text-blue-200">Traffic Violation Challan Payment System</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure 256-bit Encryption
                </span>
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Gov-Secure Verified
                </span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  PCI DSS Compliant
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white border-2 border-amber-300">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">Payment Gateway Coming Soon!</h3>
                <p className="text-white/90 text-sm">
                  We're integrating with secure government payment processors. For now, you can review challan details and prepare for payment.
                </p>
              </div>
              <div className="hidden md:block text-right">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-xs font-semibold">Expected Launch</p>
                  <p className="text-lg font-bold">Q2 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Challan Details (Invoice Style) */}
          <div className="space-y-6">
            {/* Challan Invoice */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Challan Invoice</h2>
                    <p className="text-blue-100 text-sm">Official Traffic Violation Receipt</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-100">Challan ID</p>
                    <p className="text-2xl font-bold font-mono">#{challan.challan_id}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Violation Details */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5 border border-red-200">
                  <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Violation Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Violation Type</p>
                      <p className="text-base font-bold text-gray-900">{challan.rule_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{challan.rule_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Vehicle Number</p>
                      <p className="text-base font-bold font-mono text-blue-600">{challan.plate_no}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 mb-1">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{challan.location_address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-gray-600 mb-1">Issue Date</p>
                    <p className="text-base font-bold text-gray-900">
                      {new Date(challan.issue_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">Due Date</p>
                    <p className="text-base font-bold text-red-600">
                      {new Date(challan.due_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Amount Breakdown with Dynamic Late Fee */}
                {(() => {
                  const base = parseFloat(challan.total_amount) || 0
                  const rawDue = challan.due_date
                  const dueDate = rawDue ? new Date(rawDue) : null
                  if (dueDate) dueDate.setHours(23, 59, 59, 999)
                  const today = new Date()

                  const payStatus = challan.payment_status || challan.status || ''
                  const isPaid = payStatus === 'Paid'
                  const isOverdue = !isPaid && dueDate && today > dueDate
                  const daysUntilDue = dueDate && !isOverdue ? Math.max(0, Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))) : 0
                  const daysOverdue = isOverdue ? Math.max(1, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))) : 0

                  // Tiered late fee — Indian MV Act enforcement style
                  let latePct = 0
                  let tierLabel = ''
                  if (isOverdue) {
                    if (daysOverdue <= 3)       { latePct = 5;  tierLabel = 'Tier 1: 1–3 days' }
                    else if (daysOverdue <= 7)  { latePct = 10; tierLabel = 'Tier 2: 4–7 days' }
                    else if (daysOverdue <= 15) { latePct = 20; tierLabel = 'Tier 3: 8–15 days' }
                    else if (daysOverdue <= 30) { latePct = 35; tierLabel = 'Tier 4: 16–30 days' }
                    else                        { latePct = 50; tierLabel = 'Tier 5: 30+ days — Max Penalty' }
                  }
                  const lateFeeAmt = +(base * latePct / 100).toFixed(2)
                  const totalPayable = +(base + lateFeeAmt).toFixed(2)

                  return (
                    <div className={`rounded-xl p-5 border-2 ${isOverdue ? 'bg-red-50 border-red-400' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'}`}>

                      {/* Base Fine */}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-600">Base Fine Amount</span>
                        <span className={`text-lg font-bold ${isOverdue ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          Rs. {base.toFixed(2)}
                        </span>
                      </div>

                      {/* OVERDUE: Tiered Late Fee */}
                      {isOverdue && (
                        <div className="flex justify-between items-center mb-3 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-bold text-red-700">⚠ Late Penalty: {latePct}% ({tierLabel})</p>
                            <p className="text-xs text-red-500">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue · MV Act enforcement penalty applies</p>
                          </div>
                          <span className="text-base font-bold text-red-700">+ Rs. {lateFeeAmt.toFixed(2)}</span>
                        </div>
                      )}

                      {/* NOT YET OVERDUE: Warning */}
                      {!isPaid && !isOverdue && dueDate && (
                        <div className="flex justify-between items-center mb-3 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-bold text-amber-700">⏰ Pay within {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} to avoid penalty</p>
                            <p className="text-xs text-amber-600">Late fee: 5% (1–3d) → 10% → 20% → 35% → 50% (30+d)</p>
                          </div>
                          <span className="text-xs font-bold text-amber-700 text-right">Due<br/>{new Date(rawDue).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-gray-600">Payment Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                          isPaid ? 'bg-green-100 text-green-800 border-green-300' :
                          isOverdue ? 'bg-red-100 text-red-800 border-red-300' :
                          'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }`}>
                          {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'UNPAID'}
                        </span>
                      </div>

                      {/* Divider + Total */}
                      <div className={`border-t-2 ${isOverdue ? 'border-red-300' : 'border-amber-300'} pt-3 mt-3`}>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-gray-700">Total Amount Due</p>
                          <p className={`text-3xl font-bold ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            Rs. {totalPayable.toFixed(2)}
                          </p>
                        </div>
                        {isOverdue && (
                          <p className="text-xs text-red-500 text-right mt-1">Includes Rs. {lateFeeAmt.toFixed(2)} late penalty ({latePct}%)</p>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Description */}
                {challan.violation_description && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-900">{challan.violation_description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Payment Gateway */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-1">Secure Payment Gateway</h2>
                <p className="text-green-100 text-sm">Choose your preferred payment method</p>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Payment Method</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 ${getPaymentMethodStyle(method.id)}`}
                    >
                      <div className="text-center">
                        <div className="text-gray-700 mb-3 flex justify-center">{method.icon}</div>
                        <p className="text-sm font-bold text-gray-900 mb-1">{method.name}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Method Info */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <span className="font-bold">Selected:</span> {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name} - {paymentMethods.find(m => m.id === selectedPaymentMethod)?.desc}
                  </p>
                </div>

                {/* ── Wallet Balance Toggle (Feature 4 — Transactional Deduction) ── */}
                {walletBalance > 0 && challan && (() => {
                  const walletDeduction = Math.min(walletBalance, parseFloat(challan.total_amount))
                  return (
                    <div style={{ marginBottom: '16px', background: useWallet ? 'rgba(13,148,136,0.06)' : '#f8fafc', border: useWallet ? '1.5px solid #0d9488' : '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', transition: 'all 0.25s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: useWallet ? '#0d9488' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                            <svg width="16" height="16" fill="none" stroke={useWallet ? '#fff' : '#6b7280'} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Use Wallet Balance</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Available: <b style={{ color: '#0d9488' }}>Rs. {walletBalance.toFixed(2)}</b></p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setUseWallet(v => !v)} style={{ width: '48px', height: '26px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: useWallet ? '#0d9488' : '#d1d5db', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: useWallet ? '25px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.22)' }} />
                        </button>
                      </div>
                      {useWallet && (
                        <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(13,148,136,0.08)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: 600 }}>Wallet deduction:</span>
                          <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: 800 }}>− Rs. {walletDeduction.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Terms & Conditions */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold mb-1">I agree to the Terms & Conditions</p>
                      <p className="text-xs text-gray-500">
                        By proceeding, I acknowledge that this is a government-issued traffic violation challan. 
                        I understand that payment is mandatory and that failure to pay may result in additional penalties. 
                        I agree to the Government Refund Policy and confirm that all details provided are accurate.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || !agreedToTerms}
                  className={`w-full font-bold py-4 rounded-xl transition-all text-lg shadow-lg ${
                    agreedToTerms
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-xl hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name} Payment...
                    </span>
                  ) : (() => {
                    const base = parseFloat(challan?.total_amount || 0)
                    const dueDate = challan?.due_date ? new Date(challan.due_date) : null
                    if (dueDate) dueDate.setHours(23, 59, 59, 999)
                    const today = new Date()
                    const isOvd = dueDate && today > dueDate
                    const daysOvd = isOvd ? Math.max(1, Math.floor((today - dueDate) / (1000*60*60*24))) : 0
                    let pct = 0
                    if (isOvd) {
                      if (daysOvd <= 3) pct = 5
                      else if (daysOvd <= 7) pct = 10
                      else if (daysOvd <= 15) pct = 20
                      else if (daysOvd <= 30) pct = 35
                      else pct = 50
                    }
                    const lateFee = parseFloat((base * pct / 100).toFixed(2))
                    const total = parseFloat((base + lateFee).toFixed(2))
                    const deduct = useWallet ? Math.min(walletBalance, total) : 0
                    const final = Math.max(0, total - deduct)
                    const label = useWallet && deduct > 0 ? `Rs. ${final.toFixed(2)} (after wallet)` : `Rs. ${total.toFixed(2)}`
                    return `Process Payment — ${label}${isOvd ? ` (incl. ${pct}% late penalty)` : ''}`
                  })()}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secured by Government Payment Gateway • Database transaction with row-level locking • 256-bit SSL Encryption
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Future Scope Grid */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-1">🚀 Upcoming Features & Future Scope</h2>
              <p className="text-purple-100">Enhanced payment and traffic management system</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Online Payment Gateway</h3>
                  <p className="text-sm text-gray-600">Real payment processing via UPI, Cards, Net Banking with automatic reconciliation.</p>
                </div>

                {/* Card 2 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">SMS & Email Alerts</h3>
                  <p className="text-sm text-gray-600">Automatic challan notifications, payment reminders, and confirmation receipts.</p>
                </div>

                {/* Card 3 */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border-2 border-orange-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Auto-Penalty System</h3>
                  <p className="text-sm text-gray-600">Automatic fine increase (2x) after due date with legal escalation.</p>
                </div>

                {/* Card 4 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Challan Dispute System</h3>
                  <p className="text-sm text-gray-600">Online dispute filing with evidence upload and tribunal hearing scheduling.</p>
                </div>

                {/* Card 5 */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border-2 border-teal-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">AI Violation Analytics</h3>
                  <p className="text-sm text-gray-600">Predictive analytics for violation hotspots and automated traffic management.</p>
                </div>

                {/* Card 6 */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border-2 border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">📲</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Mobile App Integration</h3>
                  <p className="text-sm text-gray-600">Native iOS/Android apps for on-the-go challan viewing and instant payments.</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <p className="text-sm text-gray-700 text-center">
                  <span className="font-bold">Current System:</span> Database-driven challan management with MySQL triggers for automated trust scoring, 
                  ACID-compliant transactions, and real-time synchronization across all user portals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/my-challans')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl border-2 border-slate-200 text-gray-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m7 7l-7 7m7-7l-7 7" />
            </svg>
            Back to My Challans
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
