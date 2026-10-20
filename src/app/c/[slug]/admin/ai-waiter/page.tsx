"use client";

import { useEffect, useEffectEvent, useState, useRef, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
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
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  ChefHat,
  RefreshCw,
} from "lucide-react";
import { useAdminLang, useCopy, useFormat } from "../_lib/i18n";
import { translateApiMessage } from "../_lib/api-errors";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";

const en = {
  loadFailed: "Couldn't load the questions. Please try again.",
  generateFailed: "Couldn't suggest new questions. Please try again.",
  answerFailed: "Couldn't save your answer. Please try again.",
  loading: "Loading questions…",
  generating: "Reading your menu to write questions for you…",
  doneTitle: "Answers saved",
  doneBody: "The AI waiter will use your answers when guests ask about these things.",
  startAgain: "Check for more questions",
  questionOf: (n: string, total: string) => `Question ${n} of ${total}`,
  readAloud: "Read the question aloud",
  answerPlaceholder: "Type your answer in Arabic or English…",
  answerLabel: "Your answer",
  voiceLang: "Voice input language",
  noMic: "No microphone found on this device",
  voiceInput: "Voice input",
  startVoice: "Start voice input",
  stopVoice: "Stop voice input",
  noSpeechSupport: "Your browser doesn't support voice input. Please use Chrome or Safari.",
  noMicAlert: "No microphone found on this device.",
  listening: "Listening…",
  previous: "Previous",
  saving: "Saving…",
  submit: "Save answer",
  emptyTitle: "No questions right now",
  emptyBody: "There are no questions waiting for an answer. You can ask the AI to read your menu and suggest new ones.",
  refresh: "Refresh",
  generate: "Suggest new questions",
};
const ar: typeof en = {
  loadFailed: "تعذّر تحميل الأسئلة. حاول مرة أخرى.",
  generateFailed: "تعذّر اقتراح أسئلة جديدة. حاول مرة أخرى.",
  answerFailed: "تعذّر حفظ إجابتك. حاول مرة أخرى.",
  loading: "جارٍ تحميل الأسئلة…",
  generating: "نقرأ قائمتك لنكتب لك الأسئلة…",
  doneTitle: "تم حفظ الإجابات",
  doneBody: "سيستخدم النادل الذكي إجاباتك عندما يسأل الزبائن عن هذه الأمور.",
  startAgain: "ابحث عن أسئلة أخرى",
  questionOf: (n, total) => `السؤال ${n} من ${total}`,
  readAloud: "اقرأ السؤال بصوت عالٍ",
  answerPlaceholder: "اكتب إجابتك بالعربية أو الإنجليزية…",
  answerLabel: "إجابتك",
  voiceLang: "لغة الإدخال الصوتي",
  noMic: "لا يوجد ميكروفون على هذا الجهاز",
  voiceInput: "الإدخال الصوتي",
  startVoice: "ابدأ الإدخال الصوتي",
  stopVoice: "أوقف الإدخال الصوتي",
  noSpeechSupport: "متصفحك لا يدعم الإدخال الصوتي. يُرجى استخدام Chrome أو Safari.",
  noMicAlert: "لا يوجد ميكروفون على هذا الجهاز.",
  listening: "جارٍ الاستماع…",
  previous: "السابق",
  saving: "جارٍ الحفظ…",
  submit: "حفظ الإجابة",
  emptyTitle: "لا توجد أسئلة حالياً",
  emptyBody: "لا توجد أسئلة تنتظر إجابتك. يمكنك أن تطلب من الذكاء الاصطناعي قراءة قائمتك واقتراح أسئلة جديدة.",
  refresh: "تحديث",
  generate: "اقترح أسئلة جديدة",
};

interface Question {
  id: string;
  question_en: string;
  question_ar: string;
  category: "menu" | "policy" | "about";
  priority: number;
  context: string;
}

// The parts of the Web Speech API this page uses (not in the TypeScript DOM types)
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

// Support never changes while the page is open; the server render assumes no support
const subscribeNever = () => () => {};
const getSpeechSupported = () => Boolean(getSpeechRecognition());
const getSpeechSupportedOnServer = () => false;

