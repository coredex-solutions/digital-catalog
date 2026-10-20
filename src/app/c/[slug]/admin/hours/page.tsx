"use client";

import { useEffect, useState } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat } from "../_lib/i18n";
import {
  Save,
  Loader2,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface DayHours {
  day_name: string;
  /** null while the owner has cleared the time field */
  open_hour: number | null;
  close_hour: number | null;
  is_closed: boolean;
}

/** Monday first, like the API and Lebanese calendars. `name` is the id stored by the API. */
const DAYS = [
  { name: "Monday", label_en: "Monday", label_ar: "الاثنين" },
  { name: "Tuesday", label_en: "Tuesday", label_ar: "الثلاثاء" },
  { name: "Wednesday", label_en: "Wednesday", label_ar: "الأربعاء" },
  { name: "Thursday", label_en: "Thursday", label_ar: "الخميس" },
  { name: "Friday", label_en: "Friday", label_ar: "الجمعة" },
  { name: "Saturday", label_en: "Saturday", label_ar: "السبت" },
  { name: "Sunday", label_en: "Sunday", label_ar: "الأحد" },
];

const en = {
  saving: "Saving…",
  save: "Save changes",
  weekly: "Weekly hours",
  closed: "Closed",
  open: "Opens",
  close: "Closes",
  closedSwitch: (day: string) => `${day}: closed`,
  openingTime: (day: string) => `${day} opening time`,
  closingTime: (day: string) => `${day} closing time`,
  bothTimes: (day: string) => `Enter both times, or mark ${day} as closed.`,
  missingTimes: (days: string[]) =>
    days.length === 1
      ? `Enter the opening and closing times for ${days[0]}, or mark it as closed.`
      : `Enter the opening and closing times for ${days.join(", ")}, or mark them as closed.`,
  saved: "Opening hours saved.",
  saveFailed: "Couldn't save the opening hours. Please try again.",
  midnight: "midnight",
  nextDay: "(next day)",
  closedAllDay: "Closed all day",
};
const ar: typeof en = {
  saving: "جارٍ الحفظ…",
  save: "حفظ التعديلات",
  weekly: "ساعات العمل خلال الأسبوع",
  closed: "مغلق",
  open: "يفتح",
  close: "يغلق",
  closedSwitch: (day) => `${day}: مغلق`,
  openingTime: (day) => `وقت الفتح يوم ${day}`,
  closingTime: (day) => `وقت الإغلاق يوم ${day}`,
  bothTimes: (day) => `أدخل الوقتين، أو اجعل يوم ${day} مغلقاً.`,
  missingTimes: (days) =>
    days.length === 1
      ? `أدخل وقت الفتح ووقت الإغلاق ليوم ${days[0]}، أو اجعله مغلقاً.`
      : `أدخل وقت الفتح ووقت الإغلاق لأيام ${days.join("، ")}، أو اجعلها مغلقة.`,
  saved: "تم حفظ ساعات العمل.",
  saveFailed: "تعذّر حفظ ساعات العمل. يُرجى المحاولة مرة أخرى.",
  midnight: "منتصف الليل",
  nextDay: "(اليوم التالي)",
  closedAllDay: "مغلق طوال اليوم",
};

function formatHourToTime(hour: number | null): string {
  if (hour === null || !Number.isFinite(hour)) return "";
  // The API allows 24 for "until midnight"; a time field only knows 00:00
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** "HH:MM" to fractional hours; null for a cleared or malformed field (never NaN) */
function parseTimeToHour(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]) + Number(match[2]) / 60;
  return Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : null;
}

