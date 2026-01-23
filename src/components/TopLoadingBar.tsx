"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function TopLoadingBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for route changes via pathname
    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (isNavigating) {
      // Complete the navigation
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setIsNavigating(false);
      }, 150);
    }
  }, [pathname]);

  // Expose a global function to trigger loading
  useEffect(() => {
    const startLoading = () => {
      // Clear any existing timers
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setIsNavigating(true);
      setProgress(10);

      // Simulate smooth progress
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 90;
          }
          // Smooth acceleration: faster at start, slower near end
          const increment = prev < 30 ? 15 : prev < 60 ? 8 : prev < 80 ? 4 : 1;
          return Math.min(prev + increment, 90);
        });
      }, 50);
    };

    // Make it globally accessible
    (window as any).__startTopLoadingBar = startLoading;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      delete (window as any).__startTopLoadingBar;
    };
  }, []);

  if (progress === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 shadow-lg shadow-purple-500/50"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100 ? "width 0.15s ease-out" : "width 0.05s linear",
        }}
      />
    </div>
  );
}
