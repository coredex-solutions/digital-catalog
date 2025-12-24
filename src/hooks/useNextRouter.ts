"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

// Hook to provide Next.js router interface compatible with react-router-dom's useNavigate
export function useNextRouter() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      // Trigger loading bar immediately before navigation
      if (
        typeof window !== "undefined" &&
        (window as any).__startTopLoadingBar
      ) {
        (window as any).__startTopLoadingBar();
      }

      if (typeof to === "number") {
        // Go back/forward
        if (to === -1) {
          router.back();
        } else {
          router.forward();
        }
      } else {
        if (options?.replace) {
          router.replace(to);
        } else {
          router.push(to);
        }
      }
    },
    [router]
  );

  return { navigate, pathname };
}
