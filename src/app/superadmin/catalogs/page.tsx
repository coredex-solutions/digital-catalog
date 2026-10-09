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
        <span className="text-xs px-2 py-1 rounded-full bg-ui-bg text-ui-danger border border-ui-danger">
          Suspended
        </span>
      );
    }
    if (!catalog.is_active) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-ui-bg text-ui-muted border border-ui-line">
          Inactive
        </span>
      );
    }
    return (
      <span className="text-xs font-bold px-2 py-1 rounded-full bg-ui-subtle text-ui-success border border-ui-line">
        Active
      </span>
    );
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Catalogs">
        <Link
          href="/superadmin/catalogs/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover rounded-control transition-colors font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          New Catalog
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ui-muted" />
            <input
              type="text"
              placeholder="Search catalogs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "suspended"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-control text-sm font-semibold transition-all capitalize ${
                  filter === f
                    ? "bg-ui-primary text-ui-primary-fg"
                    : "bg-ui-surface text-ui-muted hover:text-ui-ink border border-ui-line hover:bg-ui-subtle"
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
              <div key={i} className="glass rounded-panel p-6 border border-ui-line">
                <div className="h-6 bg-ui-subtle rounded-full w-3/4 mb-3" />
                <div className="h-4 bg-ui-subtle rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-ui-input mx-auto mb-4" />
            <p className="text-ui-muted">
              {search || filter !== "all" ? "No catalogs match your filters" : "No catalogs yet"}
            </p>
            {!search && filter === "all" && (
              <Link
                href="/superadmin/catalogs/new"
                className="inline-flex items-center gap-2 mt-4 text-ui-primary hover:text-ui-primary-hover"
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
                  className="glass rounded-panel overflow-hidden border border-ui-line hover:border-ui-input transition-all duration-300 group hover:shadow-md"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-control bg-ui-subtle flex items-center justify-center border border-ui-line">
                          <Icon className="w-6 h-6 text-ui-ink group-hover:text-ui-primary transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-bold text-ui-ink text-lg group-hover:text-ui-primary transition-colors">{catalog.name}</h3>
                          <p className="text-xs text-ui-muted font-mono">/{catalog.slug}</p>
                        </div>
                      </div>
                      {getStatusBadge(catalog)}
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-6 border-y border-ui-line">
                      <div className="text-center">
                        <p className="text-xl font-bold text-ui-ink">{catalog.category_count || 0}</p>
                        <p className="text-xs text-ui-muted font-bold">Categories</p>
                      </div>
                      <div className="text-center border-x border-ui-line">
                        <p className="text-xl font-bold text-ui-ink">{catalog.item_count || 0}</p>
                        <p className="text-xs text-ui-muted font-bold">Products</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-ui-ink">{catalog.total_views || 0}</p>
                        <p className="text-xs text-ui-muted font-bold">Views</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 text-xs font-medium">
                      <span className="text-ui-muted capitalize bg-ui-subtle px-3 py-1 rounded-full border border-ui-line">
                        {catalog.subscription_type?.replace("_", " ") || "No subscription"}
                      </span>
                      {catalog.expires_at && (
                        <span className="text-ui-muted">
                          Expires: {new Date(catalog.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex border-t border-ui-line">
                    <Link
                      href={`/c/${catalog.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-colors font-medium text-sm group/btn"
                    >
                      <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      <span>View</span>
                    </Link>
                    <Link
                      href={`/superadmin/catalogs/${catalog.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-ui-muted hover:text-ui-primary hover:bg-ui-subtle transition-colors border-l border-ui-line font-medium text-sm group/btn"
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

