
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
export const AI_BASE_URL = import.meta.env.VITE_AI_URL || API_BASE_URL

export const API_ENDPOINTS = {
  
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER_FACE: `${API_BASE_URL}/api/auth/register_face`,
  LOGIN_FACE: `${API_BASE_URL}/api/auth/login_face`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  REPORTS: `${API_BASE_URL}/api/reports`,
  MY_REPORTS: `${API_BASE_URL}/api/reports/my`,
  
  PENDING_REPORTS: `${API_BASE_URL}/api/police/pending`,
  VIOLATION_RULES: `${API_BASE_URL}/api/police/rules`,
  VERIFY_REPORT: (id) => `${API_BASE_URL}/api/police/verify/${id}`,
  REJECT_REPORT: (id) => `${API_BASE_URL}/api/police/reject/${id}`,
  
  MY_CHALLANS: `${API_BASE_URL}/api/challans/my`,
  PAY_CHALLAN: `${API_BASE_URL}/api/challans/pay`,
  CHALLAN_HISTORY: (id) => `${API_BASE_URL}/api/challans/history/${id}`,
  
  TRUST_HISTORY: (id) => `${API_BASE_URL}/api/trust/history/${id}`,
  FLAG_OVERDUE: `${API_BASE_URL}/api/trust/flag-overdue`,
}

export default API_BASE_URL
