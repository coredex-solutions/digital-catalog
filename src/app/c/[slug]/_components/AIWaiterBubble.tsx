"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  X,
  Send,
  Mic,
  MicOff,
  ChefHat,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { useCatalog } from "../_providers/CatalogProvider";
import { OPEN_WAITER_EVENT } from "../_lib/events";
import { Language } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Translations for the AI Waiter popup
const translations = {
  en: {
    title: "Ask about the menu",
    subtitle: "AI assistant. Check allergies with staff.",
    placeholder: "Ask about a dish...",
    noMicTitle: "No microphone detected",
    voiceInputTitle: "Voice input",
    greeting: "Hi! Ask me about the dishes and I'll help you choose. For allergies or dietary needs, please confirm with the staff.",
    noMicAlert: "No microphone detected on your device.",
    noSpeechAlert: "Voice recognition is not supported in your browser.",
    noHttpsAlert: "Voice features require a secure connection (HTTPS). Please use HTTPS to enable the microphone.",
    mute: "Mute voice replies",
    unmute: "Turn on voice replies",
    close: "Close",
    listen: "Listen",
    thinking: "Writing a reply",
    voiceLanguage: "Voice language",
    send: "Send",
  },
  ar: {
    title: "اسأل عن القائمة",
    subtitle: "مساعد ذكي. تأكد من الحساسية مع الموظفين.",
    placeholder: "اسأل عن طبق...",
    noMicTitle: "لم يتم اكتشاف ميكروفون",
    voiceInputTitle: "الإدخال الصوتي",
    greeting: "مرحباً! اسألني عن الأطباق وسأساعدك في الاختيار. بالنسبة للحساسية أو الأنظمة الغذائية، يرجى التأكد مع الموظفين.",
    noMicAlert: "لم يتم اكتشاف ميكروفون على جهازك.",
    noSpeechAlert: "التعرف على الصوت غير مدعوم في متصفحك.",
    noHttpsAlert: "ميزات الصوت تتطلب اتصالاً آمناً (HTTPS). يرجى استخدام HTTPS لتفعيل الميكروفون.",
    mute: "كتم الردود الصوتية",
    unmute: "تشغيل الردود الصوتية",
    close: "إغلاق",
    listen: "استمع",
    thinking: "جارٍ كتابة الرد",
    voiceLanguage: "لغة الصوت",
    send: "إرسال",
  },
  fr: {
    title: "Questions sur le menu",
    subtitle: "Assistant IA. Vérifiez les allergies avec le personnel.",
    placeholder: "Posez une question sur un plat...",
    noMicTitle: "Aucun microphone détecté",
    voiceInputTitle: "Entrée vocale",
    greeting: "Bonjour ! Posez-moi vos questions sur les plats, je vous aide à choisir. Pour les allergies ou régimes, merci de confirmer avec le personnel.",
    noMicAlert: "Aucun microphone détecté sur votre appareil.",
    noSpeechAlert: "La reconnaissance vocale n'est pas prise en charge par votre navigateur.",
    noHttpsAlert: "Les fonctions vocales nécessitent une connexion sécurisée (HTTPS). Veuillez utiliser HTTPS pour activer le microphone.",
    mute: "Couper les réponses vocales",
    unmute: "Activer les réponses vocales",
    close: "Fermer",
    listen: "Écouter",
    thinking: "Rédaction de la réponse",
    voiceLanguage: "Langue de la voix",
    send: "Envoyer",
  },
};

