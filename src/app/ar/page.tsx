import type { Metadata } from "next";
import { LandingPage, landingMetadata } from "../_landing/LandingPage";

export const metadata: Metadata = landingMetadata("ar");

// Arabic home page: always Arabic, whatever the browser asks for, so the address can be shared
export default function ArabicHome() {
  return <LandingPage lang="ar" />;
}
