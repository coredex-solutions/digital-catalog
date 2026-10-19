"use client";

import { useEffect, useState } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { useAdminLang, useCopy } from "../_lib/i18n";
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

const en = {
    addBranch: "Add branch",
    emptyTitle: "No branches yet",
    addFirst: "Add your first branch",
    visible: "Visible",
    hidden: "Hidden",
    dragToReorder: (name: string) => `Drag to reorder ${name}`,
    edit: (name: string) => `Edit ${name}`,
    delete: (name: string) => `Delete ${name}`,
    editTitle: "Edit branch",
    addTitle: "Add a branch",
    close: "Close",
    contentLanguage: "Language of the text",
    languages: { en: "English", ar: "العربية" } as Record<"en" | "ar", string>,
    inLanguage: { en: "in English", ar: "in Arabic" } as Record<"en" | "ar", string>,
    branchName: "Branch name",
    address: "Address",
    phoneNumbers: "Phone numbers",
    mapsUrl: "Google Maps link",
    mapsPlaceholder: "Paste the Google Maps link",
    cancel: "Cancel",
    saveBranch: "Save changes",
    createBranch: "Add branch",
    nameRequired: "Please enter a branch name.",
    saveFailed: "Couldn't save the branch. Please try again.",
    deleteConfirm: (name: string) => `Delete the branch "${name}"? This can't be undone.`,
    deleteFailed: "Couldn't delete the branch. Please try again.",
    unnamed: "this branch",
};
const ar: typeof en = {
    addBranch: "أضف فرعاً",
    emptyTitle: "لا توجد فروع بعد",
    addFirst: "أضف أول فرع",
    visible: "ظاهر",
    hidden: "مخفي",
    dragToReorder: (name) => `اسحب لتغيير ترتيب ${name}`,
    edit: (name) => `تعديل ${name}`,
    delete: (name) => `حذف ${name}`,
    editTitle: "تعديل الفرع",
    addTitle: "إضافة فرع",
    close: "إغلاق",
    contentLanguage: "لغة النص",
    languages: { en: "English", ar: "العربية" },
    inLanguage: { en: "بالإنجليزية", ar: "بالعربية" },
    branchName: "اسم الفرع",
    address: "العنوان",
    phoneNumbers: "أرقام الهاتف",
    mapsUrl: "رابط خرائط Google",
    mapsPlaceholder: "الصق رابط خرائط Google",
    cancel: "إلغاء",
    saveBranch: "حفظ التعديلات",
    createBranch: "إضافة الفرع",
    nameRequired: "يُرجى إدخال اسم الفرع.",
    saveFailed: "تعذّر حفظ الفرع. يُرجى المحاولة مرة أخرى.",
    deleteConfirm: (name) => `حذف الفرع "${name}"؟ لا يمكن التراجع عن ذلك.`,
    deleteFailed: "تعذّر حذف الفرع. يُرجى المحاولة مرة أخرى.",
    unnamed: "هذا الفرع",
};

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
    const lang = useAdminLang();
    const t = useCopy({ en, ar });
    /** The owner's own text, in the dashboard language when they filled it in */
    const pick = (enText: string | null | undefined, arText: string | null | undefined) =>
        (lang === "ar" ? arText || enText : enText || arText) || "";
    const branchName = (branch: Branch) => pick(branch.name_en, branch.name_ar) || t.unnamed;

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
            const res = await fetchWithAuth(`/api/c/${slug}/admin/branches/`);
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
            alert(t.nameRequired);
            return;
        }

        setSaving(true);
        try {
            const method = editingBranch ? "PUT" : "POST";
            const body = editingBranch
                ? { ...formData, id: editingBranch.id }
                : formData;

            const res = await fetchWithAuth(`/api/c/${slug}/admin/branches/`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await fetchBranches();
                setShowModal(false);
            } else {
                const err = await res.json();
                alert(err.error || t.saveFailed);
            }
        } catch (error) {
            console.error("Failed to save branch:", error);
            alert(t.saveFailed);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (branch: Branch) => {
        if (isViewer) return;
        if (!confirm(t.deleteConfirm(branchName(branch)))) return;

        try {
            const res = await fetchWithAuth(`/api/c/${slug}/admin/branches/?id=${branch.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                await fetchBranches();
            } else {
                alert(t.deleteFailed);
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
            await fetchWithAuth(`/api/c/${slug}/admin/branches/`, {
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
            <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].branches}>
                <button
                    onClick={openAddModal}
                    disabled={isViewer}
                    className="flex items-center gap-2 px-6 py-3 bg-ui-primary text-ui-primary-fg font-semibold text-xs rounded-control transition-all shadow-lg disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" aria-hidden />
                    {t.addBranch}
                </button>
            </CatalogAdminHeader>

            <CatalogAdminContent>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-ui-primary" aria-hidden />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="glass-card rounded-panel p-8 sm:p-20 text-center border border-ui-line">
                        <MapPin className="w-16 h-16 text-ui-line mx-auto mb-6" aria-hidden />
                        <p className="text-sm font-semibold text-ui-muted mb-8">{t.emptyTitle}</p>
                        {!isViewer && (
                            <button
                                onClick={openAddModal}
                                className="text-xs font-semibold text-ui-primary transition-all"
                            >
                                {t.addFirst}
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
                                        aria-label={t.dragToReorder(branchName(branch))}
                                    >
                                        <GripVertical className="w-5 h-5" aria-hidden />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 dir="auto" className="text-xl font-semibold text-ui-heading group-hover:text-ui-primary transition-colors text-start">
                                                    {pick(branch.name_en, branch.name_ar)}
                                                </h3>
                                                {pick(branch.address_en, branch.address_ar) && (
                                                    <p className="text-xs font-semibold text-ui-muted mt-2 flex items-center gap-2">
                                                        <Map className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                                        <span dir="auto">{pick(branch.address_en, branch.address_ar)}</span>
                                                    </p>
                                                )}
                                                {branch.phone_numbers && (
                                                    <p className="text-xs font-semibold text-ui-muted mt-2 flex items-center gap-2 font-mono">
                                                        <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                                        <span dir="ltr">{branch.phone_numbers}</span>
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
                                                    {branch.is_active === 1 ? t.visible : t.hidden}
                                                </span>
                                                {!isViewer && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(branch)}
                                                            aria-label={t.edit(branchName(branch))}
                                                            className="w-11 h-11 bg-ui-subtle rounded-xl hover:bg-ui-subtle transition-all flex items-center justify-center text-ui-muted hover:text-ui-ink"
                                                        >
                                                            <Pencil className="w-4 h-4" aria-hidden />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(branch)}
                                                            aria-label={t.delete(branchName(branch))}
                                                            className="w-11 h-11 bg-ui-subtle rounded-xl hover:bg-ui-subtle transition-all flex items-center justify-center text-ui-primary hover:text-ui-primary"
                                                        >
                                                            <Trash2 className="w-4 h-4" aria-hidden />
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
                                        <h2 className="text-xl font-semibold text-ui-heading whitespace-nowrap">
                                            {editingBranch ? t.editTitle : t.addTitle}
                                        </h2>
                                        <div className="h-0.5 w-8 bg-ui-primary mt-2 rounded-full opacity-50" aria-hidden />
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-11 h-11 shrink-0 bg-ui-subtle rounded-xl flex items-center justify-center text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-all"
                                        aria-label={t.close}
                                    >
                                        <X className="w-5 h-5" aria-hidden />
                                    </button>
                                </div>

                                <div className="p-5 sm:p-8 space-y-8 flex-1 min-h-0 sm:max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Language of the text being edited */}
                                    <div role="group" aria-label={t.contentLanguage} className="flex p-1.5 bg-ui-bg border border-ui-line rounded-control">
                                        {langTabs.map((tabLang) => (
                                            <button
                                                key={tabLang}
                                                type="button"
                                                lang={tabLang}
                                                aria-pressed={activeLang === tabLang}
                                                onClick={() => setActiveLang(tabLang)}
                                                className={`flex-1 py-3 text-xs font-semibold transition-all rounded-xl ${activeLang === tabLang
                                                    ? "bg-ui-primary text-ui-primary-fg shadow-lg"
                                                    : "text-ui-muted hover:text-ui-ink"
                                                    }`}
                                            >
                                                {t.languages[tabLang]}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label htmlFor="branch-name" className="text-xs font-semibold text-ui-muted block mb-3">{t.branchName} ({t.inLanguage[activeLang]})</label>
                                            <input
                                                id="branch-name"
                                                type="text"
                                                lang={activeLang}
                                                value={formData[`name_${activeLang}` as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [`name_${activeLang}`]: e.target.value })}
                                                className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-start"
                                                dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                                                placeholder={activeLang === 'ar' ? 'اسم الفرع' : 'Branch name'}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="branch-address" className="text-xs font-semibold text-ui-muted block mb-3">{t.address} ({t.inLanguage[activeLang]})</label>
                                            <textarea
                                                id="branch-address"
                                                lang={activeLang}
                                                value={formData[`address_${activeLang}` as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [`address_${activeLang}`]: e.target.value })}
                                                rows={3}
                                                className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all resize-none text-start"
                                                dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                                                placeholder={activeLang === 'ar' ? 'العنوان بالتفصيل' : 'Full address'}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="branch-phones" className="text-xs font-semibold text-ui-muted block mb-3">{t.phoneNumbers}</label>
                                                {/* Numbers and links read left to right in both languages, icon included */}
                                                <div className="relative" dir="ltr">
                                                    <div className="absolute start-6 top-1/2 -translate-y-1/2 text-ui-primary">
                                                        <Phone className="w-4 h-4" aria-hidden />
                                                    </div>
                                                    <input
                                                        id="branch-phones"
                                                        type="text"
                                                        value={formData.phone_numbers}
                                                        onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                                                        className="w-full ps-14 pe-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all font-mono"
                                                        placeholder="+1 234 567 8900"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="branch-map" className="text-xs font-semibold text-ui-muted block mb-3">{t.mapsUrl}</label>
                                                <div className="relative" dir="ltr">
                                                    <div className="absolute start-6 top-1/2 -translate-y-1/2 text-ui-primary">
                                                        <Map className="w-4 h-4" aria-hidden />
                                                    </div>
                                                    <input
                                                        id="branch-map"
                                                        type="url"
                                                        value={formData.map_url}
                                                        onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                                                        className="w-full ps-14 pe-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all"
                                                        placeholder={t.mapsPlaceholder}
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
                                        {t.cancel}
                                    </button>
                                    {!isViewer && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 px-5 sm:px-8 py-4 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-xs transition-all flex items-center justify-center gap-3 group"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                                            ) : (
                                                <Check className="w-4 h-4 group-hover:scale-125 transition-transform" aria-hidden />
                                            )}
                                            {editingBranch ? t.saveBranch : t.createBranch}
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
