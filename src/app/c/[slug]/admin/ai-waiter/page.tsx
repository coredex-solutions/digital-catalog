"use client";

import { useEffect, useState, useRef } from "react";
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

  // For Speech-to-Text
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchQuestions();

    // Initialize Web Speech API if supported
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "ar-SA"; // Default to Arabic

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setAnswer((prev) => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const res = await fetch(`/api/c/${slug}/admin/ai/waiter/train`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
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
          question: currentQuestion.question_en,
          answer: answer,
          category: currentQuestion.category,
        }),
      });

      if (res.ok) {
        setAnswer("");
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setProgress(((currentIndex + 1) / questions.length) * 100);
        } else {
          setCompleted(true);
          setProgress(100);
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
    } else {
      setAnswer("");
      recognitionRef.current?.start();
      setIsRecording(true);
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
              <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              <Brain className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-6 text-white/40 font-medium animate-pulse">Analyzing menu data...</p>
          </div>
        ) : completed ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Knowledge Base Updated!</h2>
              <p className="text-white/60 text-lg">Your AI Waiter is now much smarter and ready to serve your customers.</p>
            </div>
            <button
              onClick={() => {
                setCompleted(false);
                setCurrentIndex(0);
                setProgress(0);
                fetchQuestions();
              }}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all"
            >
              Start New Training Session
            </button>
          </div>
        ) : questions.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Question Card */}
              <div className="lg:col-span-12">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-[2.5rem] opacity-20 blur group-hover:opacity-30 transition duration-1000"></div>
                  <div className="relative bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                        <ChefHat className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
                        Training Task {currentIndex + 1} of {questions.length}
                      </span>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                        {currentQuestion.question_ar}
                      </h2>
                      <p className="text-xl text-white/40 italic">
                        {currentQuestion.question_en}
                      </p>
                      
                      {currentQuestion.context && (
                        <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                          <p className="text-sm text-blue-400/80 leading-relaxed">
                            {currentQuestion.context}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 space-y-6">
                      <div className="relative">
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Your answer here (Arabic or English)..."
                          className="w-full h-48 bg-white/[0.02] border border-white/10 rounded-3xl p-6 text-white text-lg focus:outline-none focus:border-purple-500/50 transition-all resize-none custom-scrollbar"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                          <button
                            onClick={toggleRecording}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                              isRecording
                                ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
                                : "bg-white/5 hover:bg-white/10 text-white"
                            }`}
                          >
                            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <button
                          disabled={currentIndex === 0}
                          onClick={() => setCurrentIndex((p) => p - 1)}
                          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors disabled:opacity-0"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          Previous
                        </button>
                        <button
                          onClick={handleSaveAnswer}
                          disabled={!answer.trim() || saving}
                          className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
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
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No questions needed right now</h3>
              <p className="text-white/40">Your AI Waiter seems to have enough knowledge for your current menu.</p>
            </div>
            <button
               onClick={fetchQuestions}
               className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Check Again
            </button>
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
