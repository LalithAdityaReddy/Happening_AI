import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Chat } from '@google/genai';

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello. I am Happening AI. How can I help you discover the city today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
        chatSessionRef.current = createChatSession();
    } catch (e) {
        console.error("Failed to init chat", e);
        setMessages(prev => [...prev, { role: 'model', text: "System Error: Connection failed.", isError: true }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSessionRef.current || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      const responseText = result.text || "No data returned.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Error processing query.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-neutral-800 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Bot size={20} className="text-orange-500" />
            </div>
            <div>
                <h2 className="font-bold text-white text-sm tracking-wide uppercase">Assistant</h2>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <p className="text-[10px] text-neutral-500 font-mono">ONLINE</p>
                </div>
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-[#050505]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[85%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-neutral-800 ${
                  msg.role === 'user' ? 'bg-white text-black' : 'bg-neutral-900 text-white'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-neutral-800 text-white rounded-tr-none' 
                  : msg.isError 
                    ? 'bg-red-900/10 text-red-400 border border-red-900/30' 
                    : 'bg-[#0a0a0a] text-neutral-300 border border-neutral-800 rounded-tl-none'
              }`}>
                 {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} className={msg.role === 'user' ? "font-bold text-white" : "text-white font-semibold"}>{part}</strong> : part)}
                    </p>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
             <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <Bot size={14} className="text-neutral-500" />
                 </div>
                 <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] rounded-xl rounded-tl-none border border-neutral-800">
                     <Loader2 size={14} className="animate-spin text-orange-500" />
                     <span className="text-xs text-neutral-500 font-mono">THINKING...</span>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0a0a0a] border-t border-neutral-800">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            className="w-full pl-6 pr-14 py-4 bg-neutral-900 border border-neutral-800 rounded-full text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 transition-all font-medium"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2.5 rounded-full text-white hover:bg-orange-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};