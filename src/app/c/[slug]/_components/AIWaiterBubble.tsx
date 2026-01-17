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
  Loader2,
  Globe
} from "lucide-react";
import { useCatalog } from "../_providers/CatalogProvider";
import { Language } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Translations for the AI Waiter popup
const translations = {
  en: {
    title: "Coredex AI Waiter",
    subtitle: "Always at your service",
    placeholder: "Ask me anything...",
    noMicTitle: "No microphone detected",
    voiceInputTitle: "Voice input",
    branding: "Coredex Digital Intelligence",
    greeting: "Hello! I'm your Coredex AI Waiter. I'm here to help you choose the perfect meal. How can I assist you today? 😊",
    noMicAlert: "No microphone detected on your device.",
    noSpeechAlert: "Voice recognition is not supported in your browser.",
    noHttpsAlert: "Voice features require a secure connection (HTTPS). Please use HTTPS to enable the microphone.",
  },
  ar: {
    title: "نادل كورديكس الذكي",
    subtitle: "دائماً في خدمتك",
    placeholder: "اسألني أي شيء...",
    noMicTitle: "لم يتم اكتشاف ميكروفون",
    voiceInputTitle: "الإدخال الصوتي",
    branding: "كورديكس للذكاء الرقمي",
    greeting: "مرحباً! أنا نادل كورديكس الذكي. أنا هنا لمساعدتك في اختيار الوجبة المثالية. كيف يمكنني مساعدتك اليوم؟ 😊",
    noMicAlert: "لم يتم اكتشاف ميكروفون على جهازك.",
    noSpeechAlert: "التعرف على الصوت غير مدعوم في متصفحك.",
    noHttpsAlert: "ميزات الصوت تتطلب اتصالاً آمناً (HTTPS). يرجى استخدام HTTPS لتفعيل الميكروفون.",
  },
  fr: {
    title: "Serveur IA Coredex",
    subtitle: "Toujours à votre service",
    placeholder: "Demandez-moi n'importe quoi...",
    noMicTitle: "Aucun microphone détecté",
    voiceInputTitle: "Entrée vocale",
    branding: "Coredex Intelligence Numérique",
    greeting: "Bonjour! Je suis votre serveur IA Coredex. Je suis là pour vous aider à choisir le repas parfait. Comment puis-je vous aider aujourd'hui? 😊",
    noMicAlert: "Aucun microphone détecté sur votre appareil.",
    noSpeechAlert: "La reconnaissance vocale n'est pas prise en charge par votre navigateur.",
    noHttpsAlert: "Les fonctions vocales nécessitent une connexion sécurisée (HTTPS). Veuillez utiliser HTTPS pour activer le microphone.",
  },
};

