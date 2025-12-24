import { useState, useEffect, useRef } from "react";

/**
 * Hook to preload images and track loading state
 */
export function useImagePreloader(imageUrls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const previousUrlsRef = useRef<string>("");

  useEffect(() => {
    // Create a stable string representation of the URLs for comparison
    const urlsKey = JSON.stringify([...imageUrls].sort());
    
    // Skip if URLs haven't actually changed (content-wise)
    if (previousUrlsRef.current === urlsKey) {
      return;
    }
    
    previousUrlsRef.current = urlsKey;

    if (imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const loaded = new Set<string>();
    const errors = new Set<string>();

    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (!cancelled) {
            loaded.add(url);
            resolve();
          }
        };
        img.onerror = () => {
          if (!cancelled) {
            errors.add(url);
            // Still resolve to not block the app if an image fails
            resolve();
          }
        };
        img.src = url;
      });
    };

    const loadAllImages = async () => {
      try {
        await Promise.all(imageUrls.map(loadImage));
        if (!cancelled) {
          setLoadedImages(loaded);
          setIsLoading(false);
          setHasError(errors.size > 0);
        }
      } catch (error) {
        if (!cancelled) {
          setIsLoading(false);
          setHasError(true);
        }
      }
    };

    loadAllImages();

    return () => {
      cancelled = true;
    };
  }, [imageUrls]);

  return { isLoading, hasError, loadedImages };
}

