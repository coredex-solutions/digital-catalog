"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SuperAdminShell } from "../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../_components/SuperAdminSidebar";
import { 
  Plus, 
  Search, 
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  ShoppingBag,
  Coffee,
  Scissors,
  Package,
  Store
} from "lucide-react";

interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  business_type: string;
  is_active: number;
  is_suspended: number;
  created_at: string;
  subscription_type: string;
  expires_at: string | null;
  admin_count: number;
  category_count: number;
  item_count: number;
  total_views: number;
}

const businessTypeIcons: Record<string, any> = {
  restaurant: Coffee,
  retail: ShoppingBag,
  cafe: Coffee,
  salon: Scissors,
  bakery: Package,
  other: Store,
};

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");

  useEffect(() => {
    const fetchCatalogs = async () => {
      const token = localStorage.getItem("superadmin_token");
      if (!token) return;

      try {
        const res = await fetch("/api/superadmin/catalogs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setCatalogs(data.catalogs);
        }
      } catch (error) {
        console.error("Failed to fetch catalogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const filteredCatalogs = catalogs.filter((catalog) => {
    const matchesSearch = 
      catalog.name.toLowerCase().includes(search.toLowerCase()) ||
      catalog.slug.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "active" && catalog.is_active && !catalog.is_suspended) ||
      (filter === "suspended" && catalog.is_suspended);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (catalog: CatalogItem) => {
    if (catalog.is_suspended) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          Suspended
        </span>
      );
    }
    if (!catalog.is_active) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
          Inactive
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Catalogs">
        <Link
          href="/superadmin/catalogs/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          New Catalog
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalogs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "suspended"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
                  filter === f
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Catalogs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {search || filter !== "all" ? "No catalogs match your filters" : "No catalogs yet"}
            </p>
            {!search && filter === "all" && (
              <Link
                href="/superadmin/catalogs/new"
                className="inline-flex items-center gap-2 mt-4 text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="w-5 h-5" />
                Create your first catalog
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalogs.map((catalog) => {
              const Icon = businessTypeIcons[catalog.business_type] || Store;
              return (
                <div
                  key={catalog.id}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{catalog.name}</h3>
                          <p className="text-sm text-slate-400">/{catalog.slug}</p>
                        </div>
                      </div>
                      {getStatusBadge(catalog)}
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-700/50">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{catalog.category_count || 0}</p>
                        <p className="text-xs text-slate-500">Categories</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{catalog.item_count || 0}</p>
                        <p className="text-xs text-slate-500">Items</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{catalog.total_views || 0}</p>
                        <p className="text-xs text-slate-500">Views</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-slate-500 capitalize">
                        {catalog.subscription_type?.replace("_", " ") || "No subscription"}
                      </span>
                      {catalog.expires_at && (
                        <span className="text-slate-400">
                          Expires: {new Date(catalog.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex border-t border-slate-700/50">
                    <Link
                      href={`/c/${catalog.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">View</span>
                    </Link>
                    <Link
                      href={`/superadmin/catalogs/${catalog.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors border-l border-slate-700/50"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Manage</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}

