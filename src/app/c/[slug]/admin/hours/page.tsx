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
  open_hour: number;
  close_hour: number;
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

function formatHourToTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function parseTimeToHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

export default function OperatingHoursPage() {
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
        throw new Error("Failed to save");
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
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => !isViewer && onChange(!checked)}
      className={`flex items-center ${isViewer ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {checked ? (
        <ToggleRight
          className="w-8 h-8"
          style={{ color: "var(--color-primary)" }}
        />
      ) : (
        <ToggleLeft className="w-8 h-8 text-slate-500" />
      )}
    </button>
  );

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="Operating Hours">
        <button
          onClick={handleSave}
          disabled={saving || loading || isViewer}
          className="group relative flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest overflow-hidden shadow-lg shadow-primary/10 disabled:opacity-50"
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
            className={`mb-6 px-4 py-3 rounded-xl ${message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="glass rounded-[3rem] p-10 border border-white/5">
            <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
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
                    className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center justify-between sm:w-32">
                      <span className="font-medium text-white">{day.label_en}</span>
                      <span className="text-slate-500 text-sm hidden sm:inline">
                        {day.label_ar}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Closed:</span>
                      <ToggleSwitch
                        checked={dayHours.is_closed}
                        onChange={(v) => updateDayHours(day.name, "is_closed", v)}
                      />
                    </div>

                    <div
                      className={`flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${dayHours.is_closed ? "opacity-50 pointer-events-none" : ""
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Open:</span>
                        <input
                          type="time"
                          value={formatHourToTime(dayHours.open_hour)}
                          onChange={(e) =>
                            updateDayHours(
                              day.name,
                              "open_hour",
                              parseTimeToHour(e.target.value)
                            )
                          }
                          className="px-4 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-white font-black focus:outline-none focus:border-primary/50 transition-all text-sm disabled:opacity-50"
                          disabled={isViewer}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Close:</span>
                        <input
                          type="time"
                          value={formatHourToTime(dayHours.close_hour)}
                          onChange={(e) =>
                            updateDayHours(
                              day.name,
                              "close_hour",
                              parseTimeToHour(e.target.value)
                            )
                          }
                          className="px-4 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-white font-black focus:outline-none focus:border-primary/50 transition-all text-sm disabled:opacity-50"
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
    </CatalogAdminShell>
  );
}
