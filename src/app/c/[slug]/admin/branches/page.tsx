"use client";

import { useEffect, useState } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    MapPin,
    Plus,
    Pencil,
    Trash2,
    X,
    Loader2,
    Phone,
    Map,
    GripVertical,
    Check,
} from "lucide-react";

interface Branch {
    id: string;
    name_ar: string;
    name_en: string;
    name_fr: string;
    address_ar: string;
    address_en: string;
    address_fr: string;
    phone_numbers: string | null;
    map_url: string | null;
    display_order: number;
    is_active: number;
}

export default function BranchesPage() {
    return (
        <CatalogAdminShell>
            <BranchesPageContent />
        </CatalogAdminShell>
    );
}

function BranchesPageContent() {
    const { slug, features, fetchWithAuth, user } = useCatalogAdmin();
    const isViewer = user?.role === 'viewer';

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeLang, setActiveLang] = useState<"ar" | "en" | "fr">("en");
    const [isMultiLang, setIsMultiLang] = useState(false);
    const [enabledLangs, setEnabledLangs] = useState("en");

    const [formData, setFormData] = useState({
        name_ar: "",
        name_en: "",
        name_fr: "",
        address_ar: "",
        address_en: "",
        address_fr: "",
        phone_numbers: "",
        map_url: "",
    });

    const fetchBranches = async () => {
        try {
            const res = await fetchWithAuth(`/api/c/${slug}/admin/branches`);
            if (res.ok) {
                const data = await res.json();
                setBranches(data.branches);
            }
        } catch (error) {
            console.error("Failed to fetch branches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
        if (features) {
            setIsMultiLang(features.multi_language_enabled);
            setEnabledLangs(features.enabled_languages);
            setActiveLang(features.default_language as any || "en");
        }
    }, [slug, features]);

    const openAddModal = () => {
        if (isViewer) return;
        setEditingBranch(null);
        setFormData({
            name_ar: "",
            name_en: "",
            name_fr: "",
            address_ar: "",
            address_en: "",
            address_fr: "",
            phone_numbers: "",
            map_url: "",
        });
        setShowModal(true);
        setActiveLang("en");
    };

    const openEditModal = (branch: Branch) => {
        if (isViewer) return;
        setEditingBranch(branch);
        setFormData({
            name_ar: branch.name_ar,
            name_en: branch.name_en,
            name_fr: branch.name_fr,
            address_ar: branch.address_ar,
            address_en: branch.address_en,
            address_fr: branch.address_fr,
            phone_numbers: branch.phone_numbers || "",
            map_url: branch.map_url || "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (isViewer) return;
        if (!formData.name_en && !formData.name_ar) {
            alert("Please enter a branch name");
            return;
        }

        setSaving(true);
        try {
            const method = editingBranch ? "PUT" : "POST";
            const body = editingBranch
                ? { ...formData, id: editingBranch.id }
                : formData;

            const res = await fetchWithAuth(`/api/c/${slug}/admin/branches`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await fetchBranches();
                setShowModal(false);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to save branch");
            }
        } catch (error) {
            console.error("Failed to save branch:", error);
            alert("Failed to save branch");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (isViewer) return;
        if (!confirm("Are you sure you want to delete this branch?")) return;

        try {
            const res = await fetchWithAuth(`/api/c/${slug}/admin/branches?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                await fetchBranches();
            } else {
                alert("Failed to delete branch");
            }
        } catch (error) {
            console.error("Failed to delete branch:", error);
        }
    };

    const handleReorder = async (newOrder: Branch[]) => {
        if (isViewer) return;
        setBranches(newOrder);

        // Save new order to backend
        for (let i = 0; i < newOrder.length; i++) {
            await fetchWithAuth(`/api/c/${slug}/admin/branches`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newOrder[i].id, display_order: i }),
            });
        }
    };

    const langTabs = enabledLangs.split(",").filter(Boolean);

    return (
        <div className="flex flex-col min-h-screen">
            <CatalogAdminHeader title="Branches">
                <button
                    onClick={openAddModal}
                    disabled={isViewer}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Add Branch
                </button>
            </CatalogAdminHeader>

            <CatalogAdminContent>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="glass-card rounded-[3rem] p-20 text-center border border-white/5">
                        <MapPin className="w-16 h-16 text-white/5 mx-auto mb-6" />
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8">No branches found</p>
                        {!isViewer && (
                            <button
                                onClick={openAddModal}
                                className="text-[11px] font-black text-primary uppercase tracking-widest hover:scale-105 transition-all"
                            >
                                Create your first branch
                            </button>
                        )}
                    </div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={branches}
                        onReorder={handleReorder}
                        className="space-y-4"
                    >
                        {branches.map((branch) => (
                            <Reorder.Item
                                key={branch.id}
                                value={branch}
                                className="glass-card rounded-[2rem] p-8 border border-white/5 hover:border-white/10 transition-all group cursor-grab active:cursor-grabbing"
                            >
                                <div className="flex items-start gap-6">
                                    <div className="opacity-10 group-hover:opacity-30 transition-opacity mt-1">
                                        <GripVertical className="w-5 h-5 text-white" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-black text-white tracking-tight group-hover:text-primary transition-colors">
                                                    {branch.name_en || branch.name_ar}
                                                </h3>
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                                    <Map className="w-3.5 h-3.5" />
                                                    {branch.address_en || branch.address_ar}
                                                </p>
                                                {branch.phone_numbers && (
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2 flex items-center gap-2 font-mono">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {branch.phone_numbers}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span
                                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${branch.is_active === 1
                                                        ? "bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                                                        : "bg-white/5 text-white/20 border border-white/5"
                                                        }`}
                                                >
                                                    {branch.is_active === 1 ? "Live" : "Inactive"}
                                                </span>
                                                {!isViewer && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(branch)}
                                                            className="w-10 h-10 bg-white/5 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center text-white/40 hover:text-white"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(branch.id)}
                                                            className="w-10 h-10 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-all flex items-center justify-center text-purple-400 hover:text-purple-300"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}

                {/* Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#050505]/60 backdrop-blur-md animate-in fade-in duration-300">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="glass-card w-full max-w-2xl overflow-hidden border-white/10"
                            >
                                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.01]">
                                    <div>
                                        <h2 className="text-xl font-black text-white tracking-tighter uppercase whitespace-nowrap">
                                            {editingBranch ? "Edit Branch" : "Add New Branch"}
                                        </h2>
                                        <div className="h-0.5 w-8 bg-primary mt-2 rounded-full opacity-50" />
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Language Selection */}
                                    {isMultiLang && langTabs.length > 1 && (
                                        <div className="flex p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            {langTabs.map((lang) => (
                                                <button
                                                    key={lang}
                                                    type="button"
                                                    onClick={() => setActiveLang(lang as any)}
                                                    className={`flex-1 py-3 text-[10px] font-black transition-all rounded-xl uppercase tracking-widest ${activeLang === lang
                                                        ? "bg-white text-black shadow-lg"
                                                        : "text-white/30 hover:text-white"
                                                        }`}
                                                >
                                                    {lang === "ar" ? "العربية" : lang.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3">Branch Name ({activeLang.toUpperCase()})</label>
                                            <input
                                                type="text"
                                                value={formData[`name_${activeLang}` as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [`name_${activeLang}`]: e.target.value })}
                                                className={`w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all ${activeLang === 'ar' ? 'text-right' : ''}`}
                                                dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                                                placeholder={activeLang === 'ar' ? 'اسم الفرع' : 'Branch Name'}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3">Address ({activeLang.toUpperCase()})</label>
                                            <textarea
                                                value={formData[`address_${activeLang}` as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [`address_${activeLang}`]: e.target.value })}
                                                rows={3}
                                                className={`w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all resize-none ${activeLang === 'ar' ? 'text-right' : ''}`}
                                                dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                                                placeholder={activeLang === 'ar' ? 'العنوان بالتفصيل' : 'Full Address'}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3">Phone Numbers</label>
                                                <div className="relative">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={formData.phone_numbers}
                                                        onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all font-mono"
                                                        placeholder="+1 234 567 8900"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3">Maps URL</label>
                                                <div className="relative">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary">
                                                        <Map className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={formData.map_url}
                                                        onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all"
                                                        placeholder="Google Maps link"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-8 border-t border-white/5 bg-white/[0.01]">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-white/5 text-white/40 rounded-2xl hover:text-white hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    {!isViewer && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4 group-hover:scale-125 transition-transform" />
                                            )}
                                            {editingBranch ? "Update Branch" : "Create Branch"}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </CatalogAdminContent>
        </div>
    );
}
