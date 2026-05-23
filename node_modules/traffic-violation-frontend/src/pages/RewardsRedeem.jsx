import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { Card, Button } from '../components/ui/BaseComponents'

const API_BASE_URL = 'http://localhost:5000'

function RewardsRedeem() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState({
    trust_score: 0,
    reward_points: 0,
    wallet_balance: 0,
    total_reports: 0,
    verified_reports: 0
  })
  const [redeemHistory, setRedeemHistory] = useState([])
  const [pointsToRedeem, setPointsToRedeem] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || 'null')

    if (!user || !token) {
      setLoading(false)
      return
    }

    // Fetch profile — independent, never throws
    let profile = {}
    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (profileRes.ok) profile = await profileRes.json()
    } catch (e) {
      console.warn('Profile fetch failed:', e.message)
    }

    // Fetch reports — independent, never throws
    let reports = []
    try {
      const reportsRes = await fetch(`${API_BASE_URL}/api/reports/my-reports/${user.id}`)
      if (reportsRes.ok) {
        const rd = await reportsRes.json()
        reports = rd.reports || []
      }
    } catch (e) {
      console.warn('Reports fetch failed:', e.message)
    }

    // Fetch wallet — optional
    let walletData = null
    try {
      const walletRes = await fetch(`${API_BASE_URL}/api/citizen/rewards/wallet/${user.id}`)
      if (walletRes.ok) walletData = await walletRes.json()
    } catch (e) {
      console.warn('Wallet API not available:', e.message)
    }

    const verifiedReports = reports.filter(
      r => r.status === 'Verified' || r.status === 'Challan Issued'
    ).length

    setUserData({
      trust_score: profile.trust_score ?? 0,
      reward_points: profile.reward_points ?? 0,
      wallet_balance: walletData?.wallet_balance ?? 0,
      total_reports: reports.length,
      verified_reports: verifiedReports
    })

    if (walletData) setRedeemHistory(walletData.redemption_history || [])
    setLoading(false)
  }

  // Calculate available rewards based on user achievements
  const calculateRewards = () => {
    const rewards = []
    const { trust_score, reward_points, verified_reports } = userData

    // Reward 1: 5 Verified Reports
    if (verified_reports >= 5) {
      rewards.push({
        id: 1,
        title: 'Road Safety Champion',
        description: '5 reports successfully verified',
        points: 50,
        icon: '🏆',
        color: 'from-yellow-400 to-orange-500',
        claimed: reward_points >= 50,
        requirement: '5 verified reports',
        progress: Math.min(verified_reports / 5 * 100, 100)
      })
    }

    // Reward 2: Trust Score 70+
    if (trust_score >= 70) {
      rewards.push({
        id: 2,
        title: 'Trusted Citizen',
        description: 'Maintain trust score above 70',
        points: 100,
        icon: '⭐',
        color: 'from-green-400 to-emerald-500',
        claimed: reward_points >= 100,
        requirement: 'Trust score 70+',
        progress: Math.min(trust_score / 70 * 100, 100)
      })
    }

    // Reward 3: 10 Verified Reports
    if (verified_reports >= 10) {
      rewards.push({
        id: 3,
        title: 'Community Guardian',
        description: '10 reports successfully verified',
        points: 150,
        icon: '🛡️',
        color: 'from-blue-400 to-indigo-500',
        claimed: reward_points >= 150,
        requirement: '10 verified reports',
        progress: Math.min(verified_reports / 10 * 100, 100)
      })
    }

    // Reward 4: Trust Score 90+
    if (trust_score >= 90) {
      rewards.push({
        id: 4,
        title: 'Excellence Award',
        description: 'Achieve trust score above 90',
        points: 250,
        icon: '💎',
        color: 'from-purple-400 to-pink-500',
        claimed: reward_points >= 250,
        requirement: 'Trust score 90+',
        progress: Math.min(trust_score / 90 * 100, 100)
      })
    }

    // Reward 5: 25 Verified Reports
    if (verified_reports >= 25) {
      rewards.push({
        id: 5,
        title: 'Elite Reporter',
        description: '25 reports successfully verified',
        points: 500,
        icon: '👑',
        color: 'from-red-400 to-rose-500',
        claimed: reward_points >= 500,
        requirement: '25 verified reports',
        progress: Math.min(verified_reports / 25 * 100, 100)
      })
    }

    // Reward 6: Perfect Trust Score 100
    if (trust_score >= 100) {
      rewards.push({
        id: 6,
        title: 'Legend Status',
        description: 'Achieve perfect trust score of 100',
        points: 1000,
        icon: '🌟',
        color: 'from-amber-400 to-yellow-500',
        claimed: reward_points >= 1000,
        requirement: 'Trust score 100',
        progress: 100
      })
    }

    return rewards
  }

  const availableRewards = calculateRewards()

  const handleRedeem = async (reward) => {
    if (reward.claimed) { showError('You have already claimed this reward!'); return }
    if (userData.reward_points < reward.points) { showError(`You need ${reward.points} points to claim this reward`); return }

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const res = await fetch(`${API_BASE_URL}/api/citizen/rewards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_id: user.id, points_to_redeem: reward.points })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to redeem reward')
      success(`Successfully redeemed: ${reward.title}! ${data.wallet_amount ? `Rs. ${data.wallet_amount} added to wallet.` : ''}`)
      fetchUserData()
    } catch (err) { showError(err.message) }
  }

  const handlePointsToWallet = async () => {
    const points = parseInt(pointsToRedeem)
    
    if (!points || points <= 0) {
      showError('Please enter valid points')
      return
    }

    if (points % 10 !== 0) {
      showError('Points must be in multiples of 10')
      return
    }

    if (points > userData.reward_points) {
      showError('Insufficient reward points')
      return
    }

    setRedeeming(true)
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      
      const res = await fetch(`${API_BASE_URL}/api/citizen/rewards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_id: user.id,
          points_to_redeem: points
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to redeem points')
      }

      const result = await res.json()
      success(result.message)
      setPointsToRedeem('')
      fetchUserData() // Refresh data
    } catch (err) {
      showError(err.message)
    } finally {
      setRedeeming(false)
    }
  }

  const calculateWalletAmount = (points) => {
    return (points / 10) * 50
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-4">Loading rewards...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'144px', paddingBottom:'32px', paddingLeft:'16px', paddingRight:'16px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px 64px' }}>
        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-5xl font-bold  mb-2">
            Rewards & Redeem
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg">Earn rewards for your contributions to road safety</p>
        </div>

        {/* Stats Overview — Trust Score removed */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Reward Points</p>
                <p className="text-4xl font-bold mt-2 text-white">{userData.reward_points}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)' }} className="w-16 h-16 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Wallet Balance</p>
                <p className="text-4xl font-bold mt-2 text-white">Rs. {userData.wallet_balance.toFixed(2)}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)' }} className="w-16 h-16 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1zm5 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Reports</p>
                <p className="text-4xl font-bold mt-2">{userData.total_reports}</p>
              </div>
              <div style={{ background: 'var(--bg-card)' }} className="w-16 h-16 /10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Verified Reports</p>
                <p className="text-4xl font-bold mt-2">{userData.verified_reports}</p>
              </div>
              <div style={{ background: 'var(--bg-card)' }} className="w-16 h-16 /10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Wallet Redemption Section */}
        <Card style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="p-8 mb-8 border-2 shadow-xl">
          <div className="mb-6">
            <h2 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold mb-2">Convert Points to Wallet</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="">Redeem your reward points to wallet balance for challan payments</p>
          </div>

          <div style={{ background: 'var(--bg-card)' }} className="rounded-xl p-6 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold  mb-2">
                  Points to Redeem
                </label>
                <input
                  type="number"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  placeholder="Enter points (multiples of 10)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="10"
                  step="10"
                />
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs  mt-1">
                  Available: {userData.reward_points} points
                </p>
              </div>

              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold  mb-2">
                  Wallet Amount (Rs.)
                </label>
                <div style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }} className="w-full px-4 py-3 border rounded-lg">
                  <p className="text-2xl font-bold text-green-500">
                    Rs. {pointsToRedeem ? calculateWalletAmount(parseInt(pointsToRedeem)).toFixed(2) : '0.00'}
                  </p>
                </div>
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs  mt-1">
                  Conversion: 10 points = Rs. 50
                </p>
              </div>
            </div>

            <button
              onClick={handlePointsToWallet}
              disabled={redeeming || !pointsToRedeem || parseInt(pointsToRedeem) > userData.reward_points}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {redeeming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                'Convert Points to Wallet'
              )}
            </button>
          </div>
        </Card>

        {/* Available Rewards */}
        <div className="mb-8">
          <h2 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold  mb-6">Available Rewards</h2>
          
          {availableRewards.length === 0 ? (
            <Card className="p-12 text-center">
              <div style={{ background: 'var(--bg-secondary)' }} className="w-24 h-24  rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold  mb-2">Keep Reporting!</h3>
              <p style={{ color: 'var(--text-secondary)' }} className="">Submit more reports and maintain a high trust score to unlock rewards</p>
              <Button 
                onClick={() => navigate('/submit-report')}
                className="mt-6 bg-slate-900 hover:bg-slate-800"
              >
                Submit a Report
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRewards.map((reward) => (
                <Card key={reward.id} style={{ borderColor: 'var(--border)' }} className="overflow-hidden hover:shadow-xl transition-all duration-300 border">
                  <div className={`bg-gradient-to-r ${reward.color} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <div style={{ background: 'rgba(255,255,255,0.1)' }} className="w-16 h-16 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {reward.claimed && (
                        <div style={{ background: 'rgba(255,255,255,0.2)' }} className="backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-white">
                          Claimed
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{reward.title}</h3>
                    <p className="text-sm opacity-90">{reward.description}</p>
                  </div>
                  
                  <div style={{ background: 'var(--bg-card)' }} className="p-6">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span style={{ color: 'var(--text-secondary)' }} className="">Progress</span>
                        <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{Math.round(reward.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${reward.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${reward.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Requirement</p>
                        <p style={{ color: 'var(--text-primary)' }} className="font-semibold">{reward.requirement}</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Points</p>
                        <p className="text-2xl font-bold text-blue-600">{reward.points}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleRedeem(reward)}
                      disabled={reward.claimed || userData.reward_points < reward.points}
                      fullWidth
                      className={`
                        ${reward.claimed 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : userData.reward_points < reward.points
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800'
                        }
                        text-white font-semibold py-3
                      `}
                    >
                      {reward.claimed ? 'Already Claimed' : userData.reward_points < reward.points ? 'Not Enough Points' : 'Redeem Now'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon Section */}
        <Card style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }} className="p-8 border-2 shadow-lg mb-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold  mb-2">Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-lg mb-6">Exciting new rewards and redemption options are on the way</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="p-6 rounded-xl shadow-md border">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h4 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold  mb-2">Gift Cards</h4>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Redeem points for Amazon, Flipkart vouchers</p>
              </div>
              
              <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="p-6 rounded-xl shadow-md border">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.421 3.421 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h4 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold  mb-2">Leaderboard Badges</h4>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Exclusive badges for top reporters</p>
              </div>
              
              <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} className="p-6 rounded-xl shadow-md border">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold  mb-2">Premium Features</h4>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Unlock advanced analytics and features</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default RewardsRedeem