export default function AIWaiterTraining() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const isSpeechSupported = useSyncExternalStore(subscribeNever, getSpeechSupported, getSpeechSupportedOnServer);
  // Voice input starts in the dashboard language
  const [recordingLang, setRecordingLang] = useState<"ar-SA" | "en-US">(lang === "ar" ? "ar-SA" : "en-US");
  const [error, setError] = useState<string | null>(null);
  /** The API's message (in the dashboard language) or our own */
  const failWith = async (res: Response | null, fallback: string) => {
    const data = res ? await res.json().catch(() => null) : null;
    setError(typeof data?.error === "string" ? translateApiMessage(data.error, lang) : fallback);
  };
  const [interimAnswer, setInterimAnswer] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);

  // For Speech-to-Text
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const requestQuestions = async () => {
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    return fetch(`/api/c/${slug}/admin/ai/waiter/train/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  // State is only set once the request settles
  const loadQuestions = () =>
    requestQuestions()
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const pendingQuestions = data.questions || [];
          setQuestions(pendingQuestions);
          setProgress(0);
          setCurrentIndex(0);
        } else {
          await failWith(res, t.loadFailed);
        }
      })
      .catch(() => {
        setError(t.loadFailed);
      })
      .finally(() => {
        setLoading(false);
      });

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    await loadQuestions();
  };

  // Load once when the page opens (loading already starts true); not again when the language changes
  const loadInitialQuestions = useEffectEvent(() => {
    loadQuestions();
  });

  useEffect(() => {
    loadInitialQuestions();

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

      const SpeechRecognition = getSpeechRecognition();
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
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

        recognition.onerror = (event) => {
          // "not-allowed" usually means no mic or permission denied - handle silently
          if (event.error !== "no-speech" && event.error !== "not-allowed") {
            console.error("Speech recognition error:", event.error);
          }
          setIsRecording(false);
          setInterimAnswer("");
        };

        recognition.onend = () => {
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

  const [generating, setGenerating] = useState(false);
  const handleGenerateQuestions = async () => {
    setGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const res = await fetch(`/api/c/${slug}/admin/ai/waiter/train/`, {
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
      } else {
        await failWith(res, t.generateFailed);
      }
    } catch {
      setError(t.generateFailed);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAnswer = async () => {
    if (!answer.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const currentQuestion = questions[currentIndex];
      const res = await fetch(`/api/c/${slug}/admin/ai/waiter/train/`, {
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
      } else {
        await failWith(res, t.answerFailed);
      }
    } catch {
      setError(t.answerFailed);
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
        alert(t.noSpeechSupport);
        return;
      }
      if (!hasMicrophone) {
        alert(t.noMicAlert);
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
  // The question in the dashboard language first, the other language underneath
  const primaryQuestion = currentQuestion
    ? lang === "ar"
      ? { text: currentQuestion.question_ar, lang: "ar", dir: "rtl" as const }
      : { text: currentQuestion.question_en, lang: "en", dir: "ltr" as const }
    : null;
  const secondaryQuestion = currentQuestion
    ? lang === "ar"
      ? { text: currentQuestion.question_en, lang: "en", dir: "ltr" as const }
      : { text: currentQuestion.question_ar, lang: "ar", dir: "rtl" as const }
    : null;

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang]["ai-waiter"]} />

      <CatalogAdminContent>
        {error && (
          <p role="alert" className="mb-4 rounded-control border border-ui-danger bg-ui-subtle px-4 py-3 text-sm text-ui-danger">
            {error}
          </p>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]" role="status">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-ui-line border-t-ui-primary rounded-full animate-spin"></div>
              <Brain className="w-8 h-8 text-ui-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden />
            </div>
            <p className="mt-6 text-ui-muted font-medium">{t.loading}</p>
          </div>
        ) : generating ? (
          <div className="flex flex-col items-center justify-center h-[60vh]" role="status">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-ui-line border-t-ui-primary rounded-full animate-spin"></div>
              <Sparkles className="w-8 h-8 text-ui-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" aria-hidden />
            </div>
            <p className="mt-6 text-ui-muted font-medium text-center">{t.generating}</p>
          </div>
        ) : completed ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-ui-success" aria-hidden />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-ui-heading">{t.doneTitle}</h2>
              <p className="text-ui-muted text-lg">{t.doneBody}</p>
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
              {t.startAgain}
            </button>
          </div>
        ) : questions.length > 0 && primaryQuestion && secondaryQuestion ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="relative h-1.5 w-full bg-ui-subtle rounded-full overflow-hidden" aria-hidden>
              <div
                className="absolute top-0 start-0 h-full bg-ui-primary transition-all duration-700 ease-out"
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
                          <ChefHat className="w-6 h-6 text-ui-primary" aria-hidden />
                        </div>
                        <span className="text-xs font-semibold text-ui-primary">
                          {t.questionOf(f.number(currentIndex + 1), f.number(questions.length))}
                        </span>
                      </div>

                      <button
                        onClick={playQuestion}
                        disabled={isSpeaking}
                        aria-label={t.readAloud}
                        title={t.readAloud}
                        className={`w-12 h-12 rounded-xl border border-ui-line flex items-center justify-center transition-all ${isSpeaking ? 'bg-ui-primary text-ui-primary-fg' : 'bg-ui-subtle text-ui-muted hover:text-ui-ink hover:bg-ui-subtle'}`}
                      >
                        {isSpeaking ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Volume2 className="w-5 h-5 rtl:-scale-x-100" aria-hidden />}
                      </button>
                    </div>

                    <div className="space-y-6">
                      <h2
                        lang={primaryQuestion.lang}
                        dir={primaryQuestion.dir}
                        className="text-2xl md:text-4xl font-bold text-ui-heading leading-tight text-start"
                      >
                        {primaryQuestion.text}
                      </h2>
                      {secondaryQuestion.text && (
                        <p
                          lang={secondaryQuestion.lang}
                          dir={secondaryQuestion.dir}
                          className="text-lg sm:text-xl text-ui-muted text-start"
                        >
                          {secondaryQuestion.text}
                        </p>
                      )}

                      {currentQuestion.context && (
                        <div className="flex items-start gap-3 p-4 bg-ui-subtle border border-ui-line rounded-control">
                          <AlertCircle className="w-5 h-5 text-ui-primary mt-0.5 shrink-0" aria-hidden />
                          <p dir="auto" className="text-sm text-ui-primary leading-relaxed">
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
                          placeholder={t.answerPlaceholder}
                          aria-label={t.answerLabel}
                          dir="auto"
                          className="w-full h-64 sm:h-48 bg-ui-bg border border-ui-input rounded-panel p-4 pb-32 sm:p-6 sm:pe-44 text-ui-ink text-base sm:text-lg focus:outline-none focus:border-ui-primary transition-all resize-none custom-scrollbar"
                        />
                        <div className="absolute bottom-4 end-4 flex flex-col gap-3">
                          {/* Language Toggle */}
                          <div className="flex p-1 bg-ui-subtle border border-ui-line rounded-xl" role="group" aria-label={t.voiceLang}>
                            <button
                              type="button"
                              onClick={() => setRecordingLang("ar-SA")}
                              aria-pressed={recordingLang === "ar-SA"}
                              lang="ar"
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${recordingLang === "ar-SA" ? 'bg-ui-primary text-ui-primary-fg shadow-lg' : 'text-ui-muted hover:text-ui-ink'}`}
                            >
                              العربية
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecordingLang("en-US")}
                              aria-pressed={recordingLang === "en-US"}
                              lang="en"
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${recordingLang === "en-US" ? 'bg-ui-primary text-ui-primary-fg shadow-lg' : 'text-ui-muted hover:text-ui-ink'}`}
                            >
                              English
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={toggleRecording}
                            disabled={!hasMicrophone && !isRecording}
                            title={!hasMicrophone ? t.noMic : t.voiceInput}
                            aria-label={isRecording ? t.stopVoice : t.startVoice}
                            className={`w-14 h-14 rounded-control flex items-center justify-center transition-all ${isRecording
                                ? 'bg-ui-primary text-ui-primary-fg shadow-lg '
                                : !hasMicrophone
                                  ? 'bg-ui-subtle text-ui-muted cursor-not-allowed'
                                  : 'bg-ui-subtle hover:bg-ui-subtle text-ui-muted hover:text-ui-ink'
                              }`}
                          >
                            {isRecording ? <div className="relative"><div className="absolute -inset-2 bg-ui-subtle rounded-full animate-ping" /><MicOff className="w-6 h-6 relative z-10" aria-hidden /></div> : <Mic className="w-6 h-6" aria-hidden />}
                          </button>
                        </div>
                      </div>

                      {isRecording && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="status"
                          className="flex items-center gap-3 px-4 py-2 bg-ui-subtle border border-ui-line rounded-full w-fit"
                        >
                          <div className="w-2 h-2 rounded-full bg-ui-primary" aria-hidden />
                          <span className="text-xs font-semibold text-ui-primary">{t.listening}</span>
                        </motion.div>
                      )}

                      <div className="flex items-center justify-between pt-4">
                        <button
                          type="button"
                          disabled={currentIndex === 0}
                          onClick={() => setCurrentIndex((p) => p - 1)}
                          className="flex items-center gap-2 text-ui-muted hover:text-ui-ink transition-colors disabled:opacity-0"
                        >
                          <ChevronLeft className="w-5 h-5 rtl:-scale-x-100" aria-hidden />
                          {t.previous}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAnswer}
                          disabled={!answer.trim() || saving}
                          className="px-5 sm:px-10 py-4 rounded-control bg-ui-primary text-ui-primary-fg font-semibold hover:bg-ui-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                          {saving ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                              {t.saving}
                            </div>
                          ) : (
                            t.submit
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
              <AlertCircle className="w-10 h-10 text-ui-muted" aria-hidden />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-bold text-ui-heading">{t.emptyTitle}</h3>
              <p className="text-ui-muted">{t.emptyBody}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={fetchQuestions}
                className="flex items-center gap-2 px-6 py-3 bg-ui-subtle hover:bg-ui-subtle rounded-xl text-ui-ink transition-all"
              >
                <RefreshCw className="w-4 h-4" aria-hidden />
                {t.refresh}
              </button>
              <button
                type="button"
                onClick={handleGenerateQuestions}
                className="flex items-center gap-2 px-6 py-3 rounded-control bg-ui-primary text-ui-primary-fg font-semibold transition-colors hover:bg-ui-primary-hover"
              >
                <Brain className="w-4 h-4" aria-hidden />
                {t.generate}
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
