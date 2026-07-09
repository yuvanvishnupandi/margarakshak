import re

file_path = r'c:\Users\yuvan\OneDrive\Documents\traffic_violation\frontend\src\pages\MyChallans.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

dispute_modal_content = '''      {showDisputeModal && selectedChallan && (
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

            {/* INTERACTIVE CHAT INTERFACE FOR DISPUTES */}
            <div className="mb-6">
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-2">
                AskRakshak Dispute Interviewer <span className="text-red-600">*</span>
              </label>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[280px]">
                <div className="bg-blue-50 p-3 border-b border-gray-200 flex items-center gap-2">
                   <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                   <span className="text-sm font-semibold text-blue-900">AskRakshak AI Interviewer</span>
                </div>
                
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto flex flex-col gap-3">
                   <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm self-start text-sm border border-gray-100 max-w-[85%] text-gray-800">
                      Namaste. I see you are disputing Challan #{selectedChallan.challan_id}. To help me prepare a brief for the reviewing officer, could you please explain why you believe this challan is incorrect?
                   </div>
                   
                   {disputeReason && (
                     <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-br-none shadow-sm self-end text-sm max-w-[85%]">
                        {disputeReason}
                     </div>
                   )}
                   
                   {disputeReason.length > 50 && (
                     <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm self-start text-sm border border-gray-100 max-w-[85%] text-gray-800">
                        Thank you for explaining. I have compiled this into a formal dispute brief. You can now click "Submit Appeal" below to send this directly to the police dashboard.
                     </div>
                   )}
                </div>
                
                <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Type your explanation..."
                     className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     onChange={(e) => setDisputeReason(e.target.value)}
                     onKeyPress={(e) => {
                       if(e.key === 'Enter') {
                         e.preventDefault();
                       }
                     }}
                   />
                   <button 
                     type="button"
                     className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors"
                   >
                     Send
                   </button>
                </div>
              </div>
              
              <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-2">
                {disputeReason.length} / 50 characters minimum for AI summary
              </p>
            </div>

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

            <div className="flex gap-4">
              <button
                onClick={() => setShowDisputeModal(false)}
                style={{ color: 'var(--text-primary)' }} className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 font-semibold rounded-lg transition-colors"
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

      {showReceiptModal && selectedChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div style={{ background: 'var(--bg-card)', maxHeight: '90vh' }} className="rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
            <div className="bg-purple-600'''

pattern = re.compile(r'      \{showDisputeModal && selectedChallan && \(\s*<div className="fixed inset-0 bg-black bg-opacity-50.*?</button>\s*</div>\s*</div>\s*</div>\s*\)\}\s*<div className="bg-purple-600', re.DOTALL)
new_content = pattern.sub(dispute_modal_content, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
