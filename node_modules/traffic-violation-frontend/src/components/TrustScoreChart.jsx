function TrustScoreChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="gov-card p-6 text-center">
        <p className="text-slate-500 text-sm">No trust score history available.</p>
      </div>
    )
  }

  // Get the last 10 entries for display
  const recentHistory = history.slice(0, 10).reverse()
  
  // Find min and max for scaling
  const scores = recentHistory.map(h => h.trust_score)
  const minScore = Math.min(...scores, 0)
  const maxScore = Math.max(...scores, 100)
  const scoreRange = maxScore - minScore || 1

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    if (score >= 30) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getScoreTextColor = (score) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    if (score >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="gov-card p-6">
      <h3 className="text-lg font-bold text-gov-navy uppercase tracking-wide mb-4">Trust Score History</h3>
      
      {/* Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between h-48 gap-2">
          {recentHistory.map((record, index) => {
            const heightPercent = ((record.trust_score - minScore) / scoreRange) * 100
            return (
              <div key={record.history_id} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex justify-center" style={{ height: '160px' }}>
                  <div
                    className={`w-full max-w-12 ${getScoreColor(record.trust_score)} rounded-t transition-all hover:opacity-80`}
                    style={{ 
                      height: `${Math.max(heightPercent, 5)}%`,
                      position: 'absolute',
                      bottom: 0
                    }}
                    title={`Score: ${record.trust_score}`}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {record.trust_score}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-2 truncate w-full text-center">
                  {new Date(record.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span>{maxScore}</span>
          <span>{Math.round((maxScore + minScore) / 2)}</span>
          <span>{minScore}</span>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Trust Score</th>
              <th>Reward Points</th>
              <th>Status</th>
              <th>Change Type</th>
            </tr>
          </thead>
          <tbody>
            {recentHistory.reverse().map((record) => (
              <tr key={record.history_id}>
                <td className="text-xs">
                  {new Date(record.changed_at).toLocaleDateString()}
                </td>
                <td className={`font-bold ${getScoreTextColor(record.trust_score)}`}>
                  {record.trust_score}
                </td>
                <td>{record.reward_points}</td>
                <td>
                  <span className={`text-xs font-semibold ${
                    record.account_status === 'Active' ? 'text-green-600' :
                    record.account_status === 'Suspended' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {record.account_status}
                  </span>
                </td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded ${
                    record.operation_type === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                    record.operation_type === 'INSERT' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.operation_type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TrustScoreChart
