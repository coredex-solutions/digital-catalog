"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CatalogLoginRedirect() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    // Redirect to the actual admin login location
    router.replace(`/c/${slug}/admin/login`);
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border border-primary/20 animate-ping absolute inset-0" />
        <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
      </div>
      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">
        Establishing Secure Uplink...
      </p>
    </div>
  );
}
