"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
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

const DAYS = [
  { name: "Sunday", label_en: "Sunday", label_ar: "الأحد" },
  { name: "Monday", label_en: "Monday", label_ar: "الإثنين" },
  { name: "Tuesday", label_en: "Tuesday", label_ar: "الثلاثاء" },
  { name: "Wednesday", label_en: "Wednesday", label_ar: "الأربعاء" },
  { name: "Thursday", label_en: "Thursday", label_ar: "الخميس" },
  { name: "Friday", label_en: "Friday", label_ar: "الجمعة" },
  { name: "Saturday", label_en: "Saturday", label_ar: "السبت" },
];

function formatHourToTime(hour: number | null): string {
  if (hour === null || !Number.isFinite(hour)) return "";
  const h = Math.floor(hour);
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

function OperatingHoursPageContent() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';

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
        const res = await fetchWithAuth(`/api/c/${slug}/admin/hours`);
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
  }, [slug]);

  const handleSave = async () => {
    // An open day needs both times; a cleared field must not reach the server as NaN/null
    const missing = DAYS.filter((day) => {
      const h = hours.find((x) => x.day_name === day.name);
      return h && !h.is_closed && (h.open_hour === null || h.close_hour === null);
    });
    if (missing.length > 0) {
      setMessage({
        type: "error",
        text: `Enter opening and closing times for ${missing.map((d) => d.label_en).join(", ")}, or mark ${missing.length > 1 ? "them" : "it"} closed.`,
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/hours`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hours }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Hours saved successfully!" });
      } else {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateDayHours = (dayName: string, field: keyof DayHours, value: any) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_name === dayName ? { ...h, [field]: value } : h
      )
    );
  };

  const ToggleSwitch = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={isViewer}
      onClick={() => !isViewer && onChange(!checked)}
      className={`flex items-center justify-center min-w-11 min-h-11 ${isViewer ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {checked ? (
        <ToggleRight
          className="w-8 h-8"
          style={{ color: "var(--color-primary)" }}
        />
      ) : (
        <ToggleLeft className="w-8 h-8 text-ui-muted" />
      )}
    </button>
  );

  return (
    <>
      <CatalogAdminHeader title="Operating Hours">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading || isViewer}
          className="group relative flex items-center gap-2 min-h-11 px-5 sm:px-8 py-3 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
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
            <Loader2 className="w-8 h-8 animate-spin text-ui-primary" />
          </div>
        ) : (
          <div className="glass rounded-panel p-5 sm:p-8 lg:p-10 border border-ui-line">
            <h3 className="font-semibold text-ui-ink mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              Weekly Schedule
            </h3>

            <div className="space-y-4">
              {DAYS.map((day) => {
                const dayHours = hours.find((h) => h.day_name === day.name);
                if (!dayHours) return null;

                return (
                  <div
                    key={day.name}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 sm:p-6 bg-ui-bg border border-ui-line rounded-panel hover:bg-ui-subtle transition-all group"
                  >
                    <div className="flex items-center justify-between sm:w-32">
                      <span className="font-medium text-ui-ink">{day.label_en}</span>
                      <span className="text-ui-muted text-sm hidden sm:inline">
                        {day.label_ar}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ui-muted" aria-hidden>Closed:</span>
                      <ToggleSwitch
                        label={`${day.label_en} closed`}
                        checked={dayHours.is_closed}
                        onChange={(v) => updateDayHours(day.name, "is_closed", v)}
                      />
                    </div>

                    <div
                      className={`flex-1 flex flex-wrap items-center gap-x-4 gap-y-3 ${dayHours.is_closed ? "opacity-50 pointer-events-none" : ""
                        }`}
                    >
                      {!dayHours.is_closed && (dayHours.open_hour === null || dayHours.close_hour === null) && (
                        <p className="w-full text-xs font-semibold text-ui-danger">
                          Enter both times, or mark {day.label_en} closed.
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <label htmlFor={`hours-${day.name}-open`} className="text-sm text-ui-muted">Open:</label>
                        <input
                          id={`hours-${day.name}-open`}
                          aria-label={`${day.label_en} opening time`}
                          type="time"
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

                      <div className="flex items-center gap-3">
                        <label htmlFor={`hours-${day.name}-close`} className="text-xs font-semibold text-ui-muted">Close:</label>
                        <input
                          id={`hours-${day.name}-close`}
                          aria-label={`${day.label_en} closing time`}
                          type="time"
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
