function StatusBadge({ status }) {
  const getStatusStyles = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'overdue':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'waived':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'disputed':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'suspended':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'banned':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status}
    </span>
  )
}

export default StatusBadge