export default function AIWaiterBubble() {
  const params = useParams();
  const slug = params.slug as string;
  const {
    lang: catalogLang,
    addToCart,
    updateQuantity,
    removeFromCart,
    setIsCartOpen,
    menuItems,
    cart,
  } = useCatalog();

  // Get translations for current language
  const t = translations[catalogLang as keyof typeof translations] || translations.en;
  const isRTL = catalogLang === "ar";
  const [isOpen, setIsOpen] = useState(false);

  // Opened from the "Ask a question" button in the menu header. A floating button would sit on
  // top of dishes and their add buttons, so there isn't one.
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(OPEN_WAITER_EVENT, open);
    return () => window.removeEventListener(OPEN_WAITER_EVENT, open);
  }, []);
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

  // Escape closes the chat, like the menu's other panels
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

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
        if (data.actions && Array.isArray(data.actions)) {
          data.actions.forEach((action: any) => {
            const { type, itemId, quantity } = action;

            if (type === "ADD_TO_CART") {
              const item = (menuItems || []).find((i: any) => i.id === itemId);
              if (item) {
                addToCart(item, quantity || 1);
              }
            } else if (type === "UPDATE_CART") {
              updateQuantity(itemId, quantity);
            } else if (type === "REMOVE_FROM_CART") {
              removeFromCart(itemId);
            }
          });

          // Open cart once if any actions were performed
          if (data.actions.length > 0) {
            setTimeout(() => setIsCartOpen(true), 800);
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
      {/* Chat panel: full screen on phones, a card on larger screens */}
      <div
        role="dialog"
        aria-label={t.title}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-0 z-[60] flex flex-col bg-menu-surface text-menu-ink transition-[opacity,transform] duration-200 ease-out md:inset-auto md:bottom-6 md:end-6 md:h-[600px] md:w-[400px] md:overflow-hidden md:rounded-panel md:border md:border-menu-line md:shadow-menu-md ${isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-menu-line px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-menu-subtle text-brand-ink">
              <ChefHat className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0" dir={isRTL ? 'rtl' : 'ltr'}>
              <h3 className="truncate font-semibold leading-tight">{t.title}</h3>
              <p className="truncate text-sm text-menu-muted">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
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
              aria-pressed={isMuted}
              aria-label={isMuted ? t.unmute : t.mute}
              className="flex h-11 w-11 items-center justify-center rounded-control text-menu-muted transition-colors hover:bg-menu-raised hover:text-menu-ink"
            >
              {isMuted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t.close}
              className="flex h-11 w-11 items-center justify-center rounded-control text-menu-muted transition-colors hover:bg-menu-raised hover:text-menu-ink"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-menu-bg p-4" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-panel px-4 py-3 ${msg.role === 'user'
                  ? 'rounded-ee-[4px] bg-brand text-brand-fg'
                  : 'rounded-es-[4px] border border-menu-line bg-menu-surface'
                  }`}
              >
                <p className="whitespace-pre-line text-[0.9375rem]" dir={/[؀-ۿ]/.test(msg.content) ? 'rtl' : 'ltr'}>
                  {msg.content}
                </p>
                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => playMessage(msg.content)}
                    className="-ms-2 mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-sm text-menu-muted transition-colors hover:text-menu-ink"
                  >
                    <Volume2 className="h-4 w-4" aria-hidden />
                    {t.listen}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start" role="status" aria-label={t.thinking}>
              <div className="flex gap-1.5 rounded-panel rounded-es-[4px] border border-menu-line bg-menu-surface px-4 py-4">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-menu-muted" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-menu-muted [animation-delay:100ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-menu-muted [animation-delay:200ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="space-y-3 border-t border-menu-line px-4 pt-3 pb-safe">
          <div className="flex items-center gap-2" role="radiogroup" aria-label={t.voiceLanguage}>
            {[
              { code: "en-US", label: "English" },
              { code: "ar-SA", label: "العربية" },
              { code: "fr-FR", label: "Français" }
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={activeVoiceLang === l.code}
                onClick={() => setActiveVoiceLang(l.code)}
                className={`min-h-9 rounded-control border px-3 text-sm font-medium transition-colors ${activeVoiceLang === l.code ? 'border-menu-input-border bg-menu-subtle text-menu-ink' : 'border-transparent text-menu-muted hover:text-menu-ink'}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) handleSendMessage();
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="min-h-12 min-w-0 flex-1 rounded-control border border-menu-input-border bg-menu-surface px-4 text-base placeholder:text-menu-muted focus:outline-none focus-visible:border-brand-ink"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              aria-label={t.send}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-brand text-brand-fg transition-opacity disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={toggleRecording}
              aria-pressed={isRecording}
              aria-label={t.voiceInputTitle}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-control border transition-colors ${isRecording
                ? 'border-menu-danger bg-menu-danger text-white'
                : 'border-menu-input-border text-menu-ink hover:bg-menu-raised'
                }`}
            >
              {isRecording ? <MicOff className="h-5 w-5" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
