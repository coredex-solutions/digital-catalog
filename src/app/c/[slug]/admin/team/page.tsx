"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Trash2, UserPlus } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { useAdminLang, useCopy } from "../_lib/i18n";

type Role = "owner" | "editor" | "viewer";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  last_login: string | null;
  is_you: boolean;
}

const en = {
  roles: {
    owner: { label: "Owner", description: "Everything, including settings, billing and the team." },
    editor: { label: "Editor", description: "Dishes, categories, hours, FAQs and publishing. Not settings, billing or the team." },
    viewer: { label: "Viewer", description: "Can look at everything but can't change anything." },
  } as Record<Role, { label: string; description: string }>,
  loadError: "Could not load your team. Check your connection and reload.",
  genericError: "Something went wrong. Please try again.",
  /** What "Copy details" puts on the clipboard */
  clipboard: (url: string, email: string, password: string) => `${url}\nEmail: ${email}\nPassword: ${password}`,
  sendDetailsTo: (email: React.ReactNode): React.ReactNode => <>Send these details to {email}</>,
  shownOnce: "This password is shown only once. Send it privately, for example on WhatsApp.",
  signInAt: "Sign in at: ",
  emailLabel: "Email: ",
  passwordLabel: "Password: ",
  copied: "Copied",
  copyDetails: "Copy details",
  done: "Done",
  peopleWithAccess: "People with access",
  loading: "Loading…",
  you: "(you)",
  noAccess: "No access",
  roleFor: (name: string) => `Role for ${name}`,
  pauseAccess: "Pause access",
  giveAccessBack: "Give access back",
  newPassword: "New password",
  removeNamed: (name: string) => `Remove ${name}`,
  remove: "Remove",
  saving: "Saving…",
  addSomeone: "Add someone",
  name: "Name",
  email: "Email",
  role: "Role",
  addAndCreate: "Add and create a password",
  ownerOnly: "Only the owner can add people or change roles.",
  whatEachRole: "What each role can do",
  roleSeparator: ": ",
  removeTitle: (name: string) => `Remove ${name}?`,
  removeBody: "They won’t be able to sign in any more. You can add them again later.",
  cancel: "Cancel",
};
const ar: typeof en = {
  roles: {
    owner: { label: "صاحب الحساب", description: "كل شيء، بما في ذلك الإعدادات والباقة والفريق." },
    editor: { label: "محرّر", description: "الأطباق والأقسام وساعات العمل والأسئلة الشائعة والنشر. دون الإعدادات والباقة والفريق." },
    viewer: { label: "مشاهد", description: "يرى كل شيء لكن لا يستطيع تغيير أي شيء." },
  },
  loadError: "تعذّر تحميل فريقك. تحقّق من اتصالك ثم أعد تحميل الصفحة.",
  genericError: "حدث خطأ. يُرجى المحاولة مرة أخرى.",
  clipboard: (url, email, password) => `${url}\nالبريد الإلكتروني: ${email}\nكلمة المرور: ${password}`,
  sendDetailsTo: (email) => <>أرسل هذه البيانات إلى {email}</>,
  shownOnce: "تظهر كلمة المرور هذه مرة واحدة فقط. أرسلها بشكل خاص، على واتساب مثلاً.",
  signInAt: "رابط تسجيل الدخول: ",
  emailLabel: "البريد الإلكتروني: ",
  passwordLabel: "كلمة المرور: ",
  copied: "تم النسخ",
  copyDetails: "نسخ البيانات",
  done: "تم",
  peopleWithAccess: "الأشخاص الذين يمكنهم الدخول",
  loading: "جارٍ التحميل…",
  you: "(أنت)",
  noAccess: "الدخول موقوف",
  roleFor: (name) => `دور ${name}`,
  pauseAccess: "إيقاف الدخول مؤقتاً",
  giveAccessBack: "إعادة السماح بالدخول",
  newPassword: "كلمة مرور جديدة",
  removeNamed: (name) => `إزالة ${name}`,
  remove: "إزالة",
  saving: "جارٍ الحفظ…",
  addSomeone: "أضف شخصاً",
  name: "الاسم",
  email: "البريد الإلكتروني",
  role: "الدور",
  addAndCreate: "أضفه وأنشئ كلمة مرور",
  ownerOnly: "صاحب الحساب وحده يستطيع إضافة أشخاص أو تغيير أدوارهم.",
  whatEachRole: "صلاحيات كل دور",
  roleSeparator: ": ",
  removeTitle: (name) => `إزالة ${name}؟`,
  removeBody: "لن يتمكن من تسجيل الدخول بعد الآن. يمكنك إضافته مجدداً لاحقاً.",
  cancel: "إلغاء",
};

