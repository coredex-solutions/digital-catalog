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
      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_-3px_rgb(16,185,129)]">
        Active
      </span>
    );
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Catalogs">
        <Link
          href="/superadmin/catalogs/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl hover:scale-105 transition-all font-bold text-sm shadow-lg shadow-white/10"
        >
          <Plus className="w-4 h-4" />
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
              className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "suspended"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize uppercase tracking-wider ${
                  filter === f
                    ? "bg-white text-black shadow-lg"
                    : "glass text-white/40 hover:text-white border border-white/5 hover:bg-white/5"
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
              <div key={i} className="glass rounded-3xl p-6 animate-pulse border border-white/5">
                <div className="h-6 bg-white/10 rounded-full w-3/4 mb-3" />
                <div className="h-4 bg-white/5 rounded-full w-1/2" />
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
                  className="glass rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-white group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-primary transition-colors">{catalog.name}</h3>
                          <p className="text-xs text-white/40 font-mono">/{catalog.slug}</p>
                        </div>
                      </div>
                      {getStatusBadge(catalog)}
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5">
                      <div className="text-center">
                        <p className="text-xl font-bold text-white tracking-tighter">{catalog.category_count || 0}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Categories</p>
                      </div>
                      <div className="text-center border-x border-white/5">
                        <p className="text-xl font-bold text-white tracking-tighter">{catalog.item_count || 0}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Products</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-white tracking-tighter">{catalog.total_views || 0}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Views</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 text-xs font-medium">
                      <span className="text-white/40 capitalize bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {catalog.subscription_type?.replace("_", " ") || "No subscription"}
                      </span>
                      {catalog.expires_at && (
                        <span className="text-white/30">
                          Expires: {new Date(catalog.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex border-t border-white/5">
                    <Link
                      href={`/c/${catalog.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-white/40 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm group/btn"
                    >
                      <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      <span>View</span>
                    </Link>
                    <Link
                      href={`/superadmin/catalogs/${catalog.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-white/40 hover:text-primary hover:bg-primary/5 transition-colors border-l border-white/5 font-medium text-sm group/btn"
                    >
                      <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      <span>Manage</span>
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

