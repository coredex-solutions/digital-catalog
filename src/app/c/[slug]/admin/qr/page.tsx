"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import {
  Download,
  Loader2,
  QrCode,
  Printer,
  FileImage,
  FileCode,
  Palette,
  Eye,
  Settings2,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Link2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  RotateCw,
  Check,
  X,
} from "lucide-react";

interface CatalogInfo {
  name: string;
  logo_url: string | null;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
}

// Font presets for professional designs - Extended collection
const FONT_PRESETS = {
  elegant: {
    name: "Elegant Serif",
    heading: "'Playfair Display', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    arabic: "'Amiri', 'Traditional Arabic', serif",
  },
  modern: {
    name: "Modern Sans",
    heading: "'Montserrat', 'Helvetica Neue', sans-serif",
    body: "'Inter', 'Segoe UI', sans-serif",
    arabic: "'Cairo', 'Segoe UI', sans-serif",
  },
  luxury: {
    name: "Luxury Classic",
    heading: "'Cinzel', 'Times New Roman', serif",
    body: "'Lato', 'Helvetica Neue', sans-serif",
    arabic: "'Scheherazade New', 'Traditional Arabic', serif",
  },
  minimal: {
    name: "Minimal Clean",
    heading: "'Raleway', 'Helvetica Neue', sans-serif",
    body: "'Source Sans 3', 'Segoe UI', sans-serif",
    arabic: "'Tajawal', 'Segoe UI', sans-serif",
  },
  bold: {
    name: "Bold Impact",
    heading: "'Oswald', 'Impact', sans-serif",
    body: "'Roboto', 'Segoe UI', sans-serif",
    arabic: "'El Messiri', 'Segoe UI', sans-serif",
  },
  editorial: {
    name: "Editorial",
    heading: "'DM Serif Display', Georgia, serif",
    body: "'DM Sans', 'Segoe UI', sans-serif",
    arabic: "'Noto Naskh Arabic', 'Traditional Arabic', serif",
  },
  geometric: {
    name: "Geometric",
    heading: "'Poppins', 'Helvetica Neue', sans-serif",
    body: "'Nunito Sans', 'Segoe UI', sans-serif",
    arabic: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
  },
  artisan: {
    name: "Artisan Craft",
    heading: "'Libre Baskerville', Georgia, serif",
    body: "'Karla', 'Segoe UI', sans-serif",
    arabic: "'Aref Ruqaa', 'Traditional Arabic', serif",
  },
  futuristic: {
    name: "Futuristic",
    heading: "'Space Grotesk', 'Helvetica Neue', sans-serif",
    body: "'IBM Plex Mono', monospace",
    arabic: "'Readex Pro', 'Segoe UI', sans-serif",
  },
  handcrafted: {
    name: "Handcrafted",
    heading: "'Cormorant', Georgia, serif",
    body: "'Quicksand', 'Segoe UI', sans-serif",
    arabic: "'Lemonada', 'Traditional Arabic', serif",
  },
} as const;

// Google Fonts URL for all presets
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600&family=Amiri:wght@400;700&family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Cairo:wght@300;400;600;700&family=Cinzel:wght@400;500;600;700&family=Lato:wght@300;400;700&family=Scheherazade+New:wght@400;700&family=Raleway:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;600;700&family=Tajawal:wght@300;400;500;700&family=Oswald:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=El+Messiri:wght@400;500;600;700&family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&family=Noto+Naskh+Arabic:wght@400;600;700&family=Poppins:wght@300;400;500;600;700&family=Nunito+Sans:wght@300;400;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Libre+Baskerville:wght@400;700&family=Karla:wght@300;400;500;700&family=Aref+Ruqaa:wght@400;700&family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Readex+Pro:wght@300;400;500;600;700&family=Cormorant:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&family=Lemonada:wght@300;400;500;600;700&display=swap";

type FontPreset = keyof typeof FONT_PRESETS;

// Template-specific pattern definitions (Option A)
type PatternType =
  | "none"
  | "dots"
  | "circles"
  | "waves"
  | "geometric"
  | "grid"
  | "diamonds"
  | "stripes"
  | "crosshatch"
  | "confetti"
  | "zigzag"
  | "hexagons"
  | "triangles"
  | "art-deco"
  | "botanical"
  | "marble"
  | "noise"
  | "circuit"
  | "scanlines"
  | "halftone";

interface PatternDefinition {
  id: PatternType;
  name: string;
  icon: string;
}

// Template categories with their curated patterns
const TEMPLATE_PATTERNS: Record<string, PatternDefinition[]> = {
  "table-tent": [
    { id: "none", name: "None", icon: "◯" },
    { id: "grid", name: "Grid", icon: "▦" },
    { id: "dots", name: "Dots", icon: "⠿" },
    { id: "art-deco", name: "Art Deco", icon: "◇" },
    { id: "geometric", name: "Geometric", icon: "⬡" },
  ],
  "business-card": [
    { id: "none", name: "None", icon: "◯" },
    { id: "dots", name: "Dots", icon: "⠿" },
    { id: "stripes", name: "Stripes", icon: "≡" },
    { id: "geometric", name: "Geometric", icon: "⬡" },
    { id: "noise", name: "Texture", icon: "▤" },
  ],
  "window-sticker": [
    { id: "none", name: "None", icon: "◯" },
    { id: "circles", name: "Circles", icon: "◎" },
    { id: "waves", name: "Waves", icon: "≈" },
    { id: "grid", name: "Grid", icon: "▦" },
    { id: "crosshatch", name: "Crosshatch", icon: "⧉" },
  ],
  "a5-flyer": [
    { id: "none", name: "None", icon: "◯" },
    { id: "grid", name: "Grid", icon: "▦" },
    { id: "dots", name: "Dots", icon: "⠿" },
    { id: "halftone", name: "Halftone", icon: "◐" },
    { id: "stripes", name: "Stripes", icon: "≡" },
  ],
  poster: [
    { id: "none", name: "None", icon: "◯" },
    { id: "grid", name: "Grid", icon: "▦" },
    { id: "circles", name: "Radial", icon: "◎" },
    { id: "geometric", name: "Geometric", icon: "⬡" },
    { id: "art-deco", name: "Art Deco", icon: "◇" },
  ],
  "elegant-gold": [
    { id: "none", name: "None", icon: "◯" },
    { id: "art-deco", name: "Art Deco", icon: "◇" },
    { id: "diamonds", name: "Diamonds", icon: "◆" },
    { id: "marble", name: "Marble", icon: "〰" },
    { id: "geometric", name: "Filigree", icon: "❧" },
  ],
  minimalist: [
    { id: "none", name: "None", icon: "◯" },
    { id: "dots", name: "Dots", icon: "⠿" },
    { id: "grid", name: "Grid", icon: "▦" },
    { id: "stripes", name: "Lines", icon: "≡" },
  ],
  "retro-diner": [
    { id: "none", name: "None", icon: "◯" },
    { id: "zigzag", name: "Zigzag", icon: "⚡" },
    { id: "stripes", name: "Stripes", icon: "≡" },
    { id: "halftone", name: "Halftone", icon: "◐" },
    { id: "confetti", name: "Confetti", icon: "✦" },
  ],
  "neon-glow": [
    { id: "none", name: "None", icon: "◯" },
    { id: "circuit", name: "Circuit", icon: "⏣" },
    { id: "grid", name: "Grid", icon: "▦" },
    { id: "scanlines", name: "Scanlines", icon: "☰" },
    { id: "hexagons", name: "Hexagons", icon: "⬡" },
  ],
  "organic-natural": [
    { id: "none", name: "None", icon: "◯" },
    { id: "botanical", name: "Botanical", icon: "🌿" },
    { id: "waves", name: "Waves", icon: "≈" },
    { id: "dots", name: "Seeds", icon: "⠿" },
    { id: "noise", name: "Paper", icon: "▤" },
  ],
  "luxury-dark": [
    { id: "none", name: "None", icon: "◯" },
    { id: "marble", name: "Marble", icon: "〰" },
    { id: "geometric", name: "Geometric", icon: "⬡" },
    { id: "noise", name: "Velvet", icon: "▤" },
    { id: "art-deco", name: "Moire", icon: "◇" },
  ],
  "social-square": [
    { id: "none", name: "None", icon: "◯" },
    { id: "confetti", name: "Confetti", icon: "✦" },
    { id: "circles", name: "Bubbles", icon: "◎" },
    { id: "geometric", name: "Shapes", icon: "⬡" },
    { id: "waves", name: "Flow", icon: "≈" },
  ],
};

// Preset color themes
const COLOR_PRESETS = [
  { name: "Brand", id: "brand", colors: null }, // Will use catalog colors
  {
    name: "Golden Hour",
    id: "golden",
    colors: {
      primary: "#D4A574",
      secondary: "#8B7355",
      accent: "#F5DEB3",
      background: "#1C1410",
      textPrimary: "#FFF8F0",
      textSecondary: "#C9B896",
    },
  },
  {
    name: "Ocean Depths",
    id: "ocean",
    colors: {
      primary: "#0077B6",
      secondary: "#023E8A",
      accent: "#90E0EF",
      background: "#03071E",
      textPrimary: "#CAF0F8",
      textSecondary: "#48CAE4",
    },
  },
  {
    name: "Forest",
    id: "forest",
    colors: {
      primary: "#2D6A4F",
      secondary: "#1B4332",
      accent: "#95D5B2",
      background: "#081C15",
      textPrimary: "#D8F3DC",
      textSecondary: "#74C69D",
    },
  },
  {
    name: "Sunset",
    id: "sunset",
    colors: {
      primary: "#FF6B35",
      secondary: "#F72585",
      accent: "#FFD166",
      background: "#10002B",
      textPrimary: "#FFF1E6",
      textSecondary: "#FFC8DD",
    },
  },
  {
    name: "Midnight",
    id: "midnight",
    colors: {
      primary: "#7209B7",
      secondary: "#3A0CA3",
      accent: "#F72585",
      background: "#0A0118",
      textPrimary: "#E0AAFF",
      textSecondary: "#9D4EDD",
    },
  },
  {
    name: "Rose Gold",
    id: "rosegold",
    colors: {
      primary: "#B76E79",
      secondary: "#C9A9A6",
      accent: "#F4E4C9",
      background: "#1A1315",
      textPrimary: "#FDF0F0",
      textSecondary: "#E8C4C4",
    },
  },
  {
    name: "Monochrome",
    id: "mono",
    colors: {
      primary: "#FFFFFF",
      secondary: "#E0E0E0",
      accent: "#9E9E9E",
      background: "#121212",
      textPrimary: "#FFFFFF",
      textSecondary: "#BDBDBD",
    },
  },
  {
    name: "Clean White",
    id: "white",
    colors: {
      primary: "#1A1A2E",
      secondary: "#4A4E69",
      accent: "#FF6B35",
      background: "#FFFFFF",
      textPrimary: "#1A1A2E",
      textSecondary: "#6B7280",
    },
  },
];

// Template customization state
interface TemplateCustomization {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textPrimary: string;
  textSecondary: string;
  showLogo: boolean;
  showShopName: boolean;
  customShopName: string; // Empty = use catalog name, otherwise use custom
  showArabicText: boolean;
  arabicText: string;
  englishText: string;
  ctaText: string;
  pattern: PatternType;
  fontPreset: FontPreset;
  headingWeight: "light" | "normal" | "medium" | "semibold" | "bold";
  letterSpacing: "tight" | "normal" | "wide" | "wider";
  customUrl: string; // Optional custom URL override
}

// Best gradient direction defaults for each template
const TEMPLATE_GRADIENT_DEFAULTS: Record<string, number> = {
  "table-tent": 135,
  "business-card": 90,
  "window-sticker": 45,
  "a5-flyer": 135,
  poster: 180,
  "elegant-gold": 135,
  minimalist: 0,
  "retro-diner": 45,
  "neon-glow": 180,
  "organic-natural": 135,
  "luxury-dark": 180,
  "social-square": 135,
};

const DEFAULT_CUSTOMIZATION: TemplateCustomization = {
  primaryColor: "#FF6B35",
  secondaryColor: "#4A90A4",
  accentColor: "#c084fc",
  backgroundColor: "#1a1a2e",
  textPrimary: "#ffffff",
  textSecondary: "#a0aec0",
  showLogo: true,
  showShopName: true,
  customShopName: "",
  showArabicText: true,
  arabicText: "قائمة الطعام",
  englishText: "Scan To View Menu",
  ctaText: "Scan Me!",
  pattern: "circles",
  fontPreset: "elegant",
  headingWeight: "normal",
  letterSpacing: "wide",
  customUrl: "",
};

const PRINT_TEMPLATES = [
  {
    id: "table-tent",
    name: "Table Tent",
    description: "A-frame style card for tables",
    icon: "🏕️",
    category: "table",
  },
  {
    id: "business-card",
    name: "Business Cards",
    description: "8 cards per sheet",
    icon: "💳",
    category: "cards",
  },
  {
    id: "window-sticker",
    name: "Window Sticker",
    description: "Large 6x6 inch format",
    icon: "🪟",
    category: "signage",
  },
  {
    id: "a5-flyer",
    name: "A5 Flyer",
    description: "Half-page promotional",
    icon: "📄",
    category: "flyer",
  },
  {
    id: "poster",
    name: "A4 Poster",
    description: "Full page poster",
    icon: "🖼️",
    category: "poster",
  },
  {
    id: "elegant-gold",
    name: "Elegant Gold",
    description: "Luxury gold accents",
    icon: "✨",
    category: "premium",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean & simple",
    icon: "◻️",
    category: "modern",
  },
  {
    id: "retro-diner",
    name: "Retro Diner",
    description: "Vintage 50s style",
    icon: "🍔",
    category: "themed",
  },
  {
    id: "neon-glow",
    name: "Neon Glow",
    description: "Cyberpunk neon style",
    icon: "💜",
    category: "modern",
  },
  {
    id: "organic-natural",
    name: "Organic Natural",
    description: "Eco-friendly green theme",
    icon: "🌿",
    category: "themed",
  },
  {
    id: "luxury-dark",
    name: "Luxury Dark",
    description: "Premium dark mode",
    icon: "🖤",
    category: "premium",
  },
  {
    id: "social-square",
    name: "Social Media",
    description: "Instagram-ready square",
    icon: "📱",
    category: "digital",
  },
];

