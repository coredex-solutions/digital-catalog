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