export default function AIWaiterBubble() {
  const params = useParams();
  const slug = params.slug as string;
  const {
    lang: catalogLang,
    colorPrimary,
    addToCart,
    updateQuantity,
    removeFromCart,
    setIsCartOpen,
    menuItems,
    cart
  } = useCatalog();

  // Get translations for current language
  const t = translations[catalogLang as keyof typeof translations] || translations.en;
  const isRTL = catalogLang === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [activeVoiceLang, setActiveVoiceLang] = useState<string>("en-US");

  useEffect(() => {
    if (catalogLang === "ar") setActiveVoiceLang("ar-SA");
    else if (catalogLang === "fr") setActiveVoiceLang("fr-FR");
    else setActiveVoiceLang("en-US");
  }, [catalogLang]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecureContext(window.isSecureContext);

      // Check for microphone hardware availability
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            const mics = devices.filter(d => d.kind === 'audioinput');
            // Only set to false if we explicitly see devices but none are mics
            if (devices.length > 0 && mics.length === 0) {
              setHasMicrophone(false);
            }
          })
          .catch(() => {
            // If enumeration fails, we stay optimistic to allow permission prompt
            setHasMicrophone(true);
          });
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join("");

          setInputText(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          // Ignore common non-error scenarios
          if (event.error === "no-speech" || event.error === "aborted") {
            setIsRecording(false);
            return;
          }

          // Handle permission denied or no microphone gracefully (don't log to console)
          if (event.error === "not-allowed") {
            // Silent fail - user likely has no microphone or denied permission
            // The UI will show the mic button is non-functional
          }
          setIsRecording(false);
        };
      }

      // Load speech synthesis voices (they load async)
      if (window.speechSynthesis) {
        // Chrome needs this event listener
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices(); // Trigger voice loading
        };
        // Try to get voices immediately (works in Firefox/Safari)
        window.speechSynthesis.getVoices();
      }
      // Load speech synthesis voices
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
        window.speechSynthesis.getVoices();
      }
    }
  }, []);

  // Stop talking immediately when muted
  useEffect(() => {
    if (isMuted && isSpeaking) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
    }
  }, [isMuted]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Initial greeting based on catalog language
    if (isOpen && messages.length === 0) {
      const greeting = t.greeting;
      setMessages([{
        role: "assistant",
        content: greeting
      }]);
      // Play greeting automatically
      if (!isMuted) {
        playMessage(greeting, catalogLang || "en");
      }
    }
  }, [isOpen, t.greeting]);

  const handleSendMessage = async (audioBlob?: Blob, textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() && !audioBlob) return;

    const currentText = textToSend;
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
      formData.append("cart", JSON.stringify(cart));

      const res = await fetch(`/api/c/${slug}/ai/waiter/chat`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        const assistantMessage: ChatMessage = { role: "assistant", content: data.text };
        setMessages(prev => [...prev, assistantMessage]);

        // HANDLE ACTIONS
        if (data.action) {
          const { type, itemId, quantity } = data.action;

          if (type === "ADD_TO_CART") {
            const item = (menuItems || []).find((i: any) => i.id === itemId);
            if (item) {
              addToCart(item, quantity || 1);
              setTimeout(() => setIsCartOpen(true), 1000);
            }
          } else if (type === "UPDATE_CART") {
            updateQuantity(itemId, quantity);
            setTimeout(() => setIsCartOpen(true), 500);
          } else if (type === "REMOVE_FROM_CART") {
            removeFromCart(itemId);
            setTimeout(() => setIsCartOpen(true), 500);
          }
        }

        // Auto-play AI response
        if (!isMuted) {
          playMessage(data.text, data.detectedLang);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
      setVoiceUsed(false);
    }
  };

  const playMessage = (text: string, forcedLang?: string) => {
    // Stop any current audio or speech
    if (isSpeaking) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);

    // Smart language detection for TTS
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const audioLang = forcedLang || (hasArabic ? "ar" : "en");

    // For primary supported languages, use our reliable internal TTS proxy
    if (["ar", "en", "fr"].includes(audioLang)) {
      setIsSpeaking(true);

      const url = `/api/ai/tts?lang=${audioLang}&text=${encodeURIComponent(text)}`;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = (err) => {
        console.warn("Internal TTS proxy failed, falling back to browser TTS:", err);
        playBrowserTTS(text);
      };

      audio.play().catch(e => {
        console.warn("Audio play failed:", e);
        setIsSpeaking(false);
      });
      return;
    }

    // For other languages, use browser TTS (lower latency)
    playBrowserTTS(text);
  };

  const playBrowserTTS = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Find appropriate voice based on current language
    let selectedVoice = null;
    let targetLang = "en-US";

    if (activeVoiceLang === "ar-SA") {
      selectedVoice = voices.find(v => v.lang.startsWith("ar"));
      targetLang = "ar-SA";
    } else if (activeVoiceLang === "fr-FR") {
      selectedVoice = voices.find(v => v.lang.startsWith("fr"));
      targetLang = "fr-FR";
    } else {
      selectedVoice = voices.find(v => v.lang.startsWith("en"));
      targetLang = "en-US";
    }

    utterance.voice = selectedVoice || null;
    utterance.lang = targetLang;
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (inputText.trim()) {
        setVoiceUsed(true);
        handleSendMessage(undefined, inputText);
      }
    } else {
      if (!isSecureContext && window.location.hostname !== "localhost") {
        alert(t.noHttpsAlert);
        return;
      }
      if (!isSpeechSupported) {
        alert(t.noSpeechAlert);
        return;
      }
      if (!hasMicrophone) {
        alert(t.noMicAlert);
        return;
      }

      setInputText("");
      recognitionRef.current.lang = activeVoiceLang;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-[0_0_30px_-5px_rgba(147,51,234,0.5)] flex items-center justify-center z-50 hover:scale-110 active:scale-90 transition-all duration-300 group ${isOpen ? 'scale-0' : 'scale-100'}`}
        style={{
          background: `linear-gradient(135deg, ${colorPrimary}, ${colorPrimary}dd)`,
          boxShadow: `0 0 30px ${colorPrimary}40`
        }}
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
            <div dir={isRTL ? 'rtl' : 'ltr'}>
              <h3 className="text-white font-bold leading-none mb-1">{t.title}</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                if (newMuted && isSpeaking) {
                  window.speechSynthesis?.cancel();
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setIsSpeaking(false);
                }
              }}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
              <div className={`max-w-[85%] p-4 rounded-3xl relative group/msg ${msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-tr-none'
                : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
                }`}>
                <p
                  className="text-sm leading-relaxed"
                  dir={/[\u0600-\u06FF]/.test(msg.content) ? 'rtl' : 'ltr'}
                >{msg.content}</p>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => playMessage(msg.content)}
                    className="absolute -right-12 top-0 p-2 bg-white/5 hover:bg-white/10 rounded-xl opacity-0 group-hover/msg:opacity-100 transition-opacity"
                  >
                    <Volume2 className="w-4 h-4 text-white/40" />
                  </button>
                )}
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
        <div className="bg-[#0a0a0c] md:rounded-b-[2rem] p-4 border-t border-white/10 space-y-4">
          {/* Language Selector - Moved above for better space */}
          <div className="flex items-center justify-between px-2">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {[
                { code: "en-US", label: "English" },
                { code: "ar-SA", label: "العربية" },
                { code: "fr-FR", label: "Français" }
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setActiveVoiceLang(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeVoiceLang === l.code ? 'bg-white text-black shadow-lg scale-105' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                if (newMuted && isSpeaking) {
                  window.speechSynthesis?.cancel();
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setIsSpeaking(false);
                }
              }}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t.placeholder}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full bg-white/[0.03] border border-white/10 text-white rounded-[1.25rem] py-4 px-5 focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                style={{ borderColor: inputText ? `${colorPrimary}40` : undefined }}
              />

              <AnimatePresence>
                {inputText && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                    onClick={() => handleSendMessage()}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all active:scale-90"
                    style={{ backgroundColor: colorPrimary }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleRecording}
              title={t.voiceInputTitle}
              className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 ${isRecording
                ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105'
                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                }`}
            >
              {isRecording ? (
                <div className="relative">
                  <MicOff className="w-6 h-6" />
                  <div className="absolute -inset-2 bg-white/20 rounded-full animate-ping" />
                </div>
              ) : <Mic className="w-6 h-6" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 opacity-30 pb-2">
            <div className="flex items-center gap-1.5 grayscale">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white" dir={isRTL ? 'rtl' : 'ltr'}>{t.branding}</span>
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