function TeamPageContent() {
  const { slug, fetchWithAuth } = useCatalogAdmin();
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const ROLE_INFO = t.roles;
  const [members, setMembers] = useState<Member[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "editor" as Exclude<Role, "owner"> });
  const [busy, setBusy] = useState<string | null>(null);
  // A new password is shown once, for the owner to pass on
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const loadError = t.loadError;
  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/team/`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMembers(data.members);
      setCanManage(data.can_manage);
      setError(null);
    } catch {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [slug, fetchWithAuth, loadError]);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (key: string, url: string, init: RequestInit) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetchWithAuth(url, { ...init, headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.genericError);
      return data;
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t.genericError);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = await call("add", `/api/c/${slug}/admin/team/`, { method: "POST", body: JSON.stringify(form) });
    if (data) {
      setCredentials({ email: data.email, password: data.password });
      setCopied(false);
      setForm({ name: "", email: "", role: "editor" });
      load();
    }
  };

  const changeRole = async (member: Member, role: Role) => {
    if (await call(member.id, `/api/c/${slug}/admin/team/${member.id}/`, { method: "PATCH", body: JSON.stringify({ role }) })) load();
  };

  const toggleActive = async (member: Member) => {
    if (await call(member.id, `/api/c/${slug}/admin/team/${member.id}/`, { method: "PATCH", body: JSON.stringify({ is_active: !member.is_active }) })) load();
  };

  const resetPassword = async (member: Member) => {
    const data = await call(member.id, `/api/c/${slug}/admin/team/${member.id}/`, { method: "PATCH", body: JSON.stringify({ reset_password: true }) });
    if (data?.password) {
      setCredentials({ email: member.email, password: data.password });
      setCopied(false);
    }
  };

  const remove = async (member: Member) => {
    setConfirmRemove(null);
    if (await call(member.id, `/api/c/${slug}/admin/team/${member.id}/`, { method: "DELETE" })) load();
  };

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login/?r=${slug}` : "";
  const copyCredentials = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(t.clipboard(loginUrl, credentials.email, credentials.password));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].team} />
      <CatalogAdminContent>
        <div className="mx-auto max-w-3xl space-y-6">
          {error && <p role="alert" className="rounded-control border border-ui-danger bg-ui-surface px-4 py-3 text-sm text-ui-danger">{error}</p>}

          {credentials && (
            <section aria-labelledby="new-password" className="rounded-panel border border-ui-primary bg-ui-surface p-5">
              <h2 id="new-password" className="font-semibold">{t.sendDetailsTo(<bdi dir="ltr">{credentials.email}</bdi>)}</h2>
              <p className="mt-1 text-sm text-ui-muted">{t.shownOnce}</p>
              <dl className="mt-3 space-y-1 rounded-control bg-ui-subtle p-3 text-sm">
                <div><dt className="inline font-semibold">{t.signInAt}</dt><dd className="inline break-all"><bdi dir="ltr">{loginUrl}</bdi></dd></div>
                <div><dt className="inline font-semibold">{t.emailLabel}</dt><dd className="inline"><bdi dir="ltr">{credentials.email}</bdi></dd></div>
                <div><dt className="inline font-semibold">{t.passwordLabel}</dt><dd className="inline font-mono"><bdi dir="ltr">{credentials.password}</bdi></dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={copyCredentials} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover">
                  <Copy className="h-4 w-4" aria-hidden />
                  {copied ? t.copied : t.copyDetails}
                </button>
                <button type="button" onClick={() => setCredentials(null)} className="min-h-11 rounded-control border border-ui-input px-4 text-sm font-semibold hover:bg-ui-subtle">
                  {t.done}
                </button>
              </div>
            </section>
          )}

          {/* Members */}
          <section aria-labelledby="members" className="rounded-panel border border-ui-line bg-ui-surface p-5">
            <h2 id="members" className="text-lg font-semibold">{t.peopleWithAccess}</h2>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-ui-muted" aria-label={t.loading} /></div>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--ui-line)]">
                {members.map((member) => (
                  <li key={member.id} className="space-y-3 py-4">
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          <bdi>{member.name || member.email}</bdi>
                          {member.is_you && <span className="ms-2 text-sm font-normal text-ui-muted">{t.you}</span>}
                          {!member.is_active && <span className="ms-2 rounded bg-ui-subtle px-1.5 text-xs font-semibold text-ui-danger">{t.noAccess}</span>}
                        </p>
                        <p className="break-all text-sm text-ui-muted"><bdi dir="ltr">{member.email}</bdi></p>
                      </div>
                      {(!canManage || member.role === "owner") && (
                        <span className="rounded-control bg-ui-subtle px-2.5 py-1 text-sm font-semibold">{ROLE_INFO[member.role].label}</span>
                      )}
                    </div>
                    {canManage && member.role !== "owner" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`role-${member.id}`} className="sr-only">{t.roleFor(member.name || member.email)}</label>
                        <select
                          id={`role-${member.id}`}
                          value={member.role}
                          disabled={busy !== null}
                          onChange={(e) => changeRole(member, e.target.value as Role)}
                          className="min-h-11 rounded-control border border-ui-input bg-ui-bg px-3 text-sm font-semibold"
                        >
                          <option value="editor">{ROLE_INFO.editor.label}</option>
                          <option value="viewer">{ROLE_INFO.viewer.label}</option>
                        </select>
                        <button type="button" onClick={() => toggleActive(member)} disabled={busy !== null} className="min-h-11 rounded-control border border-ui-input px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50">
                          {member.is_active ? t.pauseAccess : t.giveAccessBack}
                        </button>
                        <button type="button" onClick={() => resetPassword(member)} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50">
                          <KeyRound className="h-4 w-4" aria-hidden />
                          {t.newPassword}
                        </button>
                        <button type="button" onClick={() => setConfirmRemove(member)} disabled={busy !== null} aria-label={t.removeNamed(member.name || member.email)} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm font-semibold text-ui-danger hover:bg-ui-subtle disabled:opacity-50">
                          <Trash2 className="h-4 w-4" aria-hidden />
                          {t.remove}
                        </button>
                        {busy === member.id && <Loader2 className="h-4 w-4 animate-spin text-ui-muted" aria-label={t.saving} />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Add */}
          {canManage ? (
            <section aria-labelledby="add-member" className="rounded-panel border border-ui-line bg-ui-surface p-5">
              <h2 id="add-member" className="text-lg font-semibold">{t.addSomeone}</h2>
              <form onSubmit={addMember} className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="member-name" className="mb-1 block text-sm font-semibold">{t.name}</label>
                  <input id="member-name" dir="auto" required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                </div>
                <div>
                  <label htmlFor="member-email" className="mb-1 block text-sm font-semibold">{t.email}</label>
                  <input id="member-email" type="email" dir="ltr" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                </div>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1 text-sm font-semibold">{t.role}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(["editor", "viewer"] as const).map((role) => (
                      <label key={role} className={`flex min-h-11 cursor-pointer gap-3 rounded-control border p-3 ${form.role === role ? "border-ui-primary bg-ui-subtle" : "border-ui-input"}`}>
                        <input type="radio" name="member-role" value={role} checked={form.role === role} onChange={() => setForm({ ...form, role })} className="mt-1 h-4 w-4" />
                        <span>
                          <span className="block text-sm font-semibold">{ROLE_INFO[role].label}</span>
                          <span className="block text-xs text-ui-muted">{ROLE_INFO[role].description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button type="submit" disabled={busy !== null} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50 sm:col-span-2">
                  {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
                  {t.addAndCreate}
                </button>
              </form>
            </section>
          ) : (
            !loading && <p className="text-sm text-ui-muted">{t.ownerOnly}</p>
          )}

          <section aria-labelledby="roles" className="rounded-panel border border-ui-line bg-ui-surface p-5">
            <h2 id="roles" className="font-semibold">{t.whatEachRole}</h2>
            <dl className="mt-2 space-y-2 text-sm">
              {(Object.keys(ROLE_INFO) as Role[]).map((role) => (
                <div key={role}>
                  <dt className="inline font-semibold">{ROLE_INFO[role].label}{t.roleSeparator}</dt>
                  <dd className="inline text-ui-muted">{ROLE_INFO[role].description}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {confirmRemove && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setConfirmRemove(null)}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="remove-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-panel bg-ui-surface p-5">
              <h2 id="remove-title" className="text-lg font-semibold">{t.removeTitle(confirmRemove.name || confirmRemove.email)}</h2>
              <p className="mt-2 text-ui-muted">{t.removeBody}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" autoFocus onClick={() => setConfirmRemove(null)} className="min-h-12 flex-1 rounded-control border border-ui-input px-4 font-semibold hover:bg-ui-subtle">{t.cancel}</button>
                <button type="button" onClick={() => remove(confirmRemove)} className="min-h-12 flex-1 rounded-control bg-ui-danger px-4 font-semibold text-white">{t.remove}</button>
              </div>
            </div>
          </div>
        )}
      </CatalogAdminContent>
    </>
  );
}

export default function TeamPage() {
  return (
    <CatalogAdminShell>
      <TeamPageContent />
    </CatalogAdminShell>
  );
}
