"use client";

import { useEffect, useState } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { motion, AnimatePresence, Reorder, useDragControls, type DragControls } from "framer-motion";
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
    address_ar: string;
    address_en: string;
    phone_numbers: string | null;
    map_url: string | null;
    display_order: number;
    is_active: number;
}

/** Reorderable row that only drags from its grip, so swiping over a card still scrolls on phones */
function BranchReorderItem({
    value,
    className,
    children,
}: {
    value: Branch;
    className: string;
    children: (controls: DragControls) => React.ReactNode;
}) {
    const controls = useDragControls();
    return (
        <Reorder.Item value={value} dragListener={false} dragControls={controls} className={className}>
            {children(controls)}
        </Reorder.Item>
    );
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
    const [activeLang, setActiveLang] = useState<"ar" | "en">("en");

    const [formData, setFormData] = useState({
        name_ar: "",
        name_en: "",
        address_ar: "",
        address_en: "",
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
            setActiveLang(features.default_language === "ar" ? "ar" : "en");
        }
    }, [slug, features]);

    const openAddModal = () => {
        if (isViewer) return;
        setEditingBranch(null);
        setFormData({
            name_ar: "",
            name_en: "",
            address_ar: "",
            address_en: "",
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
            address_ar: branch.address_ar,
            address_en: branch.address_en,
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

    // Every plan edits Arabic and English
    const langTabs = ["en", "ar"] as const;

    return (
        <div className="flex flex-col min-h-screen">
            <CatalogAdminHeader title="Branches">
                <button
                    onClick={openAddModal}
                    disabled={isViewer}
                    className="flex items-center gap-2 px-6 py-3 bg-ui-primary text-ui-primary-fg font-semibold text-xs rounded-control transition-all shadow-lg disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Add Branch
                </button>
            </CatalogAdminHeader>

            <CatalogAdminContent>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-ui-primary" />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="glass-card rounded-panel p-8 sm:p-20 text-center border border-ui-line">
                        <MapPin className="w-16 h-16 text-ui-line mx-auto mb-6" />
                        <p className="text-xs font-semibold text-ui-muted mb-8">No branches found</p>
                        {!isViewer && (
                            <button
                                onClick={openAddModal}
                                className="text-xs font-semibold text-ui-primary transition-all"
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
                            <BranchReorderItem
                                key={branch.id}
                                value={branch}
                                className="glass-card rounded-panel p-4 sm:p-8 border border-ui-line hover:border-ui-input transition-all group"
                            >
                                {(dragControls) => (
                                <div className="flex items-start gap-2 sm:gap-6">
                                    <button
                                        type="button"
                                        onPointerDown={(e) => dragControls.start(e)}
                                        className="-ms-2 -mt-1 flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-ui-muted hover:bg-ui-subtle active:cursor-grabbing"
                                        aria-label={`Drag to reorder ${branch.name_en || branch.name_ar}`}
                                    >
                                        <GripVertical className="w-5 h-5" aria-hidden />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-xl font-semibold text-ui-ink group-hover:text-ui-primary transition-colors">
                                                    {branch.name_en || branch.name_ar}
                                                </h3>
                                                <p className="text-xs font-semibold text-ui-muted mt-2 flex items-center gap-2">
                                                    <Map className="w-3.5 h-3.5" />
                                                    {branch.address_en || branch.address_ar}
                                                </p>
                                                {branch.phone_numbers && (
                                                    <p className="text-xs font-semibold text-ui-muted mt-2 flex items-center gap-2 font-mono">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {branch.phone_numbers}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <span
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${branch.is_active === 1
                                                        ? "bg-ui-subtle text-ui-primary border border-ui-line"
                                                        : "bg-ui-subtle text-ui-muted border border-ui-line"
                                                        }`}
                                                >
                                                    {branch.is_active === 1 ? "Live" : "Inactive"}
                                                </span>
                                                {!isViewer && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(branch)}
                                                            aria-label={`Edit ${branch.name_en || branch.name_ar}`}
                                                            className="w-11 h-11 bg-ui-subtle rounded-xl hover:bg-ui-subtle transition-all flex items-center justify-center text-ui-muted hover:text-ui-ink"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(branch.id)}
                                                            aria-label={`Delete ${branch.name_en || branch.name_ar}`}
                                                            className="w-11 h-11 bg-ui-subtle rounded-xl hover:bg-ui-subtle transition-all flex items-center justify-center text-ui-primary hover:text-ui-primary"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </BranchReorderItem>
                        ))}
                    </Reorder.Group>
                )}

                {/* Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 bg-black/40 animate-in fade-in duration-300">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="glass-card w-full max-w-2xl overflow-hidden border-ui-line flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] max-sm:!rounded-none max-sm:!border-0"
                            >
                                <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-4 sm:p-8 border-b border-ui-line bg-ui-bg">
                                    <div>
                                        <h2 className="text-xl font-semibold text-ui-ink whitespace-nowrap">
                                            {editingBranch ? "Edit Branch" : "Add New Branch"}
                                        </h2>
                                        <div className="h-0.5 w-8 bg-ui-primary mt-2 rounded-full opacity-50" />
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-11 h-11 shrink-0 bg-ui-subtle rounded-xl flex items-center justify-center text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-all"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-5 sm:p-8 space-y-8 flex-1 min-h-0 sm:max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Language Selection */}
                                    <div className="flex p-1.5 bg-ui-bg border border-ui-line rounded-control">
                                        {langTabs.map((lang) => (
                                            <button
                                                key={lang}
                                                type="button"
                                                onClick={() => setActiveLang(lang)}
                                                className={`flex-1 py-3 text-xs font-semibold transition-all rounded-xl ${activeLang === lang
                                                    ? "bg-ui-primary text-ui-primary-fg shadow-lg"
                                                    : "text-ui-muted hover:text-ui-ink"
                                                    }`}
                                            >
                                                {lang === "ar" ? "العربية" : lang.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-xs font-semibold text-ui-muted block mb-3">Branch Name ({activeLang.toUpperCase()})</label>
                                            <input
                                                type="text"
                                                value={formData[`name_${activeLang}` as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [`name_${activeLang}`]: e.target.value })}
                                                className={`w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all ${activeLang === 'ar' ? 'text-right' : ''}`}
                                                dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                                                placeholder={activeLang === 'ar' ? 'اسم الفرع' : 'Branch Name'}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-ui-muted block mb-3">Address ({activeLang.toUpperCase()})</label>
                                            <textarea
                                                value={formData[`address_${activeLang}` as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [`address_${activeLang}`]: e.target.value })}
                                                rows={3}
                                                className={`w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all resize-none ${activeLang === 'ar' ? 'text-right' : ''}`}
                                                dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                                                placeholder={activeLang === 'ar' ? 'العنوان بالتفصيل' : 'Full Address'}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-semibold text-ui-muted block mb-3">Phone Numbers</label>
                                                <div className="relative">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-ui-primary">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={formData.phone_numbers}
                                                        onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all font-mono"
                                                        placeholder="+1 234 567 8900"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-ui-muted block mb-3">Maps URL</label>
                                                <div className="relative">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-ui-primary">
                                                        <Map className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={formData.map_url}
                                                        onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all"
                                                        placeholder="Google Maps link"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 flex gap-3 sm:gap-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-8 border-t border-ui-line bg-ui-bg">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-5 sm:px-8 py-4 bg-ui-subtle text-ui-muted rounded-control hover:text-ui-ink hover:bg-ui-subtle transition-all text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    {!isViewer && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 px-5 sm:px-8 py-4 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-xs transition-all flex items-center justify-center gap-3 group"
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
