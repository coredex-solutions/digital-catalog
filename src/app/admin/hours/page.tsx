"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../_components/Sidebar";

interface OperatingHour {
  day_name: string;
  open_hour: number;
  close_hour: number;
  is_closed: boolean;
}

const DAYS = [
  { name: "sunday", label: "Sunday" },
  { name: "monday", label: "Monday" },
  { name: "tuesday", label: "Tuesday" },
  { name: "wednesday", label: "Wednesday" },
  { name: "thursday", label: "Thursday" },
  { name: "friday", label: "Friday" },
  { name: "saturday", label: "Saturday" },
];

export default function OperatingHoursPage() {
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    try {
      const response = await fetch("/api/operating-hours");
      const data = await response.json();
      setHours(data);
    } catch (error) {
      console.error("Error fetching hours:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("admin_token");
  };

  const updateHour = (dayName: string, field: string, value: any) => {
    setHours((prev) =>
      prev.map((h) => (h.day_name === dayName ? { ...h, [field]: value } : h))
    );
  };

  const formatHour = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const hourToTimeString = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const parseHour = (timeString: string): number => {
    const [time, period] = timeString.split(" ");
    const [h, m = "0"] = time.split(":");
    let hour = parseInt(h);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour + parseInt(m) / 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/operating-hours", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hours }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to save operating hours");
        return;
      }

      alert("Operating hours saved successfully!");
    } catch (error) {
      console.error("Error saving hours:", error);
      alert("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
        <Sidebar />
        <div className="lg:pl-64 pt-16 lg:pt-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      <Sidebar />
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Operating Hours
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Set your restaurant's opening and closing times
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {DAYS.map((day, index) => {
                const hour = hours.find((h) => h.day_name === day.name) || {
                  day_name: day.name,
                  open_hour: 9,
                  close_hour: 21,
                  is_closed: false,
                };

                return (
                  <motion.div
                    key={day.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <Clock
                            size={24}
                            className="text-purple-600 dark:text-purple-400"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {day.label}
                          </h3>
                          {!hour.is_closed && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {formatHour(hour.open_hour)} -{" "}
                              {formatHour(hour.close_hour)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 sm:justify-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hour.is_closed}
                            onChange={(e) =>
                              updateHour(
                                day.name,
                                "is_closed",
                                e.target.checked
                              )
                            }
                            className="w-5 h-5 rounded border-slate-300 dark:border-navy-600 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Closed
                          </span>
                        </label>

                        {!hour.is_closed && (
                          <div className="flex items-center gap-2">
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Open
                              </label>
                              <input
                                type="time"
                                value={hourToTimeString(hour.open_hour)}
                                onChange={(e) => {
                                  const [h, m] = e.target.value.split(":");
                                  updateHour(
                                    day.name,
                                    "open_hour",
                                    parseInt(h) + parseInt(m) / 60
                                  );
                                }}
                                className="px-3 py-2 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                              />
                            </div>
                            <span className="text-slate-400 mt-6">-</span>
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                Close
                              </label>
                              <input
                                type="time"
                                value={hourToTimeString(hour.close_hour)}
                                onChange={(e) => {
                                  const [h, m] = e.target.value.split(":");
                                  updateHour(
                                    day.name,
                                    "close_hour",
                                    parseInt(h) + parseInt(m) / 60
                                  );
                                }}
                                className="px-3 py-2 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Save size={20} />
                  {saving ? "Saving..." : "Save Hours"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
