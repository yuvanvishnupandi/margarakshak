import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send } from 'lucide-react';
import { AI_BASE_URL } from '../config';

export default function AskRakshak({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Initial welcome message based on context
    const initialMessage = user?.role === 'police' 
      ? "Namaste Officer! I am AskRakshak. How can I assist you with enforcement today?"
      : "Namaste! I am AskRakshak, your AI assistant. How can I help you today?";
      
    if (messages.length === 0) {
        setMessages([{ role: 'assistant', content: initialMessage }]);
    }
  }, [user]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${AI_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          mode: user?.role || 'citizen',
          current_path: location.pathname,
          user_id: user?.id ? String(user.id) : null
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I am having trouble connecting to the AI server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-96 h-[550px] flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <MessageSquare size={24} />
              <h3 className="font-bold text-lg">AskRakshak</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Chat Window */}
          <div className="flex-1 p-5 overflow-y-auto bg-gray-50 flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[85%] rounded-2xl p-4 text-base leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white self-end rounded-br-none' 
                : 'bg-white text-gray-800 self-start rounded-bl-none shadow-md border border-gray-100'
              }`}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white text-gray-500 self-start rounded-2xl rounded-bl-none p-4 shadow-md border border-gray-100 max-w-[85%] font-medium italic text-base">
                AskRakshak is thinking...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 flex gap-3 items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 text-base bg-gray-100 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send size={20} className="ml-0.5" />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center animate-bounce"
        >
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
}
