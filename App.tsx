import React, { useState } from 'react';
import { DiscoverView } from './components/DiscoverView';
import { ChatView } from './components/ChatView';
import { Compass, MessageSquare } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'chat'>('discover');

  return (
    <div className="relative h-screen w-screen bg-[#050505] overflow-hidden flex flex-col">
      
      {/* Floating Dock Navigation - Fixed Bottom Center */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-[#0a0a0a] border border-neutral-800 rounded-full shadow-2xl">
          <button
            onClick={() => setActiveTab('discover')}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group ${
              activeTab === 'discover' 
                ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                : 'bg-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <Compass size={20} strokeWidth={2.5} />
          </button>
          
          <div className="w-[1px] h-4 bg-neutral-800 mx-1"></div>

          <button
            onClick={() => setActiveTab('chat')}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group ${
              activeTab === 'chat' 
                ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                : 'bg-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <MessageSquare size={20} strokeWidth={2.5} />
          </button>
      </nav>

      {/* Main Stage */}
      <main className="flex-1 relative w-full h-full">
        {/* View Switcher */}
        <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${activeTab === 'discover' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
           <DiscoverView />
        </div>
        
        <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center ${activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
           <div className="w-full max-w-2xl px-4 h-[85vh]">
             <ChatView />
           </div>
        </div>
      </main>
      
    </div>
  );
};

export default App;