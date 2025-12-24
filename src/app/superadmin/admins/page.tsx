"use client";

import { useEffect, useState } from "react";
import { SuperAdminShell } from "../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../_components/SuperAdminSidebar";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Mail,
  Calendar,
  Key,
} from "lucide-react";

interface CatalogAdmin {
  id: string;
  catalog_id: string;
  catalog_name: string;
  catalog_slug: string;
  username: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function CatalogAdminsPage() {
  const [admins, setAdmins] = useState<CatalogAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch("/api/superadmin/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.catalog_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Catalog Admins">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-64"
            />
          </div>
        </div>
      </SuperAdminHeader>

      <SuperAdminContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Admin
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Catalog
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Created
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Last Login
                  </th>
                  <th className="text-right px-6 py-4 text-slate-400 font-medium text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      {searchQuery
                        ? "No admins match your search"
                        : "No catalog admins found"}
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {admin.username}
                            </p>
                            {admin.email && (
                              <p className="text-sm text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {admin.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{admin.catalog_name}</span>
                        <p className="text-sm text-slate-500">
                          /{admin.catalog_slug}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            admin.is_active
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.is_active ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(admin.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDate(admin.last_login)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}
