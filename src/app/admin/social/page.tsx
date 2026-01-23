"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../_components/Sidebar";

interface SocialMedia {
  id: string;
  platform: string;
  url: string | null;
}

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-r from-purple-500 to-purple-500",
  },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-violet-600" },
  { id: "twitter", name: "Twitter", icon: Twitter, color: "bg-purple-500" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "bg-purple-600" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-violet-700" },
];

export default function SocialMediaPage() {
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSocialMedia();
  }, []);

  const fetchSocialMedia = async () => {
    try {
      const response = await fetch("/api/social-media");
      const data = await response.json();

      // Ensure all platforms exist
      const existingPlatforms = data.map((s: SocialMedia) => s.platform);
      const allPlatforms = PLATFORMS.map((p) => ({
        id: p.id,
        platform: p.id,
        url: existingPlatforms.includes(p.id)
          ? data.find((s: SocialMedia) => s.platform === p.id)?.url || null
          : null,
      }));

      setSocialMedia(allPlatforms);
    } catch (error) {
      console.error("Error fetching social media:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("admin_token");
  };

  const updateUrl = (platform: string, url: string) => {
    setSocialMedia((prev) =>
      prev.map((s) => (s.platform === platform ? { ...s, url } : s))
    );
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
      const response = await fetch("/api/social-media", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          social: socialMedia.map((s) => ({
            id: s.id,
            platform: s.platform,
            url: s.url || null,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to save social media");
        return;
      }

      alert("Social media links saved successfully!");
    } catch (error) {
      console.error("Error saving social media:", error);
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Share2
                  size={24}
                  className="text-purple-600 dark:text-purple-400 sm:w-8 sm:h-8"
                />
                Social Media
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your social media links
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {PLATFORMS.map((platform, index) => {
                const social = socialMedia.find(
                  (s) => s.platform === platform.id
                ) || {
                  id: platform.id,
                  platform: platform.id,
                  url: null,
                };
                const Icon = platform.icon;

                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center text-white`}
                        >
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {platform.name}
                          </h3>
                          {social.url && (
                            <a
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              View Profile
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <input
                          type="url"
                          value={social.url || ""}
                          onChange={(e) =>
                            updateUrl(platform.id, e.target.value)
                          }
                          placeholder={`https://${platform.id}.com/your-profile`}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                        />
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
                  {saving ? "Saving..." : "Save Links"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
