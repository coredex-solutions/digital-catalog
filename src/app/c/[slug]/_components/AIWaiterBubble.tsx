"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  MessageSquare, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Brain,
  ChefHat,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIWaiterBubble() {
  const params = useParams();
  const slug = params.slug as string;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Initial greeting
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hello! I'm your Coredex AI Waiter. I'm here to help you choose the perfect meal. How can I assist you today? 😊"
      }]);
    }
  }, [isOpen]);

  const handleSendMessage = async (audioBlob?: Blob) => {
    if (!inputText.trim() && !audioBlob) return;

    const currentText = inputText;
    const currentMessages = [...messages];
    
    // Optimistic UI for text
    if (currentText) {
      setMessages(prev => [...prev, { role: "user", content: currentText }]);
      setInputText("");
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      if (currentText) formData.append("message", currentText);
      if (audioBlob) formData.append("audio", audioBlob);
      formData.append("history", JSON.stringify(currentMessages));

      const res = await fetch(`/api/c/${slug}/ai/waiter/chat`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        
        // If it was voice, add the transcribed text
        if (data.userText && !currentText) {
          setMessages(prev => [...prev, { role: "user", content: data.userText }]);
        }

        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // In a real implementation we would record audio and send the blob
      // For this demo, we'll simulate voice-to-text with browser API
      setIsRecording(false);
      // Logic for actual audio recording would go here
    } else {
      setIsRecording(true);
      // Start recording...
      setTimeout(() => {
        setIsRecording(false);
        // Simulate sending recorded audio
      }, 3000);
    }
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 shadow-[0_0_30px_-5px_rgba(147,51,234,0.5)] flex items-center justify-center z-50 hover:scale-110 active:scale-90 transition-all duration-300 group ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20"></div>
        <Brain className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
      </button>

      {/* Chat Interface */}
      <div className={`fixed inset-0 md:inset-auto md:bottom-24 md:right-8 md:w-[400px] md:h-[600px] z-[60] flex flex-col transition-all duration-500 ease-out origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-[#0a0a0c] md:rounded-t-[2rem] p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center shadow-inner relative">
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0c]"></div>
               <ChefHat className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold leading-none mb-1">Coredex AI Waiter</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Always at your service</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Area */}
        <div 
          ref={scrollRef}
          className="flex-1 bg-[#0a0a0c]/95 backdrop-blur-3xl overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-5 duration-300`}
            >
              <div className={`max-w-[85%] p-4 rounded-3xl ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-tr-none' 
                  : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-none flex gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-[#0a0a0c] md:rounded-b-[2rem] p-6 pt-2 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 px-5 pr-12 focus:outline-none focus:border-purple-500/50 transition-all"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={toggleRecording}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
                  : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
             <div className="flex items-center gap-1.5 opacity-20">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">AI Enhanced Assistant</span>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}