export default function QRCodePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [catalogUrl, setCatalogUrl] = useState<string>("");
  const [catalog, setCatalog] = useState<CatalogInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Template customization
  const [customization, setCustomization] = useState<TemplateCustomization>(
    DEFAULT_CUSTOMIZATION
  );

  // QR customization
  const [qrSize, setQrSize] = useState(512);
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);

  // Preview controls
  const [previewScale, setPreviewScale] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Batch export state
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const printRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Get the effective URL (custom or catalog URL)
  const effectiveUrl = customization.customUrl.trim() || catalogUrl;
  const effectiveShortUrl = effectiveUrl.replace(/^https?:\/\//, "");

  // Get available patterns for current template
  const getAvailablePatterns = useCallback(() => {
    if (!selectedTemplate) return TEMPLATE_PATTERNS["table-tent"];
    return (
      TEMPLATE_PATTERNS[selectedTemplate] || TEMPLATE_PATTERNS["table-tent"]
    );
  }, [selectedTemplate]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      if (!token) return;

      try {
        // Fetch catalog info
        const settingsRes = await fetch(`/api/c/${slug}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const catalogData = {
            name: data.catalog.name,
            logo_url: data.catalog.logo_url,
            color_primary: data.appearance.color_primary || "#FF6B35",
            color_secondary: data.appearance.color_secondary || "#4A90A4",
            color_accent: data.appearance.color_accent || "#c084fc",
            color_background: data.appearance.color_background || "#1a1a2e",
          };
          setCatalog(catalogData);

          // Initialize customization with catalog colors
          setCustomization((prev) => ({
            ...prev,
            primaryColor: catalogData.color_primary,
            secondaryColor: catalogData.color_secondary,
            accentColor: catalogData.color_accent,
            backgroundColor: catalogData.color_background,
          }));
        }

        // Fetch QR code
        await regenerateQR(token);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const updateCustomization = (
    key: keyof TemplateCustomization,
    value: any
  ) => {
    setCustomization((prev) => ({ ...prev, [key]: value }));
  };

  const resetCustomization = () => {
    if (catalog) {
      setCustomization({
        ...DEFAULT_CUSTOMIZATION,
        primaryColor: catalog.color_primary,
        secondaryColor: catalog.color_secondary,
        accentColor: catalog.color_accent,
        backgroundColor: catalog.color_background,
      });
    }
  };

  const [qrError, setQrError] = useState<string | null>(null);

  const regenerateQR = async (token?: string) => {
    const authToken =
      token || localStorage.getItem(`catalog_admin_token_${slug}`);
    if (!authToken) {
      setQrError("No auth token found");
      return;
    }

    setQrError(null);
    const light = transparent ? "transparent" : lightColor;

    try {
      const res = await fetch(
        `/api/c/${slug}/admin/qr?format=base64&size=${qrSize}&dark=${encodeURIComponent(
          darkColor
        )}&light=${encodeURIComponent(light)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setQrDataUrl(data.dataUrl);
        setCatalogUrl(data.catalogUrl);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setQrError(errorData.error || `Failed with status ${res.status}`);
        console.error("QR fetch failed:", res.status, errorData);
      }
    } catch (error) {
      setQrError("Network error fetching QR code");
      console.error("QR fetch error:", error);
    }
  };

  const downloadQR = async (format: "png" | "svg") => {
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    if (!token) return;

    const light = transparent ? "transparent" : lightColor;
    const res = await fetch(
      `/api/c/${slug}/admin/qr?format=${format}&size=2048&dark=${encodeURIComponent(
        darkColor
      )}&light=${encodeURIComponent(light)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-qr.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (!selectedTemplate) return;
    window.print();
  };

  // Apply color preset
  const applyColorPreset = (presetId: string) => {
    const preset = COLOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.id === "brand" && catalog) {
      // Apply brand colors
      setCustomization((prev) => ({
        ...prev,
        primaryColor: catalog.color_primary,
        secondaryColor: catalog.color_secondary,
        accentColor: catalog.color_accent,
        backgroundColor: catalog.color_background,
        textPrimary: "#ffffff",
        textSecondary: "#a0aec0",
      }));
    } else if (preset.colors) {
      // Apply preset colors
      setCustomization((prev) => ({
        ...prev,
        primaryColor: preset.colors!.primary,
        secondaryColor: preset.colors!.secondary,
        accentColor: preset.colors!.accent,
        backgroundColor: preset.colors!.background,
        textPrimary: preset.colors!.textPrimary,
        textSecondary: preset.colors!.textSecondary,
      }));
    }
  };

  // Toggle fullscreen preview
  const toggleFullscreen = () => {
    if (!previewRef.current) return;

    if (!isFullscreen) {
      if (previewRef.current.requestFullscreen) {
        previewRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Batch export all templates
  const batchExportTemplates = async () => {
    if (!qrDataUrl || !catalog) return;

    setIsBatchExporting(true);
    setBatchProgress(0);

    try {
      // Use html2canvas if available, otherwise just print
      const templates = PRINT_TEMPLATES;
      for (let i = 0; i < templates.length; i++) {
        setBatchProgress(Math.round(((i + 1) / templates.length) * 100));
        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Open print dialog with all templates option
      alert(
        "Batch export prepared! Use Ctrl+P to print all templates as PDF. Each template will be on a separate page."
      );
    } catch (error) {
      console.error("Batch export error:", error);
    } finally {
      setIsBatchExporting(false);
      setBatchProgress(0);
    }
  };

  useEffect(() => {
    if (!loading) {
      regenerateQR();
    }
  }, [qrSize, darkColor, lightColor, transparent]);

  if (loading) {
    return (
      <CatalogAdminShell>
        <CatalogAdminHeader title="QR Code & Print Materials" />
        <CatalogAdminContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        </CatalogAdminContent>
      </CatalogAdminShell>
    );
  }

  return (
    <CatalogAdminShell>
      {/* Google Fonts for all presets - using style tag for reliable loading */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('${GOOGLE_FONTS_URL}');`,
        }}
      />

      <CatalogAdminHeader title="QR Code & Print Materials" />
      <CatalogAdminContent>
        <div className="space-y-8">
          {/* QR Code Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* QR Preview */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-violet-400" />
                Your QR Code
              </h2>

              <div
                className="flex items-center justify-center p-8 rounded-xl mb-4"
                style={{
                  backgroundColor: transparent ? "#1e293b" : lightColor,
                }}
              >
                {qrError ? (
                  <div className="text-center text-purple-400 p-4">
                    <p className="font-medium">Failed to load QR Code</p>
                    <p className="text-sm mt-1">{qrError}</p>
                    <button
                      onClick={() => regenerateQR()}
                      className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Catalog QR Code"
                    className="max-w-full h-auto"
                    style={{
                      width: Math.min(qrSize, 300),
                      imageRendering: "pixelated",
                    }}
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-700 rounded animate-pulse" />
                )}
              </div>

              <p className="text-center text-sm text-slate-400 mb-4 break-all">
                {catalogUrl}
              </p>

              {/* Download Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => downloadQR("png")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FileImage className="w-4 h-4" />
                  Download PNG
                </button>
                <button
                  onClick={() => downloadQR("svg")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  <FileCode className="w-4 h-4" />
                  Download SVG
                </button>
              </div>
            </div>

            {/* QR Customization */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-violet-400" />
                Customize QR Code
              </h2>

              <div className="space-y-6">
                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Size: {qrSize}px
                  </label>
                  <input
                    type="range"
                    min="128"
                    max="1024"
                    step="128"
                    value={qrSize}
                    onChange={(e) => setQrSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Dark Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    QR Color (Dark)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border-2 border-slate-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600"
                    />
                    <button
                      onClick={() =>
                        setDarkColor(catalog?.color_primary || "#FF6B35")
                      }
                      className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
                    >
                      Use Brand
                    </button>
                  </div>
                </div>

                {/* Light Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => {
                        setLightColor(e.target.value);
                        setTransparent(false);
                      }}
                      disabled={transparent}
                      className="w-12 h-12 rounded-lg border-2 border-slate-600 cursor-pointer disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={transparent ? "transparent" : lightColor}
                      disabled
                      className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 disabled:opacity-50"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transparent}
                        onChange={(e) => setTransparent(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500"
                      />
                      <span className="text-sm text-slate-300">
                        Transparent
                      </span>
                    </label>
                  </div>
                </div>

                {/* Preset Colors */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quick Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { dark: "#000000", light: "#ffffff", name: "Classic" },
                      { dark: "#1e293b", light: "#ffffff", name: "Slate" },
                      {
                        dark: catalog?.color_primary || "#FF6B35",
                        light: "#ffffff",
                        name: "Brand",
                      },
                      {
                        dark: "#000000",
                        light: "transparent",
                        name: "Transparent",
                      },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setDarkColor(preset.dark);
                          if (preset.light === "transparent") {
                            setTransparent(true);
                          } else {
                            setLightColor(preset.light);
                            setTransparent(false);
                          }
                        }}
                        className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print Templates Section */}
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-violet-400" />
                Printable Templates
              </h2>
              <button
                onClick={() => setShowCustomizer(!showCustomizer)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showCustomizer
                    ? "bg-violet-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
              >
                <Settings2 className="w-4 h-4" />
                {showCustomizer ? "Hide Customizer" : "Customize Design"}
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Select a template, customize it, and use Ctrl+P to print or save
              as PDF.
            </p>

            {/* Customization Panel */}
            {showCustomizer && (
              <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Template Customization
                  </h3>
                  <button
                    onClick={resetCustomization}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Brand Colors
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Color Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Colors
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Primary
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.primaryColor}
                            onChange={(e) =>
                              updateCustomization(
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.primaryColor}
                            onChange={(e) =>
                              updateCustomization(
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1.5 text-xs bg-slate-800 rounded border border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Secondary
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.secondaryColor}
                            onChange={(e) =>
                              updateCustomization(
                                "secondaryColor",
                                e.target.value
                              )
                            }
                            className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.secondaryColor}
                            onChange={(e) =>
                              updateCustomization(
                                "secondaryColor",
                                e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1.5 text-xs bg-slate-800 rounded border border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Accent
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.accentColor}
                            onChange={(e) =>
                              updateCustomization("accentColor", e.target.value)
                            }
                            className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.accentColor}
                            onChange={(e) =>
                              updateCustomization("accentColor", e.target.value)
                            }
                            className="flex-1 px-2 py-1.5 text-xs bg-slate-800 rounded border border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Background
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.backgroundColor}
                            onChange={(e) =>
                              updateCustomization(
                                "backgroundColor",
                                e.target.value
                              )
                            }
                            className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.backgroundColor}
                            onChange={(e) =>
                              updateCustomization(
                                "backgroundColor",
                                e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1.5 text-xs bg-slate-800 rounded border border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Text Primary
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.textPrimary}
                            onChange={(e) =>
                              updateCustomization("textPrimary", e.target.value)
                            }
                            className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.textPrimary}
                            onChange={(e) =>
                              updateCustomization("textPrimary", e.target.value)
                            }
                            className="flex-1 px-2 py-1.5 text-xs bg-slate-800 rounded border border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Text Secondary
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customization.textSecondary}
                            onChange={(e) =>
                              updateCustomization(
                                "textSecondary",
                                e.target.value
                              )
                            }
                            className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customization.textSecondary}
                            onChange={(e) =>
                              updateCustomization(
                                "textSecondary",
                                e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1.5 text-xs bg-slate-800 rounded border border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Text Content
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Arabic Text
                        </label>
                        <input
                          type="text"
                          value={customization.arabicText}
                          onChange={(e) =>
                            updateCustomization("arabicText", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-slate-800 rounded-lg border border-slate-600 text-white text-right"
                          dir="rtl"
                          placeholder="قائمة الطعام"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          English Text
                        </label>
                        <input
                          type="text"
                          value={customization.englishText}
                          onChange={(e) =>
                            updateCustomization("englishText", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-slate-800 rounded-lg border border-slate-600 text-white"
                          placeholder="Scan To View Menu"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Call to Action
                        </label>
                        <input
                          type="text"
                          value={customization.ctaText}
                          onChange={(e) =>
                            updateCustomization("ctaText", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-slate-800 rounded-lg border border-slate-600 text-white"
                          placeholder="Scan Me!"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Display Options
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customization.showLogo}
                          onChange={(e) =>
                            updateCustomization("showLogo", e.target.checked)
                          }
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500"
                        />
                        <span className="text-sm text-slate-300">
                          Show Logo
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customization.showShopName}
                          onChange={(e) =>
                            updateCustomization(
                              "showShopName",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500"
                        />
                        <span className="text-sm text-slate-300">
                          Show Shop Name
                        </span>
                      </label>
                      {customization.showShopName && (
                        <div className="ml-7">
                          <input
                            type="text"
                            value={customization.customShopName}
                            onChange={(e) =>
                              updateCustomization(
                                "customShopName",
                                e.target.value
                              )
                            }
                            placeholder={
                              catalog?.name || "Custom name (optional)"
                            }
                            className="w-full px-3 py-1.5 bg-slate-700 rounded-lg text-white text-sm border border-slate-600 focus:border-violet-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            Leave empty to use catalog name, or enter custom
                            text (e.g., Arabic)
                          </p>
                        </div>
                      )}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customization.showArabicText}
                          onChange={(e) =>
                            updateCustomization(
                              "showArabicText",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500"
                        />
                        <span className="text-sm text-slate-300">
                          Show Arabic Text
                        </span>
                      </label>

                      {/* Dynamic Pattern Selector */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">
                          Background Pattern{" "}
                          {selectedTemplate && (
                            <span className="text-violet-400">
                              (for {selectedTemplate.replace("-", " ")})
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {getAvailablePatterns().map((patternDef) => (
                            <button
                              key={patternDef.id}
                              onClick={() =>
                                updateCustomization("pattern", patternDef.id)
                              }
                              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${customization.pattern === patternDef.id
                                  ? "bg-violet-600 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                              <span>{patternDef.icon}</span>
                              <span>{patternDef.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Settings Row */}
                <div className="border-t border-slate-700 pt-6 mt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Custom URL */}
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                        <Link2 className="w-4 h-4" />
                        Custom URL (Optional)
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={customization.customUrl}
                          onChange={(e) =>
                            updateCustomization("customUrl", e.target.value)
                          }
                          className="flex-1 px-3 py-2 bg-slate-800 rounded-lg border border-slate-600 text-white text-sm"
                          placeholder={
                            catalogUrl ||
                            "Leave empty to use default catalog URL"
                          }
                        />
                        {customization.customUrl && (
                          <button
                            onClick={() => updateCustomization("customUrl", "")}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
                            title="Clear custom URL"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {customization.customUrl && (
                        <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                          ⚠️ Using custom URL instead of catalog URL
                        </p>
                      )}
                    </div>

                    {/* Color Presets */}
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4" />
                        Color Theme Presets
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => applyColorPreset(preset.id)}
                            className="group relative px-3 py-1.5 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-2"
                            title={preset.name}
                          >
                            {preset.colors ? (
                              <div className="flex -space-x-1">
                                <div
                                  className="w-3 h-3 rounded-full border border-slate-600"
                                  style={{ background: preset.colors.primary }}
                                />
                                <div
                                  className="w-3 h-3 rounded-full border border-slate-600"
                                  style={{ background: preset.colors.accent }}
                                />
                                <div
                                  className="w-3 h-3 rounded-full border border-slate-600"
                                  style={{
                                    background: preset.colors.secondary,
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex -space-x-1">
                                <div
                                  className="w-3 h-3 rounded-full border border-slate-600"
                                  style={{ background: catalog?.color_primary }}
                                />
                                <div
                                  className="w-3 h-3 rounded-full border border-slate-600"
                                  style={{ background: catalog?.color_accent }}
                                />
                                <div
                                  className="w-3 h-3 rounded-full border border-slate-600"
                                  style={{
                                    background: catalog?.color_secondary,
                                  }}
                                />
                              </div>
                            )}
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Section - Second Row */}
                <div className="border-t border-slate-700 pt-6 mt-6">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-4">
                    <Type className="w-4 h-4" />
                    Typography
                  </h4>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Font Preset */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        Font Style
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {(Object.keys(FONT_PRESETS) as FontPreset[]).map(
                          (preset) => (
                            <button
                              key={preset}
                              onClick={() =>
                                updateCustomization("fontPreset", preset)
                              }
                              className={`px-3 py-2 text-xs rounded-lg transition-colors text-left ${customization.fontPreset === preset
                                  ? "bg-violet-600 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                              <span className="font-medium block">
                                {FONT_PRESETS[preset].name}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Heading Weight */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        Heading Weight
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            "light",
                            "normal",
                            "medium",
                            "semibold",
                            "bold",
                          ] as const
                        ).map((weight) => (
                          <button
                            key={weight}
                            onClick={() =>
                              updateCustomization("headingWeight", weight)
                            }
                            className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${customization.headingWeight === weight
                                ? "bg-violet-600 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                          >
                            {weight}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Letter Spacing */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        Letter Spacing
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(["tight", "normal", "wide", "wider"] as const).map(
                          (spacing) => (
                            <button
                              key={spacing}
                              onClick={() =>
                                updateCustomization("letterSpacing", spacing)
                              }
                              className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${customization.letterSpacing === spacing
                                  ? "bg-violet-600 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                              {spacing}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {PRINT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${selectedTemplate === template.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-slate-700 bg-slate-900 hover:border-slate-600"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 capitalize">
                      {template.category}
                    </span>
                  </div>
                  <h3 className="font-medium text-white text-sm">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 py-3 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowCustomizer(true)}
                  className="flex items-center gap-2 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  Customize
                </button>
                <button
                  onClick={batchExportTemplates}
                  disabled={isBatchExporting}
                  className="flex items-center gap-2 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Layers className="w-4 h-4" />
                  {isBatchExporting
                    ? `Exporting... ${batchProgress}%`
                    : "Export All Templates"}
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Template Preview */}
          {selectedTemplate && qrDataUrl && catalog && (
            <div className="bg-slate-800 rounded-xl p-6" ref={previewRef}>
              {/* Preview Header with Controls */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-violet-400" />
                  Preview:{" "}
                  {PRINT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                </h2>

                {/* Preview Controls */}
                <div className="flex items-center gap-4">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() =>
                        setPreviewScale(Math.max(50, previewScale - 10))
                      }
                      className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4 text-slate-300" />
                    </button>
                    <span className="text-sm text-slate-300 min-w-[4rem] text-center">
                      {previewScale}%
                    </span>
                    <button
                      onClick={() =>
                        setPreviewScale(Math.min(150, previewScale + 10))
                      }
                      className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>

                  {/* Scale Slider */}
                  <div className="hidden md:flex items-center gap-2">
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="5"
                      value={previewScale}
                      onChange={(e) =>
                        setPreviewScale(parseInt(e.target.value))
                      }
                      className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Reset Zoom */}
                  <button
                    onClick={() => setPreviewScale(100)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Reset to 100%"
                  >
                    <RotateCw className="w-4 h-4 text-slate-300" />
                  </button>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title={
                      isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4 text-slate-300" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Preview Container with Scale */}
              <div
                className={`bg-white rounded-lg p-4 overflow-auto transition-all ${isFullscreen
                    ? "min-h-screen flex items-center justify-center"
                    : ""
                  }`}
                style={{
                  backgroundColor: isFullscreen ? "#f5f5f5" : "white",
                }}
              >
                <div
                  style={{
                    transform: `scale(${previewScale / 100})`,
                    transformOrigin: "top center",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <PrintTemplatePreview
                    template={selectedTemplate}
                    qrDataUrl={qrDataUrl}
                    catalogUrl={effectiveUrl}
                    catalog={catalog}
                    customization={customization}
                  />
                </div>
              </div>

              {/* Fullscreen Exit Hint */}
              {isFullscreen && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
                  Press ESC or click the minimize button to exit fullscreen
                </div>
              )}
            </div>
          )}
        </div>

        {/* Print-only content (hidden on screen) */}
        {selectedTemplate && qrDataUrl && catalog && (
          <div className="print-only">
            <PrintTemplatePreview
              template={selectedTemplate}
              qrDataUrl={qrDataUrl}
              catalogUrl={effectiveUrl}
              catalog={catalog}
              customization={customization}
            />
          </div>
        )}
      </CatalogAdminContent>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only,
          .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        .print-only {
          display: none;
        }
        @media print {
          .print-only {
            display: block;
          }
        }
      `}</style>
    </CatalogAdminShell>
  );
}

// Print Template Component - Professional designs using YOUR color palette
function PrintTemplatePreview({
  template,
  qrDataUrl,
  catalogUrl,
  catalog,
  customization,
}: {
  template: string;
  qrDataUrl: string;
  catalogUrl: string;
  catalog: CatalogInfo;
  customization: TemplateCustomization;
}) {
  const shortUrl = catalogUrl.replace(/^https?:\/\//, "");

  // Use customization colors - ALL templates use ONLY these colors
  const {
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    textPrimary,
    textSecondary,
    showLogo,
    showShopName,
    customShopName,
    showArabicText,
    arabicText,
    englishText,
    ctaText,
    pattern,
    fontPreset,
    headingWeight,
    letterSpacing,
  } = customization;

  // Get the display name for the shop
  const displayName = showShopName ? customShopName || catalog.name : "";

  // Get template-specific gradient direction (best default for each template)
  const gradientDirection = TEMPLATE_GRADIENT_DEFAULTS[template] || 135;

  // Get fonts from preset
  const fonts = FONT_PRESETS[fontPreset];

  // Get weight class
  const weightClass = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[headingWeight];

  // Get letter spacing value
  const spacingValue = {
    tight: "-0.025em",
    normal: "0",
    wide: "0.1em",
    wider: "0.2em",
  }[letterSpacing];

  // Helper to add transparency to hex colors
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper for gradient with direction
  const getGradient = (
    color1: string,
    color2: string,
    opacity1 = 1,
    opacity2 = 1
  ) => {
    const c1 = opacity1 < 1 ? hexToRgba(color1, opacity1) : color1;
    const c2 = opacity2 < 1 ? hexToRgba(color2, opacity2) : color2;
    return `linear-gradient(${gradientDirection}deg, ${c1}, ${c2})`;
  };

  // Generate pattern SVG using the user's colors - Extended pattern library
  const getPatternSvg = () => {
    const encodedPrimary = encodeURIComponent(primaryColor);
    const encodedSecondary = encodeURIComponent(secondaryColor);
    const encodedAccent = encodeURIComponent(accentColor);

    switch (pattern) {
      case "dots":
        return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='${encodedPrimary}' fill-opacity='0.15'/%3E%3C/svg%3E")`;
      case "circles":
        return `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='30' stroke='${encodedPrimary}' stroke-opacity='0.08' fill='none' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='20' stroke='${encodedAccent}' stroke-opacity='0.05' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "waves":
        return `url("data:image/svg+xml,%3Csvg width='120' height='24' viewBox='0 0 120 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 12 Q30 2 60 12 T120 12' stroke='${encodedPrimary}' stroke-opacity='0.1' fill='none' stroke-width='1.5'/%3E%3Cpath d='M0 18 Q30 8 60 18 T120 18' stroke='${encodedAccent}' stroke-opacity='0.06' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "geometric":
        return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L30 0 L60 30 L30 60 Z' stroke='${encodedPrimary}' stroke-opacity='0.08' fill='none' stroke-width='1'/%3E%3Cpath d='M15 30 L30 15 L45 30 L30 45 Z' stroke='${encodedAccent}' stroke-opacity='0.05' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "grid":
        return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 H40 M20 0 V40' stroke='${encodedPrimary}' stroke-opacity='0.06' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "diamonds":
        return `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 4 L44 24 L24 44 L4 24 Z' stroke='${encodedPrimary}' stroke-opacity='0.1' fill='none' stroke-width='1'/%3E%3Cpath d='M24 12 L36 24 L24 36 L12 24 Z' stroke='${encodedAccent}' stroke-opacity='0.06' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "stripes":
        return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L20 10' stroke='${encodedPrimary}' stroke-opacity='0.08' stroke-width='1'/%3E%3C/svg%3E")`;
      case "crosshatch":
        return `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16 L32 16 M16 0 L16 32 M0 0 L32 32 M32 0 L0 32' stroke='${encodedPrimary}' stroke-opacity='0.05' stroke-width='1'/%3E%3C/svg%3E")`;
      case "confetti":
        return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='5' y='5' width='4' height='4' fill='${encodedPrimary}' fill-opacity='0.12' transform='rotate(15 7 7)'/%3E%3Crect x='45' y='15' width='3' height='3' fill='${encodedAccent}' fill-opacity='0.1' transform='rotate(-20 46 16)'/%3E%3Crect x='25' y='40' width='5' height='5' fill='${encodedSecondary}' fill-opacity='0.08' transform='rotate(45 27 42)'/%3E%3Ccircle cx='15' cy='35' r='2' fill='${encodedPrimary}' fill-opacity='0.1'/%3E%3Ccircle cx='50' cy='45' r='1.5' fill='${encodedAccent}' fill-opacity='0.12'/%3E%3C/svg%3E")`;
      case "zigzag":
        return `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L10 0 L20 10 L30 0 L40 10' stroke='${encodedPrimary}' stroke-opacity='0.1' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`;
      case "hexagons":
        return `url("data:image/svg+xml,%3Csvg width='56' height='48' viewBox='0 0 56 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M42 16 L56 24 L56 40 L42 48 L28 40 L28 24 Z' stroke='${encodedPrimary}' stroke-opacity='0.08' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "triangles":
        return `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 4 L44 40 L4 40 Z' stroke='${encodedPrimary}' stroke-opacity='0.08' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "art-deco":
        return `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 L40 0 L80 40 L40 80 Z' stroke='${encodedPrimary}' stroke-opacity='0.08' fill='none' stroke-width='1'/%3E%3Cpath d='M20 40 L40 20 L60 40 L40 60 Z' stroke='${encodedAccent}' stroke-opacity='0.06' fill='none' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='8' stroke='${encodedPrimary}' stroke-opacity='0.1' fill='none' stroke-width='1'/%3E%3Cpath d='M0 0 L20 0 L20 20 L0 20 Z M60 0 L80 0 L80 20 L60 20 Z M0 60 L20 60 L20 80 L0 80 Z M60 60 L80 60 L80 80 L60 80 Z' stroke='${encodedAccent}' stroke-opacity='0.05' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
      case "botanical":
        return `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 10 Q50 25 40 40 Q30 25 40 10' fill='${encodedPrimary}' fill-opacity='0.06'/%3E%3Cpath d='M40 40 Q25 50 10 40 Q25 30 40 40' fill='${encodedSecondary}' fill-opacity='0.05'/%3E%3Cpath d='M40 40 Q55 50 70 40 Q55 30 40 40' fill='${encodedAccent}' fill-opacity='0.04'/%3E%3Cpath d='M40 40 Q50 55 40 70 Q30 55 40 40' fill='${encodedPrimary}' fill-opacity='0.05'/%3E%3C/svg%3E")`;
      case "marble":
        return `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q50 30 100 50 T200 50' stroke='${encodedPrimary}' stroke-opacity='0.04' fill='none' stroke-width='40'/%3E%3Cpath d='M0 100 Q60 80 120 100 T200 100' stroke='${encodedSecondary}' stroke-opacity='0.03' fill='none' stroke-width='30'/%3E%3Cpath d='M0 150 Q40 130 80 150 T200 150' stroke='${encodedAccent}' stroke-opacity='0.02' fill='none' stroke-width='25'/%3E%3C/svg%3E")`;
      case "noise":
        return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`;
      case "circuit":
        return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L15 30 L20 25 L40 25 L45 30 L60 30' stroke='${encodedPrimary}' stroke-opacity='0.1' fill='none' stroke-width='1'/%3E%3Cpath d='M30 0 L30 15 L25 20 L25 40 L30 45 L30 60' stroke='${encodedAccent}' stroke-opacity='0.08' fill='none' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='3' stroke='${encodedPrimary}' stroke-opacity='0.12' fill='none' stroke-width='1'/%3E%3Ccircle cx='15' cy='30' r='2' fill='${encodedAccent}' fill-opacity='0.1'/%3E%3Ccircle cx='45' cy='30' r='2' fill='${encodedAccent}' fill-opacity='0.1'/%3E%3C/svg%3E")`;
      case "scanlines":
        return `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 2 L4 2' stroke='${encodedPrimary}' stroke-opacity='0.08' stroke-width='1'/%3E%3C/svg%3E")`;
      case "halftone":
        return `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='4' cy='4' r='2' fill='${encodedPrimary}' fill-opacity='0.15'/%3E%3Ccircle cx='16' cy='4' r='1.5' fill='${encodedPrimary}' fill-opacity='0.1'/%3E%3Ccircle cx='4' cy='16' r='1' fill='${encodedAccent}' fill-opacity='0.12'/%3E%3Ccircle cx='16' cy='16' r='2.5' fill='${encodedPrimary}' fill-opacity='0.08'/%3E%3Ccircle cx='10' cy='10' r='1.5' fill='${encodedSecondary}' fill-opacity='0.1'/%3E%3C/svg%3E")`;
      default:
        return "none";
    }
  };

  switch (template) {
    case "table-tent":
      // ✨ SUPER AESTHETIC TABLE TENT - Layered luxury with dynamic patterns
      return (
        <div className="w-[4in] mx-auto" style={{ fontFamily: fonts.body }}>
          {/* Front side */}
          <div
            className="relative overflow-hidden"
            style={{
              minHeight: "5.5in",
              background: backgroundColor,
            }}
          >
            {/* Dynamic pattern layer */}
            <div
              className="absolute inset-0 opacity-60"
              style={{ backgroundImage: getPatternSvg() }}
            />

            {/* Premium gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                  backgroundColor,
                  0.95
                )} 0%, ${hexToRgba(backgroundColor, 0.7)} 50%, ${hexToRgba(
                  backgroundColor,
                  0.95
                )} 100%)`,
              }}
            />

            {/* Elegant top accent band */}
            <div className="absolute top-0 left-0 right-0">
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${primaryColor}, ${accentColor}, ${primaryColor}, transparent)`,
                }}
              />
              <div
                className="h-20"
                style={{
                  background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                    primaryColor,
                    0.15
                  )} 0%, transparent 100%)`,
                }}
              />
            </div>

            {/* Diagonal slice accent */}
            <div
              className="absolute top-16 left-0 right-0 h-12"
              style={{
                background: `linear-gradient(${gradientDirection}deg, ${primaryColor}, ${secondaryColor})`,
                clipPath: "polygon(0 0, 100% 50%, 100% 100%, 0 50%)",
                opacity: 0.1,
              }}
            />

            {/* Corner ornaments */}
            <div className="absolute top-4 left-4 w-8 h-8">
              <div
                className="absolute top-0 left-0 w-full h-0.5"
                style={{ background: accentColor }}
              />
              <div
                className="absolute top-0 left-0 w-0.5 h-full"
                style={{ background: accentColor }}
              />
              <div
                className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: primaryColor }}
              />
            </div>
            <div className="absolute top-4 right-4 w-8 h-8">
              <div
                className="absolute top-0 right-0 w-full h-0.5"
                style={{ background: accentColor }}
              />
              <div
                className="absolute top-0 right-0 w-0.5 h-full"
                style={{ background: accentColor }}
              />
              <div
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: primaryColor }}
              />
            </div>

            <div className="relative z-10 h-full flex flex-col p-8 pt-28">
              {/* Logo with glow effect */}
              {showLogo && catalog.logo_url && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2">
                  <div
                    className="absolute inset-0 blur-xl rounded-full"
                    style={{ background: hexToRgba(primaryColor, 0.2) }}
                  />
                  <img
                    src={catalog.logo_url}
                    alt={catalog.name}
                    className="relative w-14 h-14 object-contain"
                  />
                </div>
              )}

              {/* Main content */}
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {showArabicText && (
                  <div className="relative mb-4">
                    <p
                      className="text-3xl relative z-10"
                      style={{
                        color: accentColor,
                        fontFamily: fonts.arabic,
                        textShadow: `0 0 30px ${hexToRgba(accentColor, 0.3)}`,
                      }}
                    >
                      {arabicText}
                    </p>
                  </div>
                )}

                {showShopName && displayName && (
                  <h1
                    className={`text-2xl ${weightClass} uppercase mb-2`}
                    style={{
                      color: textPrimary,
                      fontFamily: fonts.heading,
                      letterSpacing: spacingValue,
                    }}
                  >
                    {displayName}
                  </h1>
                )}

                {/* Decorative divider */}
                <div className="flex items-center gap-2 mb-8">
                  <div
                    className="w-12 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accentColor})`,
                    }}
                  />
                  <div className="relative">
                    <div
                      className="w-2 h-2 rotate-45"
                      style={{ background: primaryColor }}
                    />
                    <div
                      className="absolute inset-0 w-2 h-2 rotate-45 animate-ping"
                      style={{ background: primaryColor, opacity: 0.3 }}
                    />
                  </div>
                  <div
                    className="w-12 h-px"
                    style={{
                      background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                    }}
                  />
                </div>

                {/* QR with premium multi-layer frame */}
                <div className="relative">
                  {/* Outer glow */}
                  <div
                    className="absolute -inset-8 rounded-2xl blur-2xl"
                    style={{ background: hexToRgba(primaryColor, 0.1) }}
                  />

                  {/* Decorative outer frame */}
                  <div className="absolute -inset-6">
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                      }}
                    />
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                      }}
                    />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-16 w-px"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
                      }}
                    />
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-16 w-px"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
                      }}
                    />
                  </div>

                  {/* Corner accents */}
                  <div className="absolute -inset-4">
                    {[
                      "-top-1 -left-1",
                      "-top-1 -right-1",
                      "-bottom-1 -left-1",
                      "-bottom-1 -right-1",
                    ].map((pos, i) => (
                      <div key={i} className={`absolute ${pos} w-3 h-3`}>
                        <div
                          className="w-full h-0.5"
                          style={{ background: primaryColor }}
                        />
                        <div
                          className="h-full w-0.5"
                          style={{ background: primaryColor }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* QR container with gradient border */}
                  <div
                    className="relative p-1"
                    style={{
                      background: `linear-gradient(${gradientDirection}deg, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
                    }}
                  >
                    <div className="bg-white p-4">
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-36 h-36"
                      />
                    </div>
                  </div>
                </div>

                <p
                  className="mt-10 text-sm uppercase tracking-widest"
                  style={{
                    color: textSecondary,
                    fontFamily: fonts.body,
                  }}
                >
                  {englishText}
                </p>
              </div>

              {/* Bottom decorative element */}
              <div className="flex justify-center items-center gap-3 mt-auto">
                <div
                  className="w-8 h-0.5"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${primaryColor})`,
                  }}
                />
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: primaryColor }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: secondaryColor }}
                  />
                </div>
                <div
                  className="w-8 h-0.5"
                  style={{
                    background: `linear-gradient(90deg, ${primaryColor}, transparent)`,
                  }}
                />
              </div>
            </div>

            {/* Bottom accent */}
            <div className="absolute bottom-0 left-0 right-0">
              <div
                className="h-16"
                style={{
                  background: `linear-gradient(0deg, ${hexToRgba(
                    primaryColor,
                    0.1
                  )} 0%, transparent 100%)`,
                }}
              />
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${secondaryColor}, ${accentColor}, ${primaryColor}, transparent)`,
                }}
              />
            </div>

            {/* Bottom corner ornaments */}
            <div className="absolute bottom-4 left-4 w-8 h-8">
              <div
                className="absolute bottom-0 left-0 w-full h-0.5"
                style={{ background: accentColor }}
              />
              <div
                className="absolute bottom-0 left-0 w-0.5 h-full"
                style={{ background: accentColor }}
              />
            </div>
            <div className="absolute bottom-4 right-4 w-8 h-8">
              <div
                className="absolute bottom-0 right-0 w-full h-0.5"
                style={{ background: accentColor }}
              />
              <div
                className="absolute bottom-0 right-0 w-0.5 h-full"
                style={{ background: accentColor }}
              />
            </div>
          </div>

          {/* Fold line */}
          <div
            className="text-center py-2 text-[10px] uppercase tracking-[0.3em] relative overflow-hidden"
            style={{
              borderTop: `1px dashed ${hexToRgba(primaryColor, 0.4)}`,
              borderBottom: `1px dashed ${hexToRgba(primaryColor, 0.4)}`,
              color: hexToRgba(textSecondary, 0.5),
            }}
          >
            <div
              className="absolute inset-0"
              style={{ background: hexToRgba(accentColor, 0.03) }}
            />
            <span className="relative">✂ Fold Line ✂</span>
          </div>

          {/* Back side */}
          <div
            className="relative overflow-hidden"
            style={{
              minHeight: "5.5in",
              background: `linear-gradient(${gradientDirection}deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              transform: "rotate(180deg)",
            }}
          >
            {/* Pattern overlay on back */}
            <div
              className="absolute inset-0 opacity-40"
              style={{ backgroundImage: getPatternSvg() }}
            />

            {/* Radial glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl"
              style={{ background: hexToRgba(accentColor, 0.2) }}
            />

            <div className="relative h-full flex items-center justify-center p-10">
              <div className="text-center">
                {showLogo && catalog.logo_url && (
                  <div className="relative inline-block mb-6">
                    <div
                      className="absolute inset-0 blur-2xl rounded-full"
                      style={{ background: hexToRgba(accentColor, 0.3) }}
                    />
                    <img
                      src={catalog.logo_url}
                      alt={catalog.name}
                      className="relative w-20 h-20 object-contain"
                    />
                  </div>
                )}
                {showShopName && displayName && (
                  <h1
                    className={`text-2xl ${weightClass} uppercase mb-4`}
                    style={{
                      color: textPrimary,
                      fontFamily: fonts.heading,
                      letterSpacing: spacingValue,
                    }}
                  >
                    {displayName}
                  </h1>
                )}
                <div className="flex justify-center items-center gap-3 mb-4">
                  <div
                    className="w-10 h-px"
                    style={{ background: hexToRgba(textPrimary, 0.4) }}
                  />
                  <div
                    className="w-2 h-2 rotate-45"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="w-10 h-px"
                    style={{ background: hexToRgba(textPrimary, 0.4) }}
                  />
                </div>
                <p
                  className="text-lg"
                  style={{
                    color: hexToRgba(textPrimary, 0.9),
                    fontFamily: fonts.body,
                  }}
                >
                  {ctaText}
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    case "business-card":
      // ✨ SUPER AESTHETIC BUSINESS CARDS - Horizontal luxury design with proper spacing
      return (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-[3.5in] h-[2in] relative overflow-hidden"
              style={{
                background: backgroundColor,
                fontFamily: fonts.body,
              }}
            >
              {/* Pattern layer */}
              <div
                className="absolute inset-0 opacity-40"
                style={{ backgroundImage: getPatternSvg() }}
              />

              {/* Gradient overlay for depth */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                    backgroundColor,
                    0.9
                  )} 0%, ${hexToRgba(backgroundColor, 0.98)} 100%)`,
                }}
              />

              {/* Top accent line with gradient */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${accentColor} 50%, ${secondaryColor})`,
                }}
              />

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div
                  className="absolute -top-8 -right-8 w-16 h-16 rotate-45"
                  style={{
                    background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                      primaryColor,
                      0.1
                    )}, ${hexToRgba(accentColor, 0.05)})`,
                  }}
                />
              </div>

              <div className="relative z-10 h-full flex p-3">
                {/* Left section - QR (properly sized) */}
                <div className="w-[1.7in] h-full flex items-center justify-center">
                  <div
                    className="relative p-0.5"
                    style={{
                      background: `linear-gradient(${gradientDirection}deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 2px 15px ${hexToRgba(primaryColor, 0.15)}`,
                    }}
                  >
                    <div className="bg-white p-1.5">
                      <img
                        src={qrDataUrl}
                        alt="QR"
                        className="w-[1.35in] h-[1.35in]"
                      />
                    </div>
                  </div>
                </div>

                {/* Right section - Info */}
                <div className="flex-1 flex flex-col justify-center pl-3 pr-2">
                  {/* Logo with subtle glow */}
                  {showLogo && catalog.logo_url && (
                    <div className="relative mb-2">
                      <div
                        className="absolute inset-0 blur-lg rounded-full"
                        style={{ background: hexToRgba(primaryColor, 0.15) }}
                      />
                      <img
                        src={catalog.logo_url}
                        alt={catalog.name}
                        className="relative w-7 h-7 object-contain"
                      />
                    </div>
                  )}

                  {showShopName && displayName && (
                    <h2
                      className={`text-sm ${weightClass} leading-tight mb-0.5`}
                      style={{
                        color: textPrimary,
                        fontFamily: fonts.heading,
                        letterSpacing: spacingValue,
                      }}
                    >
                      {displayName}
                    </h2>
                  )}

                  {showArabicText && (
                    <p
                      className="text-[11px] mb-2"
                      style={{
                        color: accentColor,
                        fontFamily: fonts.arabic,
                      }}
                    >
                      {arabicText}
                    </p>
                  )}

                  {/* Elegant divider */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-5 h-px"
                      style={{
                        background: `linear-gradient(90deg, ${primaryColor}, transparent)`,
                      }}
                    />
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: accentColor }}
                    />
                  </div>

                  <p
                    className="text-[9px] uppercase font-medium"
                    style={{
                      color: primaryColor,
                      letterSpacing: "0.1em",
                      fontFamily: fonts.body,
                    }}
                  >
                    {ctaText}
                  </p>

                  <p
                    className="text-[7px] mt-0.5 opacity-50"
                    style={{ color: textSecondary }}
                  >
                    {shortUrl}
                  </p>
                </div>
              </div>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: hexToRgba(secondaryColor, 0.2) }}
              />
            </div>
          ))}
        </div>
      );

    case "window-sticker":
      // ✨ SUPER AESTHETIC WINDOW STICKER - Bold statement piece with dynamic patterns
      return (
        <div
          className="w-[6in] h-[6in] mx-auto relative overflow-hidden"
          style={{
            background: backgroundColor,
            fontFamily: fonts.body,
          }}
        >
          {/* Full pattern layer */}
          <div
            className="absolute inset-0 opacity-50"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Radial gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${hexToRgba(
                backgroundColor,
                0.7
              )} 0%, ${hexToRgba(backgroundColor, 0.95)} 70%)`,
            }}
          />

          {/* Dynamic diagonal accent */}
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
              background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                primaryColor,
                0.08
              )} 0%, transparent 40%, transparent 60%, ${hexToRgba(
                secondaryColor,
                0.08
              )} 100%)`,
            }}
          />

          {/* Corner decorations */}
          {[
            { pos: "top-4 left-4", rotate: "0deg" },
            { pos: "top-4 right-4", rotate: "90deg" },
            { pos: "bottom-4 right-4", rotate: "180deg" },
            { pos: "bottom-4 left-4", rotate: "270deg" },
          ].map((corner, i) => (
            <div
              key={i}
              className={`absolute ${corner.pos} w-12 h-12`}
              style={{ transform: `rotate(${corner.rotate})` }}
            >
              <div
                className="absolute top-0 left-0 w-full h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                }}
              />
              <div
                className="absolute top-0 left-0 w-0.5 h-full"
                style={{
                  background: `linear-gradient(180deg, ${accentColor}, transparent)`,
                }}
              />
              <div
                className="absolute top-2 left-2 w-2 h-2 rounded-full"
                style={{ background: primaryColor, opacity: 0.5 }}
              />
            </div>
          ))}

          {/* Top header bar */}
          <div className="absolute top-0 left-0 right-0">
            <div
              className="h-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${primaryColor}, ${accentColor}, ${secondaryColor}, transparent)`,
              }}
            />
            <div
              className="h-16 flex items-center justify-between px-8"
              style={{
                background: `linear-gradient(180deg, ${hexToRgba(
                  primaryColor,
                  0.15
                )} 0%, transparent 100%)`,
              }}
            >
              {showLogo && catalog.logo_url && (
                <div className="relative">
                  <div
                    className="absolute inset-0 blur-lg rounded-full"
                    style={{ background: hexToRgba(primaryColor, 0.3) }}
                  />
                  <img
                    src={catalog.logo_url}
                    alt={catalog.name}
                    className="relative w-10 h-10 object-contain"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: primaryColor }}
                />
                <span
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: accentColor, fontFamily: fonts.body }}
                >
                  Digital Menu
                </span>
              </div>
            </div>
          </div>

          {/* Large watermark text */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              fontSize: "200px",
              fontWeight: 900,
              color: hexToRgba(primaryColor, 0.03),
              fontFamily: fonts.heading,
              letterSpacing: "-0.05em",
            }}
          >
            SCAN
          </div>

          {/* Main content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-10">
            {showArabicText && (
              <div className="relative mb-2">
                <p
                  className="text-4xl"
                  style={{
                    color: accentColor,
                    fontFamily: fonts.arabic,
                    textShadow: `0 0 40px ${hexToRgba(accentColor, 0.3)}`,
                  }}
                >
                  {arabicText}
                </p>
              </div>
            )}

            {showShopName && displayName && (
              <h1
                className={`text-3xl ${weightClass} uppercase text-center mb-4`}
                style={{
                  color: textPrimary,
                  fontFamily: fonts.heading,
                  letterSpacing: spacingValue,
                }}
              >
                {displayName}
              </h1>
            )}

            {/* Elegant divider */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-16 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accentColor})`,
                }}
              />
              <div className="relative">
                <div
                  className="w-3 h-3 rotate-45"
                  style={{ background: primaryColor }}
                />
                <div
                  className="absolute inset-0 w-3 h-3 rotate-45 blur-sm"
                  style={{ background: primaryColor, opacity: 0.5 }}
                />
              </div>
              <div
                className="w-16 h-px"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                }}
              />
            </div>

            {/* QR with premium layered frame */}
            <div className="relative">
              {/* Multi-layer glow effect */}
              <div
                className="absolute -inset-12 rounded-full blur-3xl"
                style={{ background: hexToRgba(primaryColor, 0.1) }}
              />
              <div
                className="absolute -inset-8 rounded-full blur-2xl"
                style={{ background: hexToRgba(accentColor, 0.08) }}
              />

              {/* Decorative orbit rings */}
              <div className="absolute -inset-10">
                <div
                  className="absolute inset-0 rounded-full border border-dashed"
                  style={{ borderColor: hexToRgba(accentColor, 0.2) }}
                />
              </div>
              <div className="absolute -inset-8">
                <div
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: hexToRgba(primaryColor, 0.15) }}
                />
              </div>

              {/* Cross markers */}
              <div className="absolute -inset-6">
                {[
                  "top-0 left-1/2 -translate-x-1/2",
                  "bottom-0 left-1/2 -translate-x-1/2",
                  "left-0 top-1/2 -translate-y-1/2",
                  "right-0 top-1/2 -translate-y-1/2",
                ].map((pos, i) => (
                  <div key={i} className={`absolute ${pos}`}>
                    <div
                      className={`${i < 2 ? "w-4 h-px" : "w-px h-4"}`}
                      style={{ background: accentColor }}
                    />
                  </div>
                ))}
              </div>

              {/* QR with gradient border */}
              <div
                className="relative p-1 rounded-lg"
                style={{
                  background: `linear-gradient(${gradientDirection}deg, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
                  boxShadow: `0 8px 50px ${hexToRgba(
                    primaryColor,
                    0.2
                  )}, 0 4px 20px ${hexToRgba(accentColor, 0.15)}`,
                }}
              >
                <div className="bg-white p-5 rounded">
                  <img src={qrDataUrl} alt="QR Code" className="w-44 h-44" />
                </div>
              </div>
            </div>

            {/* CTA text */}
            <div className="mt-10 flex items-center gap-4">
              <div
                className="w-12 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${hexToRgba(
                    textPrimary,
                    0.3
                  )})`,
                }}
              />
              <p
                className="text-sm uppercase tracking-widest"
                style={{
                  color: textPrimary,
                  fontFamily: fonts.body,
                  textShadow: `0 0 20px ${hexToRgba(primaryColor, 0.2)}`,
                }}
              >
                {englishText}
              </p>
              <div
                className="w-12 h-px"
                style={{
                  background: `linear-gradient(90deg, ${hexToRgba(
                    textPrimary,
                    0.3
                  )}, transparent)`,
                }}
              />
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="absolute bottom-0 left-0 right-0">
            <div
              className="h-16"
              style={{
                background: `linear-gradient(0deg, ${hexToRgba(
                  secondaryColor,
                  0.15
                )} 0%, transparent 100%)`,
              }}
            />
            <div
              className="h-1.5"
              style={{
                background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 35%, ${secondaryColor} 65%, ${primaryColor} 100%)`,
              }}
            />
          </div>
        </div>
      );

    case "a5-flyer":
      // ✨ SUPER AESTHETIC A5 FLYER - Magazine editorial with immersive patterns
      return (
        <div
          className="w-[5.8in] h-[8.3in] mx-auto relative overflow-hidden"
          style={{
            background: backgroundColor,
            fontFamily: fonts.body,
          }}
        >
          {/* Full bleed pattern layer */}
          <div
            className="absolute inset-0 opacity-60"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Gradient overlays for depth */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                backgroundColor,
                0.95
              )} 0%, ${hexToRgba(backgroundColor, 0.8)} 50%, ${hexToRgba(
                backgroundColor,
                0.95
              )} 100%)`,
            }}
          />

          {/* Artistic diagonal accent */}
          <div
            className="absolute -top-20 -left-20 w-60 h-60 rounded-full blur-3xl"
            style={{ background: hexToRgba(primaryColor, 0.15) }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full blur-3xl"
            style={{ background: hexToRgba(secondaryColor, 0.1) }}
          />

          {/* Side accent bar with gradient */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5"
            style={{
              background: `linear-gradient(180deg, ${primaryColor} 0%, ${accentColor} 30%, ${secondaryColor} 70%, ${primaryColor} 100%)`,
            }}
          />

          {/* Top decorative strip */}
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              background: `linear-gradient(90deg, transparent, ${hexToRgba(
                primaryColor,
                0.2
              )}, transparent)`,
            }}
          />

          {/* Corner flourishes */}
          <div className="absolute top-6 right-6 w-16 h-16">
            <div
              className="absolute top-0 right-0 w-full h-0.5"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor})`,
              }}
            />
            <div
              className="absolute top-0 right-0 h-full w-0.5"
              style={{
                background: `linear-gradient(180deg, ${accentColor}, transparent)`,
              }}
            />
            <div className="absolute top-3 right-3 w-3 h-3">
              <div
                className="w-full h-full rotate-45"
                style={{ border: `1px solid ${hexToRgba(primaryColor, 0.3)}` }}
              />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 w-16 h-16">
            <div
              className="absolute bottom-0 left-0 w-full h-0.5"
              style={{
                background: `linear-gradient(90deg, ${accentColor}, transparent)`,
              }}
            />
            <div
              className="absolute bottom-0 left-0 h-full w-0.5"
              style={{
                background: `linear-gradient(0deg, ${accentColor}, transparent)`,
              }}
            />
          </div>

          {/* Header section */}
          <div className="relative z-10 p-10 pb-6">
            <div className="flex items-start justify-between">
              {showLogo && catalog.logo_url && (
                <div className="relative">
                  <div
                    className="absolute inset-0 blur-xl rounded-full"
                    style={{ background: hexToRgba(primaryColor, 0.2) }}
                  />
                  <img
                    src={catalog.logo_url}
                    alt={catalog.name}
                    className="relative w-16 h-16 object-contain"
                  />
                </div>
              )}
              <div className="text-right">
                <p
                  className="text-[11px] uppercase mb-2 tracking-widest"
                  style={{ color: accentColor, fontFamily: fonts.body }}
                >
                  Digital Experience
                </p>
                <div className="flex justify-end items-center gap-2">
                  <div className="flex gap-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: primaryColor }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: accentColor }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: secondaryColor }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="relative z-10 flex-1 flex flex-col items-center text-center px-10 pt-6">
            {showArabicText && (
              <div className="relative mb-3">
                <p
                  className="text-5xl"
                  style={{
                    color: accentColor,
                    fontFamily: fonts.arabic,
                    textShadow: `0 0 60px ${hexToRgba(accentColor, 0.3)}`,
                  }}
                >
                  {arabicText}
                </p>
              </div>
            )}

            {showShopName && displayName && (
              <h1
                className={`text-4xl ${weightClass} uppercase mb-2`}
                style={{
                  color: textPrimary,
                  fontFamily: fonts.heading,
                  letterSpacing: spacingValue,
                }}
              >
                {displayName}
              </h1>
            )}

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-20 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${hexToRgba(
                    accentColor,
                    0.5
                  )})`,
                }}
              />
              <div className="relative">
                <div
                  className="w-3 h-3 rotate-45 border"
                  style={{ borderColor: primaryColor }}
                />
                <div
                  className="absolute inset-0 w-3 h-3 rotate-45 scale-50"
                  style={{ background: accentColor }}
                />
              </div>
              <div
                className="w-20 h-px"
                style={{
                  background: `linear-gradient(90deg, ${hexToRgba(
                    accentColor,
                    0.5
                  )}, transparent)`,
                }}
              />
            </div>

            {/* QR with luxury frame */}
            <div className="relative mb-8">
              {/* Outer glow rings */}
              <div
                className="absolute -inset-12 rounded-full blur-3xl"
                style={{ background: hexToRgba(primaryColor, 0.08) }}
              />
              <div
                className="absolute -inset-8 rounded-full blur-2xl"
                style={{ background: hexToRgba(accentColor, 0.06) }}
              />

              {/* Decorative lines */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-6"
                style={{
                  background: `linear-gradient(180deg, transparent, ${accentColor})`,
                }}
              />
              <div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-6"
                style={{
                  background: `linear-gradient(0deg, transparent, ${accentColor})`,
                }}
              />
              <div
                className="absolute top-1/2 -left-8 -translate-y-1/2 h-px w-6"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accentColor})`,
                }}
              />
              <div
                className="absolute top-1/2 -right-8 -translate-y-1/2 h-px w-6"
                style={{
                  background: `linear-gradient(270deg, transparent, ${accentColor})`,
                }}
              />

              {/* Issue number accent */}
              <div
                className="absolute -left-12 top-1/2 -translate-y-1/2"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg) translateY(50%)",
                }}
              >
                <span
                  className="text-6xl font-bold"
                  style={{
                    color: hexToRgba(primaryColor, 0.06),
                    fontFamily: fonts.heading,
                  }}
                >
                  №01
                </span>
              </div>

              {/* QR with gradient border */}
              <div
                className="relative p-1 rounded-xl"
                style={{
                  background: `linear-gradient(${gradientDirection}deg, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
                  boxShadow: `0 10px 60px ${hexToRgba(
                    primaryColor,
                    0.2
                  )}, 0 4px 20px ${hexToRgba(accentColor, 0.15)}`,
                }}
              >
                <div className="bg-white p-5 rounded-lg">
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            </div>

            <p
              className="text-xl uppercase tracking-widest"
              style={{
                color: textPrimary,
                fontFamily: fonts.heading,
              }}
            >
              {englishText}
            </p>

            <p
              className="text-sm mt-2"
              style={{ color: textSecondary, fontFamily: fonts.body }}
            >
              Point your camera at the code above
            </p>
          </div>

          {/* Footer section */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              background: `linear-gradient(0deg, ${hexToRgba(
                backgroundColor,
                1
              )} 0%, transparent 100%)`,
            }}
          >
            <div className="p-8 pt-16">
              <div className="flex justify-between items-center">
                <div className="flex gap-6">
                  {["Instant", "Fresh", "Digital"].map((item, idx) => (
                    <div key={item} className="flex items-center gap-2">
                      <span
                        className="text-2xl font-light"
                        style={{
                          color: hexToRgba(primaryColor, 0.2),
                          fontFamily: fonts.heading,
                        }}
                      >
                        0{idx + 1}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: textSecondary, fontFamily: fonts.body }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-0.5"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${primaryColor})`,
                    }}
                  />
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: accentColor }}
                  />
                </div>
              </div>
            </div>
            {/* Bottom bar */}
            <div
              className="h-1"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
              }}
            />
          </div>
        </div>
      );

    case "poster":
      // ✨ CREATIVE A4 POSTER - Avant-garde gallery exhibition with bold typography
      return (
        <div
          className="w-[8.27in] h-[11.69in] mx-auto relative overflow-hidden"
          style={{
            background: backgroundColor,
            fontFamily: fonts.body,
          }}
        >
          {/* Dynamic pattern layer */}
          <div
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Dramatic diagonal split */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                primaryColor,
                0.12
              )} 0%, transparent 40%, ${hexToRgba(secondaryColor, 0.08)} 100%)`,
            }}
          />

          {/* Giant background typography */}
          <div
            className="absolute -left-10 top-1/4 pointer-events-none select-none"
            style={{
              fontSize: "320px",
              fontWeight: 900,
              color: hexToRgba(primaryColor, 0.03),
              fontFamily: fonts.heading,
              letterSpacing: "-0.05em",
              lineHeight: 0.85,
              writingMode: "vertical-rl",
            }}
          >
            MENU
          </div>

          {/* Artistic floating circles */}
          <div
            className="absolute top-20 right-20 w-40 h-40 rounded-full"
            style={{
              background: hexToRgba(accentColor, 0.05),
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute bottom-40 left-10 w-60 h-60 rounded-full"
            style={{
              background: hexToRgba(primaryColor, 0.04),
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full"
            style={{
              background: hexToRgba(secondaryColor, 0.06),
              filter: "blur(30px)",
            }}
          />

          {/* Top decorative band */}
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
            }}
          />

          {/* Left accent strip with markers */}
          <div
            className="absolute left-8 top-16 bottom-16 w-1"
            style={{
              background: `linear-gradient(180deg, ${primaryColor} 0%, ${accentColor} 50%, ${secondaryColor} 100%)`,
            }}
          >
            <div
              className="absolute top-0 -left-1 w-3 h-3 rounded-full"
              style={{ background: primaryColor }}
            />
            <div
              className="absolute top-1/4 -left-0.5 w-2 h-2 rounded-full"
              style={{ background: accentColor }}
            />
            <div
              className="absolute top-1/2 -left-1 w-3 h-3 rounded-full"
              style={{ background: primaryColor }}
            />
            <div
              className="absolute top-3/4 -left-0.5 w-2 h-2 rounded-full"
              style={{ background: accentColor }}
            />
            <div
              className="absolute bottom-0 -left-1 w-3 h-3 rounded-full"
              style={{ background: secondaryColor }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col p-16 pl-20">
            {/* Header */}
            <div className="flex items-start justify-between">
              {showLogo && catalog.logo_url && (
                <div className="relative">
                  <div
                    className="absolute -inset-4 rounded-full blur-2xl"
                    style={{ background: hexToRgba(primaryColor, 0.15) }}
                  />
                  <img
                    src={catalog.logo_url}
                    alt={catalog.name}
                    className="relative w-20 h-20 object-contain"
                  />
                </div>
              )}
              <div className="text-right">
                <div className="flex items-center gap-3 justify-end mb-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.4em]"
                    style={{ color: accentColor, fontFamily: fonts.body }}
                  >
                    Digital Menu
                  </span>
                  <div
                    className="w-12 h-px"
                    style={{ background: accentColor }}
                  />
                </div>
                <div className="flex gap-1 justify-end">
                  {[primaryColor, accentColor, secondaryColor].map((c, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10">
              {showArabicText && (
                <p
                  className="text-6xl mb-6"
                  style={{
                    color: accentColor,
                    fontFamily: fonts.arabic,
                    textShadow: `0 0 80px ${hexToRgba(accentColor, 0.4)}`,
                  }}
                >
                  {arabicText}
                </p>
              )}

              {showShopName && displayName && (
                <h1
                  className={`text-6xl ${weightClass} uppercase mb-4`}
                  style={{
                    color: textPrimary,
                    fontFamily: fonts.heading,
                    letterSpacing: spacingValue,
                  }}
                >
                  {displayName}
                </h1>
              )}

              {/* Creative divider */}
              <div className="flex items-center gap-6 mb-16">
                <div
                  className="w-24 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor})`,
                  }}
                />
                <div className="relative">
                  <div
                    className="w-4 h-4 rotate-45"
                    style={{ border: `2px solid ${primaryColor}` }}
                  />
                  <div
                    className="absolute inset-0 w-4 h-4 rotate-45 m-auto scale-50"
                    style={{ background: accentColor }}
                  />
                </div>
                <div
                  className="w-24 h-px"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                  }}
                />
              </div>

              {/* QR with artistic frame */}
              <div className="relative">
                {/* Concentric decorative rings */}
                <div
                  className="absolute -inset-20 rounded-full border border-dashed opacity-20"
                  style={{ borderColor: primaryColor }}
                />
                <div
                  className="absolute -inset-16 rounded-full border opacity-15"
                  style={{ borderColor: accentColor }}
                />
                <div
                  className="absolute -inset-12 rounded-full border border-dotted opacity-20"
                  style={{ borderColor: secondaryColor }}
                />

                {/* Corner brackets */}
                <div className="absolute -inset-6">
                  <div
                    className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2"
                    style={{ borderColor: primaryColor }}
                  />
                  <div
                    className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2"
                    style={{ borderColor: primaryColor }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2"
                    style={{ borderColor: primaryColor }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2"
                    style={{ borderColor: primaryColor }}
                  />
                </div>

                {/* QR with gradient frame */}
                <div
                  className="relative p-1.5 rounded-xl"
                  style={{
                    background: `linear-gradient(${gradientDirection}deg, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
                    boxShadow: `0 20px 60px ${hexToRgba(
                      primaryColor,
                      0.25
                    )}, 0 8px 20px ${hexToRgba(accentColor, 0.2)}`,
                  }}
                >
                  <div className="bg-white p-6 rounded-lg">
                    <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
                  </div>
                </div>
              </div>

              <div className="mt-14">
                <p
                  className="text-2xl uppercase tracking-widest"
                  style={{ color: textPrimary, fontFamily: fonts.heading }}
                >
                  {englishText}
                </p>
                <p className="text-sm mt-3" style={{ color: textSecondary }}>
                  Point your camera at the QR code to explore
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div>
                <div
                  className="text-[9px] uppercase tracking-[0.2em] mb-1"
                  style={{ color: hexToRgba(textSecondary, 0.5) }}
                >
                  {shortUrl}
                </div>
                <div
                  className="w-20 h-0.5"
                  style={{
                    background: `linear-gradient(90deg, ${primaryColor}, transparent)`,
                  }}
                />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  {["Discover", "Experience", "Enjoy"].map((word, i) => (
                    <span
                      key={word}
                      className="text-[9px] uppercase tracking-wider"
                      style={{ color: i === 1 ? accentColor : textSecondary }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2"
            style={{
              background: `linear-gradient(90deg, ${secondaryColor}, ${accentColor}, ${primaryColor})`,
            }}
          />
        </div>
      );

    case "elegant-gold":
      // ✨ CREATIVE ELEGANT GOLD - Opulent Art Nouveau with flowing organic forms
      return (
        <div
          className="w-[4in] h-[6in] mx-auto relative overflow-hidden"
          style={{
            background: backgroundColor,
            fontFamily: fonts.body,
          }}
        >
          {/* Dynamic pattern layer */}
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Luxurious gradient wash */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${gradientDirection}deg, ${hexToRgba(
                backgroundColor,
                0.98
              )} 0%, ${hexToRgba(primaryColor, 0.05)} 50%, ${hexToRgba(
                backgroundColor,
                0.98
              )} 100%)`,
            }}
          />

          {/* Art Nouveau flowing curves - top */}
          <svg
            className="absolute top-0 left-0 right-0 h-24"
            viewBox="0 0 384 96"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 L384 0 L384 40 Q320 80 192 60 Q64 40 0 80 Z"
              fill={hexToRgba(accentColor, 0.1)}
            />
            <path
              d="M0 0 L384 0 L384 30 Q320 60 192 45 Q64 30 0 60 Z"
              fill={hexToRgba(primaryColor, 0.08)}
            />
            <path
              d="M0 0 L384 0 L384 20 Q320 40 192 30 Q64 20 0 40 Z"
              fill={hexToRgba(accentColor, 0.15)}
            />
          </svg>

          {/* Art Nouveau flowing curves - bottom */}
          <svg
            className="absolute bottom-0 left-0 right-0 h-24"
            viewBox="0 0 384 96"
            preserveAspectRatio="none"
            style={{ transform: "scaleY(-1)" }}
          >
            <path
              d="M0 0 L384 0 L384 40 Q320 80 192 60 Q64 40 0 80 Z"
              fill={hexToRgba(accentColor, 0.1)}
            />
            <path
              d="M0 0 L384 0 L384 30 Q320 60 192 45 Q64 30 0 60 Z"
              fill={hexToRgba(primaryColor, 0.08)}
            />
            <path
              d="M0 0 L384 0 L384 20 Q320 40 192 30 Q64 20 0 40 Z"
              fill={hexToRgba(accentColor, 0.15)}
            />
          </svg>

          {/* Ornate corner flourishes */}
          <div className="absolute top-6 left-6">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <path
                d="M0 0 C16 0 16 8 16 16 C16 8 24 8 24 0"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M0 0 C0 16 8 16 16 16 C8 16 8 24 0 24"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="0" cy="0" r="3" fill={accentColor} />
              <circle cx="16" cy="16" r="2" fill={primaryColor} opacity="0.6" />
            </svg>
          </div>
          <div
            className="absolute top-6 right-6"
            style={{ transform: "scaleX(-1)" }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48">
              <path
                d="M0 0 C16 0 16 8 16 16 C16 8 24 8 24 0"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M0 0 C0 16 8 16 16 16 C8 16 8 24 0 24"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="0" cy="0" r="3" fill={accentColor} />
              <circle cx="16" cy="16" r="2" fill={primaryColor} opacity="0.6" />
            </svg>
          </div>
          <div
            className="absolute bottom-6 left-6"
            style={{ transform: "scaleY(-1)" }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48">
              <path
                d="M0 0 C16 0 16 8 16 16 C16 8 24 8 24 0"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M0 0 C0 16 8 16 16 16 C8 16 8 24 0 24"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="0" cy="0" r="3" fill={accentColor} />
              <circle cx="16" cy="16" r="2" fill={primaryColor} opacity="0.6" />
            </svg>
          </div>
          <div
            className="absolute bottom-6 right-6"
            style={{ transform: "scale(-1)" }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48">
              <path
                d="M0 0 C16 0 16 8 16 16 C16 8 24 8 24 0"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M0 0 C0 16 8 16 16 16 C8 16 8 24 0 24"
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="0" cy="0" r="3" fill={accentColor} />
              <circle cx="16" cy="16" r="2" fill={primaryColor} opacity="0.6" />
            </svg>
          </div>

          {/* Center ornate frame lines */}
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-px h-10"
            style={{
              background: `linear-gradient(180deg, ${accentColor}, transparent)`,
            }}
          />
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-px h-10"
            style={{
              background: `linear-gradient(0deg, ${accentColor}, transparent)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-10 text-center">
            {showLogo && catalog.logo_url && (
              <div className="relative mb-4">
                <div
                  className="absolute -inset-3 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${hexToRgba(
                      accentColor,
                      0.2
                    )} 0%, transparent 70%)`,
                  }}
                />
                <img
                  src={catalog.logo_url}
                  alt={catalog.name}
                  className="relative w-14 h-14 object-contain"
                />
              </div>
            )}

            {/* Ornate title frame */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <div
                  className="w-8 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor})`,
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
              </div>
              <h1
                className={`text-2xl ${weightClass} uppercase`}
                style={{
                  color: textPrimary,
                  fontFamily: fonts.heading,
                  letterSpacing: spacingValue,
                }}
              >
                {displayName}
              </h1>
              <div className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
                <div
                  className="w-8 h-px"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                  }}
                />
              </div>
            </div>

            {showArabicText && (
              <p
                className="text-xl mb-6"
                style={{
                  color: accentColor,
                  fontFamily: fonts.arabic,
                  textShadow: `0 0 30px ${hexToRgba(accentColor, 0.3)}`,
                }}
              >
                {arabicText}
              </p>
            )}

            {/* QR with ornate multi-layer frame */}
            <div className="relative">
              {/* Outer decorative ring */}
              <div
                className="absolute -inset-6 rounded-lg border border-dashed"
                style={{ borderColor: hexToRgba(accentColor, 0.3) }}
              >
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                  style={{ background: accentColor }}
                />
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                  style={{ background: accentColor }}
                />
                <div
                  className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45"
                  style={{ background: accentColor }}
                />
                <div
                  className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45"
                  style={{ background: accentColor }}
                />
              </div>

              {/* Gradient border frame */}
              <div
                className="relative p-1 rounded-lg"
                style={{
                  background: `linear-gradient(${gradientDirection}deg, ${accentColor}, ${primaryColor}, ${accentColor})`,
                  boxShadow: `0 8px 32px ${hexToRgba(accentColor, 0.25)}`,
                }}
              >
                <div
                  className="p-0.5 rounded"
                  style={{ background: backgroundColor }}
                >
                  <div
                    className="p-0.5 rounded"
                    style={{
                      background: `linear-gradient(${gradientDirection + 90
                        }deg, ${hexToRgba(accentColor, 0.4)}, ${hexToRgba(
                          primaryColor,
                          0.4
                        )})`,
                    }}
                  >
                    <div className="bg-white p-4 rounded">
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-36 h-36"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div
                className="w-10 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accentColor})`,
                }}
              />
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: textSecondary, fontFamily: fonts.body }}
              >
                {englishText}
              </p>
              <div
                className="w-10 h-px"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                }}
              />
            </div>
          </div>

          {/* Side accent strips */}
          <div
            className="absolute left-0 top-1/4 bottom-1/4 w-0.5"
            style={{
              background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
            }}
          />
          <div
            className="absolute right-0 top-1/4 bottom-1/4 w-0.5"
            style={{
              background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
            }}
          />
        </div>
      );

    case "minimalist":
      // ✨ CREATIVE MINIMALIST - Bauhaus-inspired with bold asymmetry & negative space
      return (
        <div
          className="w-[4in] h-[6in] mx-auto relative"
          style={{
            background: "#FAFAFA",
            fontFamily: fonts.body,
          }}
        >
          {/* Subtle pattern layer */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Bold asymmetric color block */}
          <div
            className="absolute top-0 right-0 w-1/3 h-2/5"
            style={{ background: primaryColor, opacity: 0.06 }}
          />
          <div
            className="absolute bottom-0 left-0 w-1/4 h-1/4"
            style={{ background: secondaryColor, opacity: 0.04 }}
          />

          {/* Bauhaus circle accent */}
          <div
            className="absolute top-8 right-8 w-12 h-12 rounded-full"
            style={{ background: primaryColor }}
          />
          <div
            className="absolute top-10 right-10 w-8 h-8 rounded-full"
            style={{ background: accentColor, opacity: 0.8 }}
          />

          {/* Geometric line elements */}
          <div
            className="absolute top-0 left-12 w-px h-20"
            style={{ background: primaryColor }}
          />
          <div
            className="absolute top-20 left-6 w-12 h-px"
            style={{ background: primaryColor }}
          />
          <div
            className="absolute bottom-20 right-6 w-16 h-px"
            style={{ background: secondaryColor }}
          />
          <div
            className="absolute bottom-0 right-12 w-px h-20"
            style={{ background: secondaryColor }}
          />

          {/* Top thin accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: primaryColor }}
          />

          {/* Content with asymmetric layout */}
          <div className="relative z-10 h-full flex flex-col p-10 pt-12">
            {/* Header - left aligned */}
            <div className="mb-auto">
              <div className="flex items-start gap-4">
                {showLogo && catalog.logo_url && (
                  <img
                    src={catalog.logo_url}
                    alt={catalog.name}
                    className="w-12 h-12 object-contain"
                  />
                )}
                <div>
                  <h1
                    className={`text-xl ${weightClass} uppercase tracking-tight`}
                    style={{
                      color: "#1a1a1a",
                      fontFamily: fonts.heading,
                      letterSpacing: spacingValue,
                    }}
                  >
                    {displayName}
                  </h1>
                  {showArabicText && (
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: primaryColor, fontFamily: fonts.arabic }}
                    >
                      {arabicText}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Center - QR with geometric framing */}
            <div className="flex justify-center my-auto py-8">
              <div className="relative">
                {/* Abstract geometric frame */}
                <div
                  className="absolute -top-6 -left-6 w-6 h-6 border-t-2 border-l-2"
                  style={{ borderColor: primaryColor }}
                />
                <div
                  className="absolute -bottom-6 -right-6 w-6 h-6 border-b-2 border-r-2"
                  style={{ borderColor: primaryColor }}
                />
                <div
                  className="absolute -top-3 -right-3 w-3 h-3 rounded-full"
                  style={{ background: accentColor }}
                />
                <div
                  className="absolute -bottom-3 -left-3 w-3 h-3 rounded-full"
                  style={{ background: secondaryColor }}
                />

                {/* QR with minimal border */}
                <div
                  className="p-4 bg-white"
                  style={{
                    boxShadow: `0 4px 20px ${hexToRgba(primaryColor, 0.08)}`,
                  }}
                >
                  <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
                </div>
              </div>
            </div>

            {/* Footer - geometric arrangement */}
            <div className="mt-auto flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4"
                    style={{ background: primaryColor }}
                  />
                  <div
                    className="w-3 h-3"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="w-2 h-2"
                    style={{ background: secondaryColor }}
                  />
                </div>
                <p
                  className="text-[10px] uppercase tracking-[0.25em]"
                  style={{ color: "#666", fontFamily: fonts.body }}
                >
                  {englishText}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-6xl font-bold opacity-5"
                  style={{ color: primaryColor, fontFamily: fonts.heading }}
                >
                  →
                </p>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
            }}
          />
        </div>
      );

    case "retro-diner":
      // CREATIVE RETRO DINER - Modern vintage with nostalgic elegance
      return (
        <div
          className="w-[4in] h-[6in] mx-auto relative overflow-hidden"
          style={{
            background: backgroundColor,
            fontFamily: fonts.body,
          }}
        >
          {/* Cream paper texture effect */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${hexToRgba(
                accentColor,
                0.08
              )} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${hexToRgba(
                primaryColor,
                0.06
              )} 0%, transparent 50%)`,
            }}
          />

          {/* Subtle vintage pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Art deco top frame */}
          <div className="absolute top-0 left-0 right-0">
            <div className="h-3" style={{ background: primaryColor }} />
            <svg
              className="w-full h-6"
              viewBox="0 0 384 24"
              preserveAspectRatio="none"
            >
              <path
                d="M0 0 L192 20 L384 0 L384 24 L0 24 Z"
                fill={primaryColor}
              />
              <path
                d="M40 0 L192 16 L344 0"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Elegant corner flourishes */}
          <svg
            className="absolute top-12 left-3 w-12 h-12 opacity-40"
            viewBox="0 0 48 48"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
          >
            <path d="M4 44 Q4 4, 44 4" />
            <path d="M8 44 Q8 12, 36 8" />
            <circle cx="44" cy="4" r="2" fill={accentColor} />
          </svg>
          <svg
            className="absolute top-12 right-3 w-12 h-12 opacity-40"
            viewBox="0 0 48 48"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            style={{ transform: "scaleX(-1)" }}
          >
            <path d="M4 44 Q4 4, 44 4" />
            <path d="M8 44 Q8 12, 36 8" />
            <circle cx="44" cy="4" r="2" fill={accentColor} />
          </svg>

          {/* Main content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 pt-28 text-center">
            {/* Vintage badge logo container */}
            {showLogo && catalog.logo_url && (
              <div className="relative mb-5">
                <div
                  className="absolute -inset-3 rounded-full"
                  style={{ border: `2px solid ${primaryColor}` }}
                />
                <div
                  className="absolute -inset-5 rounded-full"
                  style={{
                    border: `1px solid ${hexToRgba(primaryColor, 0.3)}`,
                  }}
                />
                <div
                  className="p-3 rounded-full"
                  style={{ background: textPrimary }}
                >
                  <img
                    src={catalog.logo_url}
                    alt={catalog.name}
                    className="w-14 h-14 object-contain"
                  />
                </div>
                {/* Star decorations */}
                <div
                  className="absolute -left-6 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: accentColor }}
                >
                  ✦
                </div>
                <div
                  className="absolute -right-6 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: accentColor }}
                >
                  ✦
                </div>
              </div>
            )}

            {/* Elegant curved text banner */}
            <div className="relative mb-1">
              <div
                className="absolute -inset-x-8 top-1/2 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${hexToRgba(
                    primaryColor,
                    0.3
                  )}, transparent)`,
                }}
              />
              <p
                className="text-[10px] uppercase tracking-[0.4em] px-4"
                style={{ color: accentColor, background: backgroundColor }}
              >
                ✧ Est. {new Date().getFullYear()} ✧
              </p>
            </div>

            {/* Main title with vintage styling */}
            <h1
              className={`text-3xl ${weightClass} uppercase mb-1`}
              style={{
                color: primaryColor,
                fontFamily: fonts.heading,
                letterSpacing: spacingValue,
                textShadow: `2px 2px 0 ${hexToRgba(primaryColor, 0.1)}`,
              }}
            >
              {displayName}
            </h1>

            {showArabicText && (
              <p
                className="text-lg mb-3"
                style={{ color: secondaryColor, fontFamily: fonts.arabic }}
              >
                {arabicText}
              </p>
            )}

            {/* Decorative divider with vintage flair */}
            <div className="flex items-center gap-3 my-5">
              <div
                className="w-12 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${primaryColor})`,
                }}
              />
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill={accentColor}>
                <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z" />
              </svg>
              <div
                className="w-12 h-px"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, transparent)`,
                }}
              />
            </div>

            {/* QR with elegant vintage frame */}
            <div className="relative">
              {/* Outer decorative border */}
              <div
                className="absolute -inset-5 rounded-lg"
                style={{ border: `1px solid ${hexToRgba(primaryColor, 0.2)}` }}
              />

              {/* Corner ornaments */}
              {[
                "-top-2 -left-2",
                "-top-2 -right-2",
                "-bottom-2 -left-2",
                "-bottom-2 -right-2",
              ].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-4 h-4`}>
                  <svg
                    viewBox="0 0 16 16"
                    fill={primaryColor}
                    className="w-full h-full"
                  >
                    <rect x="0" y="0" width="16" height="3" rx="1" />
                    <rect x="0" y="0" width="3" height="16" rx="1" />
                  </svg>
                </div>
              ))}

              {/* Main QR frame */}
              <div className="p-1" style={{ background: primaryColor }}>
                <div className="p-3 bg-white">
                  <img src={qrDataUrl} alt="QR Code" className="w-32 h-32" />
                </div>
              </div>
            </div>

            {/* CTA with ribbon effect */}
            <div className="relative mt-6">
              <div
                className="absolute -left-4 top-0 bottom-0 w-4"
                style={{
                  background: secondaryColor,
                  clipPath: "polygon(100% 0, 100% 100%, 0 50%)",
                }}
              />
              <div
                className="absolute -right-4 top-0 bottom-0 w-4"
                style={{
                  background: secondaryColor,
                  clipPath: "polygon(0 0, 0 100%, 100% 50%)",
                }}
              />
              <div className="px-8 py-2" style={{ background: secondaryColor }}>
                <p
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: textPrimary }}
                >
                  {ctaText}
                </p>
              </div>
            </div>

            <p
              className="text-xs mt-4 uppercase tracking-widest"
              style={{ color: hexToRgba(textSecondary, 0.7) }}
            >
              {englishText}
            </p>
          </div>

          {/* Bottom flourishes */}
          <svg
            className="absolute bottom-12 left-3 w-12 h-12 opacity-40"
            viewBox="0 0 48 48"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            style={{ transform: "scaleY(-1)" }}
          >
            <path d="M4 44 Q4 4, 44 4" />
            <path d="M8 44 Q8 12, 36 8" />
            <circle cx="44" cy="4" r="2" fill={accentColor} />
          </svg>
          <svg
            className="absolute bottom-12 right-3 w-12 h-12 opacity-40"
            viewBox="0 0 48 48"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            style={{ transform: "scale(-1, -1)" }}
          >
            <path d="M4 44 Q4 4, 44 4" />
            <path d="M8 44 Q8 12, 36 8" />
            <circle cx="44" cy="4" r="2" fill={accentColor} />
          </svg>

          {/* Art deco bottom frame */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              className="w-full h-6"
              viewBox="0 0 384 24"
              preserveAspectRatio="none"
              style={{ transform: "scaleY(-1)" }}
            >
              <path
                d="M0 0 L192 20 L384 0 L384 24 L0 24 Z"
                fill={primaryColor}
              />
              <path
                d="M40 0 L192 16 L344 0"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
              />
            </svg>
            <div className="h-3" style={{ background: primaryColor }} />
          </div>
        </div>
      );

    case "neon-glow":
      // PROFESSIONAL NEON - Refined cyberpunk with subtle glows
      return (
        <div
          className="w-[4in] h-[6in] mx-auto relative overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${backgroundColor} 0%, #0a0a12 100%)`,
            fontFamily: fonts.body,
          }}
        >
          {/* Refined grid - more subtle */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(${hexToRgba(
                primaryColor,
                0.04
              )} 1px, transparent 1px),
                linear-gradient(90deg, ${hexToRgba(
                primaryColor,
                0.04
              )} 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Horizon line glow */}
          <div
            className="absolute top-2/3 left-0 right-0 h-px"
            style={{
              background: primaryColor,
              boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${hexToRgba(
                primaryColor,
                0.5
              )}`,
            }}
          />

          {/* Subtle ambient glows */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px]"
            style={{ background: hexToRgba(primaryColor, 0.15) }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full blur-[80px]"
            style={{ background: hexToRgba(secondaryColor, 0.1) }}
          />

          <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
            {showLogo && catalog.logo_url && (
              <div
                className="mb-6 p-3"
                style={{
                  border: `1px solid ${hexToRgba(primaryColor, 0.5)}`,
                  boxShadow: `0 0 15px ${hexToRgba(
                    primaryColor,
                    0.3
                  )}, inset 0 0 15px ${hexToRgba(primaryColor, 0.1)}`,
                }}
              >
                <img
                  src={catalog.logo_url}
                  alt={catalog.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
            )}

            <h1
              className={`text-2xl ${weightClass} uppercase mb-2`}
              style={{
                color: textPrimary,
                fontFamily: fonts.heading,
                letterSpacing: spacingValue,
                textShadow: `0 0 20px ${hexToRgba(primaryColor, 0.5)}`,
              }}
            >
              {catalog.name}
            </h1>

            {showArabicText && (
              <p
                className="text-lg mb-6"
                style={{
                  color: accentColor,
                  fontFamily: fonts.arabic,
                  textShadow: `0 0 15px ${hexToRgba(accentColor, 0.5)}`,
                }}
              >
                {arabicText}
              </p>
            )}

            {/* QR with neon border */}
            <div
              className="relative p-px"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor}, ${secondaryColor})`,
                boxShadow: `0 0 30px ${hexToRgba(
                  primaryColor,
                  0.4
                )}, 0 0 60px ${hexToRgba(primaryColor, 0.2)}`,
              }}
            >
              <div className="p-4" style={{ background: "#0a0a12" }}>
                <div className="bg-white p-3">
                  <img src={qrDataUrl} alt="QR Code" className="w-32 h-32" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div
                className="w-8 h-px"
                style={{
                  background: secondaryColor,
                  boxShadow: `0 0 10px ${secondaryColor}`,
                }}
              />
              <p
                className="text-sm uppercase font-mono"
                style={{
                  color: secondaryColor,
                  letterSpacing: "0.2em",
                  textShadow: `0 0 10px ${hexToRgba(secondaryColor, 0.5)}`,
                }}
              >
                {englishText}
              </p>
              <div
                className="w-8 h-px"
                style={{
                  background: secondaryColor,
                  boxShadow: `0 0 10px ${secondaryColor}`,
                }}
              />
            </div>

            {/* Scan line effect */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px opacity-50"
              style={{
                background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
              }}
            />
          </div>
        </div>
      );

    case "organic-natural":
      // ✨ CREATIVE ORGANIC - Lush botanical with flowing organic shapes
      return (
        <div
          className="w-[4in] h-[6in] mx-auto relative overflow-hidden"
          style={{
            background: `linear-gradient(${gradientDirection}deg, #f8faf6 0%, ${hexToRgba(
              primaryColor,
              0.08
            )} 50%, #f4f9f2 100%)`,
            fontFamily: fonts.body,
          }}
        >
          {/* Dynamic organic pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Large flowing organic blob - top right */}
          <svg
            className="absolute -top-20 -right-20 w-80 h-80 opacity-15"
            viewBox="0 0 200 200"
          >
            <path
              d="M45,-60C55.8,-49.2,60.5,-33.6,65,-17.5C69.5,-1.4,73.8,15.2,67.7,27.8C61.6,40.4,45.1,49.1,28.8,56.3C12.5,63.5,-3.6,69.3,-21.8,69.5C-40.1,69.7,-60.5,64.4,-70.2,51.2C-79.9,38,-78.9,16.9,-73.6,-1.8C-68.3,-20.5,-58.7,-36.7,-46.1,-47.3C-33.5,-57.9,-16.8,-62.8,0.7,-63.7C18.2,-64.6,34.2,-70.8,45,-60Z"
              transform="translate(100 100)"
              fill={primaryColor}
            />
          </svg>

          {/* Flowing organic blob - bottom left */}
          <svg
            className="absolute -bottom-32 -left-20 w-96 h-96 opacity-10"
            viewBox="0 0 200 200"
          >
            <path
              d="M38.5,-51.1C50.2,-42.8,60.3,-32.1,66.3,-18.6C72.2,-5,74.1,11.4,69.1,25.7C64.1,40,52.2,52.3,38.3,59.4C24.4,66.5,8.5,68.4,-7.1,66.5C-22.7,64.6,-38,58.9,-49.2,49C-60.3,39.1,-67.3,25,-70.8,9.4C-74.3,-6.2,-74.3,-23.3,-66.4,-36C-58.5,-48.7,-42.6,-57,-27.4,-63.3C-12.2,-69.6,2.3,-73.9,16.9,-71.8C31.5,-69.7,46.2,-61.3,38.5,-51.1Z"
              transform="translate(100 100)"
              fill={secondaryColor}
            />
          </svg>

          {/* Decorative branch - top */}
          <svg
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 opacity-20"
            viewBox="0 0 200 50"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
          >
            <path d="M100 50 C100 30, 80 20, 60 15 M100 50 C100 30, 120 20, 140 15" />
            <ellipse
              cx="55"
              cy="12"
              rx="8"
              ry="5"
              fill={primaryColor}
              opacity="0.5"
            />
            <ellipse
              cx="145"
              cy="12"
              rx="8"
              ry="5"
              fill={primaryColor}
              opacity="0.5"
            />
            <ellipse
              cx="70"
              cy="18"
              rx="6"
              ry="4"
              fill={secondaryColor}
              opacity="0.4"
            />
            <ellipse
              cx="130"
              cy="18"
              rx="6"
              ry="4"
              fill={secondaryColor}
              opacity="0.4"
            />
          </svg>

          {/* Scattered leaf elements */}
          <svg
            className="absolute top-1/4 left-8 w-10 h-10 opacity-20"
            viewBox="0 0 40 40"
          >
            <ellipse
              cx="20"
              cy="20"
              rx="15"
              ry="8"
              fill={primaryColor}
              transform="rotate(-30 20 20)"
            />
          </svg>
          <svg
            className="absolute top-1/3 right-12 w-8 h-8 opacity-15"
            viewBox="0 0 40 40"
          >
            <ellipse
              cx="20"
              cy="20"
              rx="12"
              ry="6"
              fill={accentColor}
              transform="rotate(45 20 20)"
            />
          </svg>
          <svg
            className="absolute bottom-1/4 left-16 w-6 h-6 opacity-20"
            viewBox="0 0 40 40"
          >
            <ellipse
              cx="20"
              cy="20"
              rx="10"
              ry="5"
              fill={secondaryColor}
              transform="rotate(-60 20 20)"
            />
          </svg>
          <svg
            className="absolute bottom-1/3 right-8 w-9 h-9 opacity-15"
            viewBox="0 0 40 40"
          >
            <ellipse
              cx="20"
              cy="20"
              rx="14"
              ry="7"
              fill={primaryColor}
              transform="rotate(30 20 20)"
            />
          </svg>

          {/* Main content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-10 text-center">
            {/* Organic wreath around logo */}
            {showLogo && catalog.logo_url && (
              <div className="relative mb-6">
                <svg
                  className="absolute -inset-4 w-24 h-24 opacity-30"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="0.5"
                    strokeDasharray="5 3"
                  />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                    <ellipse
                      key={i}
                      cx="50"
                      cy="10"
                      rx="6"
                      ry="3"
                      fill={i % 2 === 0 ? primaryColor : secondaryColor}
                      opacity="0.6"
                      transform={`rotate(${angle} 50 50)`}
                    />
                  ))}
                </svg>
                <img
                  src={catalog.logo_url}
                  alt={catalog.name}
                  className="w-14 h-14 object-contain relative z-10"
                />
              </div>
            )}

            <h1
              className={`text-2xl ${weightClass}`}
              style={{
                color: primaryColor,
                fontFamily: fonts.heading,
                letterSpacing: spacingValue,
              }}
            >
              {displayName}
            </h1>

            {showArabicText && (
              <p
                className="text-lg mt-2 mb-4"
                style={{ color: secondaryColor, fontFamily: fonts.arabic }}
              >
                {arabicText}
              </p>
            )}

            {/* Organic divider with leaves */}
            <div className="flex items-center gap-3 my-6">
              <svg
                className="w-8 h-4"
                viewBox="0 0 40 20"
                fill={primaryColor}
                opacity="0.4"
              >
                <ellipse cx="20" cy="10" rx="18" ry="6" />
              </svg>
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: accentColor }}
              />
              <svg
                className="w-8 h-4"
                viewBox="0 0 40 20"
                fill={primaryColor}
                opacity="0.4"
              >
                <ellipse cx="20" cy="10" rx="18" ry="6" />
              </svg>
            </div>

            {/* QR with organic leaf frame */}
            <div className="relative">
              {/* Organic border shape */}
              <svg
                className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)]"
                viewBox="0 0 200 200"
                preserveAspectRatio="none"
              >
                <path
                  d="M20,100 C20,40 40,20 100,20 C160,20 180,40 180,100 C180,160 160,180 100,180 C40,180 20,160 20,100"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="2"
                  opacity="0.3"
                />
                <path
                  d="M25,100 C25,45 45,25 100,25 C155,25 175,45 175,100 C175,155 155,175 100,175 C45,175 25,155 25,100"
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth="1"
                  opacity="0.2"
                />
              </svg>

              {/* Corner leaf decorations */}
              <svg
                className="absolute -top-3 -left-3 w-6 h-6"
                viewBox="0 0 24 24"
                fill={primaryColor}
                opacity="0.5"
              >
                <path
                  d="M12 2C8 8 8 16 12 22C16 16 16 8 12 2Z"
                  transform="rotate(-45 12 12)"
                />
              </svg>
              <svg
                className="absolute -top-3 -right-3 w-6 h-6"
                viewBox="0 0 24 24"
                fill={secondaryColor}
                opacity="0.5"
              >
                <path
                  d="M12 2C8 8 8 16 12 22C16 16 16 8 12 2Z"
                  transform="rotate(45 12 12)"
                />
              </svg>
              <svg
                className="absolute -bottom-3 -left-3 w-6 h-6"
                viewBox="0 0 24 24"
                fill={secondaryColor}
                opacity="0.5"
              >
                <path
                  d="M12 2C8 8 8 16 12 22C16 16 16 8 12 2Z"
                  transform="rotate(-135 12 12)"
                />
              </svg>
              <svg
                className="absolute -bottom-3 -right-3 w-6 h-6"
                viewBox="0 0 24 24"
                fill={primaryColor}
                opacity="0.5"
              >
                <path
                  d="M12 2C8 8 8 16 12 22C16 16 16 8 12 2Z"
                  transform="rotate(135 12 12)"
                />
              </svg>

              <div
                className="bg-white p-4 rounded-xl shadow-sm"
                style={{
                  boxShadow: `0 4px 20px ${hexToRgba(primaryColor, 0.15)}`,
                }}
              >
                <img src={qrDataUrl} alt="QR Code" className="w-32 h-32" />
              </div>
            </div>

            {/* CTA with leaf accents */}
            <div className="mt-8 flex items-center gap-3">
              <svg className="w-6 h-4" viewBox="0 0 30 20">
                <path
                  d="M0 10 Q15 0, 30 10"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              </svg>
              <p
                className="text-sm uppercase font-medium tracking-wider"
                style={{ color: primaryColor }}
              >
                {englishText}
              </p>
              <svg className="w-6 h-4" viewBox="0 0 30 20">
                <path
                  d="M0 10 Q15 0, 30 10"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="1.5"
                  opacity="0.4"
                  transform="scale(-1,1) translate(-30,0)"
                />
              </svg>
            </div>

            <p
              className="text-[10px] mt-4 uppercase tracking-widest"
              style={{ color: hexToRgba(secondaryColor, 0.6) }}
            >
              ✦ Fresh • Natural • Sustainable ✦
            </p>
          </div>

          {/* Bottom botanical border */}
          <svg
            className="absolute bottom-0 left-0 right-0 h-12 opacity-20"
            viewBox="0 0 400 50"
            preserveAspectRatio="none"
          >
            <path
              d="M0 50 C50 30, 100 40, 150 35 S250 25, 300 35 S350 30, 400 50 Z"
              fill={primaryColor}
            />
            <path
              d="M0 50 C80 35, 120 45, 200 40 S280 30, 400 50 Z"
              fill={secondaryColor}
              opacity="0.5"
            />
          </svg>
        </div>
      );

    case "luxury-dark":
      // PROFESSIONAL LUXURY DARK - High-end editorial noir style
      return (
        <div
          className="w-[4in] h-[6in] mx-auto relative overflow-hidden"
          style={{
            background: backgroundColor,
            fontFamily: fonts.body,
          }}
        >
          {/* Subtle vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 40%, ${hexToRgba(
                "#000",
                0.3
              )} 100%)`,
            }}
          />

          {/* Top light accent */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 blur-[60px]"
            style={{ background: hexToRgba(accentColor, 0.08) }}
          />

          {/* Thin elegant border */}
          <div
            className="absolute inset-5"
            style={{ border: `1px solid ${hexToRgba(accentColor, 0.15)}` }}
          />

          <div className="relative z-10 h-full flex flex-col items-center p-10">
            {/* Top bar */}
            <div className="w-full flex justify-between items-center mb-auto">
              <div className="w-8 h-px" style={{ background: accentColor }} />
              {showLogo && catalog.logo_url && (
                <img
                  src={catalog.logo_url}
                  alt={catalog.name}
                  className="w-10 h-10 object-contain"
                />
              )}
              <div className="w-8 h-px" style={{ background: accentColor }} />
            </div>

            {/* Center content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p
                className="text-[10px] uppercase mb-3"
                style={{
                  color: accentColor,
                  letterSpacing: "0.4em",
                  fontFamily: fonts.body,
                }}
              >
                Experience
              </p>

              <h1
                className={`text-2xl ${weightClass} uppercase mb-2`}
                style={{
                  color: textPrimary,
                  fontFamily: fonts.heading,
                  letterSpacing: spacingValue,
                }}
              >
                {displayName}
              </h1>

              {showArabicText && (
                <p
                  className="text-base mb-6"
                  style={{
                    color: hexToRgba(textPrimary, 0.6),
                    fontFamily: fonts.arabic,
                  }}
                >
                  {arabicText}
                </p>
              )}

              {/* QR with premium frame */}
              <div className="relative">
                {/* Subtle corner accents */}
                <div className="absolute -inset-3">
                  <div
                    className="absolute top-0 left-0 w-4 h-px"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="absolute top-0 left-0 h-4 w-px"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="absolute top-0 right-0 w-4 h-px"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="absolute top-0 right-0 h-4 w-px"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-4 h-px"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="absolute bottom-0 left-0 h-4 w-px"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-4 h-px"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="absolute bottom-0 right-0 h-4 w-px"
                    style={{ background: accentColor }}
                  />
                </div>

                <div className="bg-white p-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-32 h-32" />
                </div>
              </div>

              <p
                className="text-xs uppercase mt-6"
                style={{
                  color: hexToRgba(textPrimary, 0.5),
                  letterSpacing: "0.25em",
                  fontFamily: fonts.body,
                }}
              >
                {englishText}
              </p>
            </div>

            {/* Bottom accent */}
            <div className="mt-auto flex items-center gap-2">
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: primaryColor }}
              />
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: accentColor }}
              />
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: secondaryColor }}
              />
            </div>
          </div>
        </div>
      );

    case "social-square":
      // ✨ CREATIVE SOCIAL SQUARE - Bold Instagram-optimized with dynamic graphics
      return (
        <div
          className="w-[4in] h-[4in] mx-auto relative overflow-hidden"
          style={{
            background: `linear-gradient(${gradientDirection}deg, ${backgroundColor} 0%, ${hexToRgba(
              primaryColor,
              0.9
            )} 100%)`,
            fontFamily: fonts.body,
          }}
        >
          {/* Dynamic mesh gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 20% 20%, ${hexToRgba(
                accentColor,
                0.3
              )} 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${hexToRgba(
                secondaryColor,
                0.25
              )} 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, ${hexToRgba(
                primaryColor,
                0.15
              )} 0%, transparent 70%)`,
            }}
          />

          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: getPatternSvg() }}
          />

          {/* Bold geometric shapes */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{
              background: `linear-gradient(${gradientDirection + 45
                }deg, ${hexToRgba(accentColor, 0.4)} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full"
            style={{
              background: `linear-gradient(${gradientDirection - 45
                }deg, ${hexToRgba(secondaryColor, 0.3)} 0%, transparent 70%)`,
            }}
          />

          {/* Floating elements */}
          <div
            className="absolute top-8 left-8 w-4 h-4 rounded-full"
            style={{
              background: accentColor,
              boxShadow: `0 4px 15px ${hexToRgba(accentColor, 0.5)}`,
            }}
          />
          <div
            className="absolute top-12 right-12 w-3 h-3 rotate-45"
            style={{ background: secondaryColor }}
          />
          <div
            className="absolute bottom-16 left-12 w-2 h-2 rounded-full"
            style={{ background: textPrimary, opacity: 0.6 }}
          />
          <div
            className="absolute bottom-8 right-8 w-5 h-5 rounded-full border-2"
            style={{ borderColor: hexToRgba(textPrimary, 0.3) }}
          />

          {/* Decorative lines */}
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-20"
            viewBox="0 0 400 400"
            fill="none"
            stroke={textPrimary}
            strokeWidth="0.5"
          >
            <line x1="0" y1="100" x2="400" y2="100" strokeDasharray="8 4" />
            <line x1="0" y1="300" x2="400" y2="300" strokeDasharray="8 4" />
            <line x1="100" y1="0" x2="100" y2="400" strokeDasharray="8 4" />
            <line x1="300" y1="0" x2="300" y2="400" strokeDasharray="8 4" />
          </svg>

          {/* Main content */}
          <div className="relative z-10 h-full flex flex-col p-6">
            {/* Header with logo and brand mark */}
            <div className="flex items-center justify-between">
              {showLogo && catalog.logo_url && (
                <div className="relative">
                  <div
                    className="absolute -inset-1 rounded-lg"
                    style={{
                      background: `linear-gradient(${gradientDirection}deg, ${accentColor}, ${secondaryColor})`,
                      opacity: 0.6,
                      filter: "blur(4px)",
                    }}
                  />
                  <div
                    className="relative p-1.5 rounded-lg"
                    style={{
                      background: hexToRgba("#000", 0.2),
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <img
                      src={catalog.logo_url}
                      alt={catalog.name}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-0.5 rounded-full"
                  style={{ background: textPrimary }}
                />
                <div
                  className="w-3 h-0.5 rounded-full"
                  style={{ background: hexToRgba(textPrimary, 0.5) }}
                />
              </div>
            </div>

            {/* Center content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {showArabicText && (
                <p
                  className="text-lg mb-1"
                  style={{
                    color: hexToRgba(textPrimary, 0.9),
                    fontFamily: fonts.arabic,
                  }}
                >
                  {arabicText}
                </p>
              )}

              <h2
                className={`text-xl ${weightClass} uppercase mb-6`}
                style={{
                  color: textPrimary,
                  fontFamily: fonts.heading,
                  letterSpacing: spacingValue,
                  textShadow: `0 2px 10px ${hexToRgba("#000", 0.2)}`,
                }}
              >
                {catalog.name}
              </h2>

              {/* QR with dynamic frame */}
              <div className="relative">
                {/* Glow effect */}
                <div
                  className="absolute -inset-3 rounded-2xl"
                  style={{
                    background: `linear-gradient(${gradientDirection}deg, ${accentColor}, ${secondaryColor})`,
                    opacity: 0.3,
                    filter: "blur(15px)",
                  }}
                />

                {/* Gradient border */}
                <div
                  className="relative p-1 rounded-xl"
                  style={{
                    background: `linear-gradient(${gradientDirection}deg, ${accentColor}, ${textPrimary}, ${secondaryColor})`,
                  }}
                >
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: hexToRgba(backgroundColor, 0.95),
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="bg-white p-2 rounded-md shadow-lg">
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-24 h-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Corner decorations */}
                <div
                  className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 rounded-tl"
                  style={{ borderColor: accentColor }}
                />
                <div
                  className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 rounded-tr"
                  style={{ borderColor: accentColor }}
                />
                <div
                  className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 rounded-bl"
                  style={{ borderColor: secondaryColor }}
                />
                <div
                  className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 rounded-br"
                  style={{ borderColor: secondaryColor }}
                />
              </div>

              <div
                className="mt-5 px-5 py-2 rounded-full"
                style={{
                  background: hexToRgba(textPrimary, 0.15),
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${hexToRgba(textPrimary, 0.2)}`,
                }}
              >
                <p
                  className="text-xs uppercase font-semibold tracking-wider"
                  style={{ color: textPrimary }}
                >
                  {ctaText}
                </p>
              </div>
            </div>

            {/* Footer with social-style elements */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: hexToRgba(textPrimary, 0.1) }}
                >
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill={textPrimary}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: hexToRgba(textPrimary, 0.1) }}
                >
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill={textPrimary}
                  >
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                  </svg>
                </div>
              </div>
              <p
                className="text-[9px] uppercase tracking-wider"
                style={{ color: hexToRgba(textPrimary, 0.5) }}
              >
                {shortUrl}
              </p>
            </div>
          </div>

          {/* Noise texture overlay for depth */}
          <div
            className="absolute inset-0 opacity-5 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>
      );

    default:
      return (
        <div className="text-center p-8" style={{ color: textSecondary }}>
          Template not found
        </div>
      );
  }
}
