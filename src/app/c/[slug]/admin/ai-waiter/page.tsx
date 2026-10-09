"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import {
  Brain,
  Mic,
  MicOff,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  ChefHat,
  RefreshCw,
} from "lucide-react";

interface Question {
  id: string;
  question_en: string;
  question_ar: string;
  category: "menu" | "policy" | "about";
  priority: number;
  context: string;
}

export default function AIWaiterTraining() {
  const params = useParams();
  const slug = params.slug as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [recordingLang, setRecordingLang] = useState<"ar-SA" | "en-US">("ar-SA");
  const [interimAnswer, setInterimAnswer] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);

  // For Speech-to-Text
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchQuestions();

    // Initialize Web Speech API if supported
    if (typeof window !== "undefined") {
      // Check for microphone hardware availability
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            const hasAudioInput = devices.some(device => device.kind === "audioinput");
            setHasMicrophone(hasAudioInput);
          })
          .catch(() => setHasMicrophone(false));
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let interimText = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimText += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setAnswer((prev) => prev + (prev ? " " : "") + finalTranscript);
          }
          setInterimAnswer(interimText);
        };

        recognitionRef.current.onerror = (event: any) => {
          // "not-allowed" usually means no mic or permission denied - handle silently
          if (event.error !== "no-speech" && event.error !== "not-allowed") {
            console.error("Speech recognition error:", event.error);
          }
          setIsRecording(false);
          setInterimAnswer("");
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setInterimAnswer("");
        };
      }
    }
  }, []);

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = recordingLang;
    }
  }, [recordingLang]);

  const playQuestion = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }

    const questionText = recordingLang === "ar-SA" ? currentQuestion.question_ar : currentQuestion.question_en;

    const utterance = new SpeechSynthesisUtterance(questionText);

    // Select voice based on current language
    const voices = window.speechSynthesis.getVoices();
    if (recordingLang === "ar-SA") {
      utterance.voice = voices.find(v => v.lang.startsWith("ar")) || null;
      utterance.lang = "ar-SA";
    } else {
      utterance.voice = voices.find(v => v.lang.startsWith("en")) || null;
      utterance.lang = "en-US";
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const res = await fetch(`/api/c/${slug}/admin/ai/waiter/train`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const pendingQuestions = data.questions || [];
        setQuestions(pendingQuestions);
        setProgress(0);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const [generating, setGenerating] = useState(false);
  const handleGenerateQuestions = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const res = await fetch(`/api/c/${slug}/admin/ai/waiter/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "generate" }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setCurrentIndex(0);
        setProgress(0);
      }
    } catch (error) {
      console.error("Failed to generate questions:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAnswer = async () => {
    if (!answer.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const currentQuestion = questions[currentIndex];
      const res = await fetch(`/api/c/${slug}/admin/ai/waiter/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "answer",
          question_id: currentQuestion.id,
          question_en: currentQuestion.question_en,
          answer: answer,
          category: currentQuestion.category,
        }),
      });

      if (res.ok) {
        setAnswer("");
        setQuestions(prev => prev.filter(q => q.id !== currentQuestion.id));
        if (questions.length <= 1) {
          setCompleted(true);
          setProgress(100);
        } else {
          // Stay on the same index as the next question will shift into it
          setProgress(((currentIndex + 1) / (questions.length)) * 100);
        }
      }
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setInterimAnswer("");
    } else {
      if (!isSpeechSupported) {
        alert("Your browser does not support voice input. Please use Chrome or Safari.");
        return;
      }
      if (!hasMicrophone) {
        alert("No microphone detected on your device.");
        return;
      }
      setInterimAnswer("");
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.warn("Speech start failed:", err);
        setIsRecording(false);
      }
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="AI Waiter Training" />

      <CatalogAdminContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-ui-line border-t-ui-primary rounded-full animate-spin"></div>
              <Brain className="w-8 h-8 text-ui-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-ui-muted font-medium">Loading training session...</p>
          </div>
        ) : generating ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-ui-line border-t-ui-primary rounded-full animate-spin"></div>
              <Sparkles className="w-8 h-8 text-ui-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <p className="mt-6 text-ui-muted font-medium">Gemini is analyzing your menu to craft specific questions...</p>
          </div>
        ) : completed ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-ui-success" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-ui-ink">Knowledge Base Updated!</h2>
              <p className="text-ui-muted text-lg">Your AI Waiter is now much smarter and ready to serve your customers.</p>
            </div>
            <button
              onClick={() => {
                setCompleted(false);
                setCurrentIndex(0);
                setProgress(0);
                fetchQuestions();
              }}
              className="px-5 sm:px-8 py-4 bg-ui-subtle hover:bg-ui-subtle border border-ui-line rounded-control text-ui-ink font-bold transition-all"
            >
              Start New Training Session
            </button>
          </div>
        ) : questions.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="relative h-1.5 w-full bg-ui-subtle rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-ui-primary transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Question Card */}
              <div className="lg:col-span-12">
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-panel opacity-20 blur group-hover:opacity-30 transition duration-1000"></div>
                  <div className="relative bg-ui-surface border border-ui-line rounded-panel p-5 sm:p-8 md:p-12">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-ui-subtle rounded-control flex items-center justify-center">
                          <ChefHat className="w-6 h-6 text-ui-primary" />
                        </div>
                        <span className="text-xs font-semibold text-ui-primary">
                          Training Task {currentIndex + 1} of {questions.length}
                        </span>
                      </div>

                      <button
                        onClick={playQuestion}
                        disabled={isSpeaking}
                        aria-label="Read the question aloud"
                        className={`w-12 h-12 rounded-xl border border-ui-line flex items-center justify-center transition-all ${isSpeaking ? 'bg-ui-primary text-ui-primary-fg' : 'bg-ui-subtle text-ui-muted hover:text-ui-ink hover:bg-ui-subtle'}`}
                      >
                        {isSpeaking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-2xl md:text-4xl font-bold text-ui-ink leading-tight">
                        {currentQuestion.question_ar}
                      </h2>
                      <p className="text-lg sm:text-xl text-ui-muted">
                        {currentQuestion.question_en}
                      </p>

                      {currentQuestion.context && (
                        <div className="flex items-start gap-3 p-4 bg-ui-subtle border border-ui-line rounded-control">
                          <AlertCircle className="w-5 h-5 text-ui-primary mt-0.5" />
                          <p className="text-sm text-ui-primary leading-relaxed">
                            {currentQuestion.context}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 sm:mt-12 space-y-6">
                      <div className="relative">
                        <textarea
                          value={isRecording ? answer + (interimAnswer ? (answer ? " " : "") + interimAnswer : "") : answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Your answer here (Arabic or English)..."
                          aria-label="Your answer"
                          className="w-full h-64 sm:h-48 bg-ui-bg border border-ui-input rounded-panel p-4 pb-32 sm:p-6 sm:pe-44 text-ui-ink text-base sm:text-lg focus:outline-none focus:border-ui-primary transition-all resize-none custom-scrollbar"
                        />
                        <div className="absolute bottom-4 right-4 flex flex-col gap-3">
                          {/* Language Toggle */}
                          <div className="flex p-1 bg-ui-subtle border border-ui-line rounded-xl">
                            <button
                              onClick={() => setRecordingLang("ar-SA")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${recordingLang === "ar-SA" ? 'bg-ui-primary text-ui-primary-fg shadow-lg' : 'text-ui-muted hover:text-ui-ink'}`}
                            >
                              AR
                            </button>
                            <button
                              onClick={() => setRecordingLang("en-US")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${recordingLang === "en-US" ? 'bg-ui-primary text-ui-primary-fg shadow-lg' : 'text-ui-muted hover:text-ui-ink'}`}
                            >
                              EN
                            </button>
                          </div>
                          <button
                            onClick={toggleRecording}
                            disabled={!hasMicrophone && !isRecording}
                            title={!hasMicrophone ? "No microphone detected" : "Voice input"}
                            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
                            className={`w-14 h-14 rounded-control flex items-center justify-center transition-all ${isRecording
                                ? 'bg-ui-primary text-ui-primary-fg shadow-lg '
                                : !hasMicrophone
                                  ? 'bg-ui-subtle text-ui-muted cursor-not-allowed'
                                  : 'bg-ui-subtle hover:bg-ui-subtle text-ui-muted hover:text-ui-ink'
                              }`}
                          >
                            {isRecording ? <div className="relative"><div className="absolute -inset-2 bg-ui-subtle rounded-full animate-ping" /><MicOff className="w-6 h-6 relative z-10" /></div> : <Mic className="w-6 h-6" />}
                          </button>
                        </div>
                      </div>

                      {isRecording && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 px-4 py-2 bg-ui-subtle border border-ui-line rounded-full w-fit"
                        >
                          <div className="w-2 h-2 rounded-full bg-ui-primary" />
                          <span className="text-xs font-semibold text-ui-primary">Listening...</span>
                        </motion.div>
                      )}

                      <div className="flex items-center justify-between pt-4">
                        <button
                          disabled={currentIndex === 0}
                          onClick={() => setCurrentIndex((p) => p - 1)}
                          className="flex items-center gap-2 text-ui-muted hover:text-ui-ink transition-colors disabled:opacity-0"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          Previous
                        </button>
                        <button
                          onClick={handleSaveAnswer}
                          disabled={!answer.trim() || saving}
                          className="px-5 sm:px-10 py-4 rounded-control bg-ui-primary text-ui-primary-fg font-semibold hover:bg-ui-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                          {saving ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Saving...
                            </div>
                          ) : (
                            "Submit Answer"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 bg-ui-subtle rounded-panel flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-ui-muted" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-ui-ink">No questions needed right now</h3>
              <p className="text-ui-muted">Your AI Waiter seems to have enough knowledge for your current menu.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={fetchQuestions}
                className="flex items-center gap-2 px-6 py-3 bg-ui-subtle hover:bg-ui-subtle rounded-xl text-ui-ink transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Queue
              </button>
              <button
                onClick={handleGenerateQuestions}
                className="flex items-center gap-2 px-6 py-3 rounded-control bg-ui-primary text-ui-primary-fg font-semibold transition-colors hover:bg-ui-primary-hover"
              >
                <Brain className="w-4 h-4" />
                Generate New Questions
              </button>
            </div>
          </div>
        )}
      </CatalogAdminContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </CatalogAdminShell>
  );
}
