/**
 * Custom Logo Component - Traffic Light + CCTV Camera
 * Used in Navbar and other layout headers
 */
export default function Logo({ className = "h-8 w-auto" }) {
  return (
    <svg className={className} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Traffic Light Pole */}
      <rect x="15" y="10" width="20" height="60" rx="4" fill="#374151" />
      
      {/* Red Circle */}
      <circle cx="25" cy="22" r="6" fill="#EF4444" />
      
      {/* Yellow Circle */}
      <circle cx="25" cy="40" r="6" fill="#F59E0B" />
      
      {/* Green Circle */}
      <circle cx="25" cy="58" r="6" fill="#10B981" />
      
      {/* CCTV Camera Body */}
      <rect x="50" y="25" width="35" height="20" rx="3" fill="#1F2937" />
      
      {/* Camera Lens Outer */}
      <circle cx="80" cy="35" r="8" fill="#374151" />
      
      {/* Camera Lens Inner */}
      <circle cx="80" cy="35" r="4" fill="#6B7280" />
      
      {/* Camera Mount Arm */}
      <rect x="35" y="32" width="15" height="6" fill="#4B5563" />
    </svg>
  )
}
