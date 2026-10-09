"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Trash2, UserPlus } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";

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

const ROLE_INFO: Record<Role, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Everything, including settings, billing and the team." },
  editor: { label: "Editor", description: "Dishes, categories, hours, FAQs and publishing. Not settings, billing or the team." },
  viewer: { label: "Viewer", description: "Can look at everything but can't change anything." },
};

function TeamPageContent() {
  const { slug, fetchWithAuth } = useCatalogAdmin();
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

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/team`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMembers(data.members);
      setCanManage(data.can_manage);
      setError(null);
    } catch {
      setError("Could not load your team. Check your connection and reload.");
    } finally {
      setLoading(false);
    }
  }, [slug, fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (key: string, url: string, init: RequestInit) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetchWithAuth(url, { ...init, headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = await call("add", `/api/c/${slug}/admin/team`, { method: "POST", body: JSON.stringify(form) });
    if (data) {
      setCredentials({ email: data.email, password: data.password });
      setCopied(false);
      setForm({ name: "", email: "", role: "editor" });
      load();
    }
  };

  const changeRole = async (member: Member, role: Role) => {
    if (await call(member.id, `/api/c/${slug}/admin/team/${member.id}`, { method: "PATCH", body: JSON.stringify({ role }) })) load();
  };

  const toggleActive = async (member: Member) => {
    if (await call(member.id, `/api/c/${slug}/admin/team/${member.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !member.is_active }) })) load();
  };

  const resetPassword = async (member: Member) => {
    const data = await call(member.id, `/api/c/${slug}/admin/team/${member.id}`, { method: "PATCH", body: JSON.stringify({ reset_password: true }) });
    if (data?.password) {
      setCredentials({ email: member.email, password: data.password });
      setCopied(false);
    }
  };

  const remove = async (member: Member) => {
    setConfirmRemove(null);
    if (await call(member.id, `/api/c/${slug}/admin/team/${member.id}`, { method: "DELETE" })) load();
  };

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${slug}/admin/login` : "";
  const copyCredentials = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(`${loginUrl}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <CatalogAdminHeader title="Team" />
      <CatalogAdminContent>
        <div className="mx-auto max-w-3xl space-y-6">
          {error && <p role="alert" className="rounded-control border border-ui-danger bg-ui-surface px-4 py-3 text-sm text-ui-danger">{error}</p>}

          {credentials && (
            <section aria-labelledby="new-password" className="rounded-panel border border-ui-primary bg-ui-surface p-5">
              <h2 id="new-password" className="font-semibold">Send these details to {credentials.email}</h2>
              <p className="mt-1 text-sm text-ui-muted">This password is shown only once. Send it privately, for example on WhatsApp.</p>
              <dl className="mt-3 space-y-1 rounded-control bg-ui-subtle p-3 text-sm">
                <div><dt className="inline font-semibold">Sign in at: </dt><dd className="inline break-all"><bdi>{loginUrl}</bdi></dd></div>
                <div><dt className="inline font-semibold">Email: </dt><dd className="inline"><bdi>{credentials.email}</bdi></dd></div>
                <div><dt className="inline font-semibold">Password: </dt><dd className="inline font-mono"><bdi>{credentials.password}</bdi></dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={copyCredentials} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover">
                  <Copy className="h-4 w-4" aria-hidden />
                  {copied ? "Copied" : "Copy details"}
                </button>
                <button type="button" onClick={() => setCredentials(null)} className="min-h-11 rounded-control border border-ui-input px-4 text-sm font-semibold hover:bg-ui-subtle">
                  Done
                </button>
              </div>
            </section>
          )}

          {/* Members */}
          <section aria-labelledby="members" className="rounded-panel border border-ui-line bg-ui-surface p-5">
            <h2 id="members" className="text-lg font-semibold">People with access</h2>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-ui-muted" aria-label="Loading" /></div>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--ui-line)]">
                {members.map((member) => (
                  <li key={member.id} className="space-y-3 py-4">
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {member.name || member.email}
                          {member.is_you && <span className="ms-2 text-sm font-normal text-ui-muted">(you)</span>}
                          {!member.is_active && <span className="ms-2 rounded bg-ui-subtle px-1.5 text-xs font-semibold text-ui-danger">No access</span>}
                        </p>
                        <p className="break-all text-sm text-ui-muted"><bdi>{member.email}</bdi></p>
                      </div>
                      {(!canManage || member.role === "owner") && (
                        <span className="rounded-control bg-ui-subtle px-2.5 py-1 text-sm font-semibold">{ROLE_INFO[member.role].label}</span>
                      )}
                    </div>
                    {canManage && member.role !== "owner" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`role-${member.id}`} className="sr-only">Role for {member.name || member.email}</label>
                        <select
                          id={`role-${member.id}`}
                          value={member.role}
                          disabled={busy !== null}
                          onChange={(e) => changeRole(member, e.target.value as Role)}
                          className="min-h-11 rounded-control border border-ui-input bg-ui-bg px-3 text-sm font-semibold"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button type="button" onClick={() => toggleActive(member)} disabled={busy !== null} className="min-h-11 rounded-control border border-ui-input px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50">
                          {member.is_active ? "Pause access" : "Give access back"}
                        </button>
                        <button type="button" onClick={() => resetPassword(member)} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50">
                          <KeyRound className="h-4 w-4" aria-hidden />
                          New password
                        </button>
                        <button type="button" onClick={() => setConfirmRemove(member)} disabled={busy !== null} aria-label={`Remove ${member.name || member.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm font-semibold text-ui-danger hover:bg-ui-subtle disabled:opacity-50">
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Remove
                        </button>
                        {busy === member.id && <Loader2 className="h-4 w-4 animate-spin text-ui-muted" aria-label="Saving" />}
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
              <h2 id="add-member" className="text-lg font-semibold">Add someone</h2>
              <form onSubmit={addMember} className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="member-name" className="mb-1 block text-sm font-semibold">Name</label>
                  <input id="member-name" required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                </div>
                <div>
                  <label htmlFor="member-email" className="mb-1 block text-sm font-semibold">Email</label>
                  <input id="member-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                </div>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1 text-sm font-semibold">Role</legend>
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
                  Add and create a password
                </button>
              </form>
            </section>
          ) : (
            !loading && <p className="text-sm text-ui-muted">Only the owner can add people or change roles.</p>
          )}

          <section aria-labelledby="roles" className="rounded-panel border border-ui-line bg-ui-surface p-5">
            <h2 id="roles" className="font-semibold">What each role can do</h2>
            <dl className="mt-2 space-y-2 text-sm">
              {(Object.keys(ROLE_INFO) as Role[]).map((role) => (
                <div key={role}>
                  <dt className="inline font-semibold">{ROLE_INFO[role].label}: </dt>
                  <dd className="inline text-ui-muted">{ROLE_INFO[role].description}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {confirmRemove && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setConfirmRemove(null)}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="remove-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-panel bg-ui-surface p-5">
              <h2 id="remove-title" className="text-lg font-semibold">Remove {confirmRemove.name || confirmRemove.email}?</h2>
              <p className="mt-2 text-ui-muted">They won&rsquo;t be able to sign in any more. You can add them again later.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" autoFocus onClick={() => setConfirmRemove(null)} className="min-h-12 flex-1 rounded-control border border-ui-input px-4 font-semibold hover:bg-ui-subtle">Cancel</button>
                <button type="button" onClick={() => remove(confirmRemove)} className="min-h-12 flex-1 rounded-control bg-ui-danger px-4 font-semibold text-white">Remove</button>
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
