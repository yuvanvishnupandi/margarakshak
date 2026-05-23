// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://margarakshak-backend.onrender.com'

// Export API endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER_FACE: `${API_BASE_URL}/api/auth/register_face`,
  LOGIN_FACE: `${API_BASE_URL}/api/auth/login_face`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  // Reports
  REPORTS: `${API_BASE_URL}/api/reports`,
  MY_REPORTS: `${API_BASE_URL}/api/reports/my`,
  
  // Police
  PENDING_REPORTS: `${API_BASE_URL}/api/police/pending`,
  VIOLATION_RULES: `${API_BASE_URL}/api/police/rules`,
  VERIFY_REPORT: (id) => `${API_BASE_URL}/api/police/verify/${id}`,
  REJECT_REPORT: (id) => `${API_BASE_URL}/api/police/reject/${id}`,
  
  // Challans
  MY_CHALLANS: `${API_BASE_URL}/api/challans/my`,
  PAY_CHALLAN: `${API_BASE_URL}/api/challans/pay`,
  CHALLAN_HISTORY: (id) => `${API_BASE_URL}/api/challans/history/${id}`,
  
  // Trust
  TRUST_HISTORY: (id) => `${API_BASE_URL}/api/trust/history/${id}`,
  FLAG_OVERDUE: `${API_BASE_URL}/api/trust/flag-overdue`,
}

export default API_BASE_URL
