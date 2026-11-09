"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image that disappears quietly if the photo fails to load (a deleted upload or a dead
 * link pasted by the owner), leaving the container's neutral background instead of a
 * broken-image icon.
 */
export function MenuImage(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through by callers
  return <Image {...props} onError={() => setFailed(true)} />;
}

/**
 * How eagerly a menu photo loads: "lcp" for the one photo that is likely the largest thing on the
 * first screen (preloaded at high priority), true for other photos on the first screen (loaded
 * straight away, without competing with it), otherwise lazily as they scroll into view.
 */
export type ImagePriority = boolean | "lcp";

export function imageLoading(priority?: ImagePriority): Partial<ImageProps> {
  if (priority === "lcp") return { preload: true, fetchPriority: "high" };
  return priority ? { loading: "eager" } : {};
}