// Outside the page component, so it isn't remounted on every render
const ToggleSwitch = ({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`flex items-center justify-center min-w-11 min-h-11 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
  >
    {checked ? (
      <ToggleRight
        className="w-8 h-8 rtl:-scale-x-100"
        style={{ color: "var(--color-primary)" }}
        aria-hidden
      />
    ) : (
      <ToggleLeft className="w-8 h-8 text-ui-muted rtl:-scale-x-100" aria-hidden />
    )}
  </button>
);

function OperatingHoursPageContent() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const f = useFormat();
  const dayLabel = (day: (typeof DAYS)[number]) => (lang === "ar" ? day.label_ar : day.label_en);

  /** A readable time, e.g. "9:00 am" / "9:00 ص"; 0 and 24 read as midnight */
  const readableTime = (hour: number) => {
    if (hour === 0 || hour === 24) return t.midnight;
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    return f.date(new Date(Date.UTC(2000, 0, 1, h, m)), {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const [hours, setHours] = useState<DayHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/hours/`);
        if (res.ok) {
          const data = await res.json();
          if (data.hours && data.hours.length > 0) {
            setHours(data.hours);
          } else {
            setHours(DAYS.map(day => ({ day_name: day.name, open_hour: 9, close_hour: 22, is_closed: false })));
          }
        } else {
          setHours(DAYS.map(day => ({ day_name: day.name, open_hour: 9, close_hour: 22, is_closed: false })));
        }
      } catch (error) {
        console.error("Failed to fetch operating hours:", error);
        setHours(DAYS.map(day => ({ day_name: day.name, open_hour: 9, close_hour: 22, is_closed: false })));
      } finally {
        setLoading(false);
      }
    };
    fetchHours();
  }, [slug, fetchWithAuth]);

  const handleSave = async () => {
    // An open day needs both times; a cleared field must not reach the server as NaN/null
    const missing = DAYS.filter((day) => {
      const h = hours.find((x) => x.day_name === day.name);
      return h && !h.is_closed && (h.open_hour === null || h.close_hour === null);
    });
    if (missing.length > 0) {
      setMessage({
        type: "error",
        text: t.missingTimes(missing.map(dayLabel)),
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/hours/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hours }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t.saved });
      } else {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || t.saveFailed);
      }
    } catch (error) {
      setMessage({ type: "error", text: (error instanceof Error && error.message) || t.saveFailed });
    } finally {
      setSaving(false);
    }
  };

  const updateDayHours = <K extends keyof DayHours>(dayName: string, field: K, value: DayHours[K]) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_name === dayName ? { ...h, [field]: value } : h
      )
    );
  };


  return (
    <>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].hours}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading || isViewer}
          className="group relative flex items-center gap-2 min-h-11 px-5 sm:px-8 py-3 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              {t.saving}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden />
              {t.save}
            </>
          )}
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {message && (
          <div
            role={message.type === "error" ? "alert" : "status"}
            className={`mb-6 px-4 py-3 rounded-xl ${message.type === "success"
              ? "bg-ui-subtle text-ui-success border border-ui-line"
              : "bg-ui-subtle text-ui-primary border border-ui-line"
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-ui-primary" aria-hidden />
          </div>
        ) : (
          <div className="glass rounded-panel p-5 sm:p-8 lg:p-10 border border-ui-line">
            <h3 className="font-semibold text-ui-heading mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: "var(--color-primary)" }} aria-hidden />
              {t.weekly}
            </h3>

            <div className="space-y-4">
              {DAYS.map((day) => {
                const dayHours = hours.find((h) => h.day_name === day.name);
                if (!dayHours) return null;
                const label = dayLabel(day);
                const hasTimes = dayHours.open_hour !== null && dayHours.close_hour !== null;
                // Closing at or before opening is an overnight shift (e.g. 6 pm to 2 am); midnight is not
                const overnight =
                  hasTimes &&
                  dayHours.close_hour !== 0 &&
                  dayHours.close_hour !== 24 &&
                  dayHours.close_hour! <= dayHours.open_hour!;

                return (
                  <div
                    key={day.name}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 sm:p-6 bg-ui-bg border border-ui-line rounded-panel hover:bg-ui-subtle transition-all group"
                  >
                    <div className="sm:w-40 shrink-0">
                      <span className="block font-medium text-ui-ink">{label}</span>
                      <span className="block text-xs text-ui-muted mt-0.5">
                        {dayHours.is_closed
                          ? t.closedAllDay
                          : hasTimes
                            ? `${readableTime(dayHours.open_hour!)} – ${readableTime(dayHours.close_hour!)}${overnight ? ` ${t.nextDay}` : ""}`
                            : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ui-muted" aria-hidden>{t.closed}</span>
                      <ToggleSwitch
                        disabled={isViewer}
                        label={t.closedSwitch(label)}
                        checked={dayHours.is_closed}
                        onChange={(v) => updateDayHours(day.name, "is_closed", v)}
                      />
                    </div>

                    <div
                      className={`flex-1 flex flex-wrap items-center gap-x-4 gap-y-3 ${dayHours.is_closed ? "opacity-50 pointer-events-none" : ""
                        }`}
                    >
                      {!dayHours.is_closed && !hasTimes && (
                        <p className="w-full text-xs font-semibold text-ui-danger">
                          {t.bothTimes(label)}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <label htmlFor={`hours-${day.name}-open`} className="text-sm text-ui-muted">{t.open}</label>
                        <input
                          id={`hours-${day.name}-open`}
                          aria-label={t.openingTime(label)}
                          type="time"
                          dir="ltr"
                          value={formatHourToTime(dayHours.open_hour)}
                          onChange={(e) =>
                            updateDayHours(
                              day.name,
                              "open_hour",
                              parseTimeToHour(e.target.value)
                            )
                          }
                          className="min-h-11 px-3 sm:px-4 py-2 bg-ui-subtle border border-ui-input rounded-xl text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-sm disabled:opacity-50"
                          disabled={isViewer}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label htmlFor={`hours-${day.name}-close`} className="text-sm text-ui-muted">{t.close}</label>
                        <input
                          id={`hours-${day.name}-close`}
                          aria-label={t.closingTime(label)}
                          type="time"
                          dir="ltr"
                          value={formatHourToTime(dayHours.close_hour)}
                          onChange={(e) =>
                            updateDayHours(
                              day.name,
                              "close_hour",
                              parseTimeToHour(e.target.value)
                            )
                          }
                          className="min-h-11 px-3 sm:px-4 py-2 bg-ui-subtle border border-ui-input rounded-xl text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-sm disabled:opacity-50"
                          disabled={isViewer}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CatalogAdminContent>
    </>
  );
}

export default function OperatingHoursPage() {
  return (
    <CatalogAdminShell>
      <OperatingHoursPageContent />
    </CatalogAdminShell>
  );
}
