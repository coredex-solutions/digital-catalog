export interface ThemePalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
}

export type ThemeMethod = 'classic' | 'soft' | 'bold';

export interface ThemeMethodOption {
    id: ThemeMethod;
    name: string;
    description: string;
}

export const THEME_METHODS: ThemeMethodOption[] = [
    { id: 'classic', name: 'Classic Pro', description: 'Neutral foundation with your brand color as the main accent.' },
    { id: 'soft', name: 'Soft Wash', description: 'Surfaces and backgrounds inherit a soft, elegant tint of your brand.' },
    { id: 'bold', name: 'High Contrast', description: 'Deep, saturated colors that make your brand identity pop.' },
];

export const generateDynamicTheme = (brandColor: string, method: ThemeMethod = 'classic'): CatalogTheme => {
    // Helper to lighten/darken or add alpha if needed
    // For simplicity here, we'll return structured objects based on the method

    if (method === 'soft') {
        return {
            id: 'dynamic-soft',
            name: 'Soft Wash',
            description: 'Dynamic',
            light: {
                primary: brandColor,
                secondary: brandColor,
                accent: `${brandColor}22`,
                background: "#ffffff",
                surface: `${brandColor}08`, // 3% tint
                text: "#0f172a",
                textMuted: "#64748b",
            },
            dark: {
                primary: brandColor,
                secondary: brandColor,
                accent: `${brandColor}33`,
                background: "#020408",
                surface: `${brandColor}15`, // 8% tint
                text: "#f8fafc",
                textMuted: "#94a3b8",
            }
        };
    }

    if (method === 'bold') {
        return {
            id: 'dynamic-bold',
            name: 'High Contrast',
            description: 'Dynamic',
            light: {
                primary: brandColor,
                secondary: brandColor,
                accent: `${brandColor}33`,
                background: "#ffffff",
                surface: `${brandColor}15`, // 8% tint
                text: brandColor,
                textMuted: `${brandColor}bb`,
            },
            dark: {
                primary: brandColor,
                secondary: brandColor,
                accent: `${brandColor}44`,
                background: "#050505",
                surface: "#111111",
                text: "#ffffff",
                textMuted: "#94a3b8",
            }
        };
    }

    // Default: 'classic'
    return {
        id: 'dynamic-classic',
        name: 'Classic Pro',
        description: 'Dynamic',
        light: {
            primary: brandColor,
            secondary: brandColor,
            accent: `${brandColor}22`,
            background: "#ffffff",
            surface: "#f8fafc", // Clean Slate 50
            text: "#0f172a",
            textMuted: "#64748b",
        },
        dark: {
            primary: brandColor,
            secondary: brandColor,
            accent: `${brandColor}33`,
            background: "#0a0a0c",
            surface: "#121215",
            text: "#f8fafc",
            textMuted: "#94a3b8",
        }
    };
};

export interface CatalogTheme {
    id: string;
    name: string;
    description: string;
    light: ThemePalette;
    dark: ThemePalette;
}

export const CATALOG_THEMES: CatalogTheme[] = [
    {
        id: "botanical-mint",
        name: "Botanical Mint",
        description: "Elegant, organic, and sophisticated. Perfectly suited for healthy eateries and garden cafes.",
        light: {
            primary: "#059669", // Pro Emerald
            secondary: "#10b981",
            accent: "#10b98122", // Very light border
            background: "#ffffff",
            surface: "#f8fafc", // Safe Slate 50
            text: "#0f172a",
            textMuted: "#64748b",
        },
        dark: {
            primary: "#10b981",
            secondary: "#059669",
            accent: "#10b98133",
            background: "#020604",
            surface: "#080c0a",
            text: "#f8fafc",
            textMuted: "#94a3b8",
        }
    },
    {
        id: "onyx-gold",
        name: "Onyx & Gold",
        description: "The gold standard for luxury. A timeless palette for fine dining and boutique hotels.",
        light: {
            primary: "#92400e", // Professional Gold/Bronze
            secondary: "#b45309",
            accent: "#b4530922",
            background: "#ffffff",
            surface: "#fafaf9", // Safe Stone 50
            text: "#1c1917",
            textMuted: "#78716c",
        },
        dark: {
            primary: "#fbbf24",
            secondary: "#92400e",
            accent: "#f59e0b33",
            background: "#0c0a09",
            surface: "#171412",
            text: "#fafaf9",
            textMuted: "#a8a29e",
        }
    },
    {
        id: "silk-indigo",
        name: "Silk Indigo",
        description: "Modern, sharp, and clean. Engineered for contemporary retailers and upscale bars.",
        light: {
            primary: "#4338ca", // Pro Indigo
            secondary: "#4f46e5",
            accent: "#4f46e522",
            background: "#ffffff",
            surface: "#f9fafb", // Safe Gray 50
            text: "#111827",
            textMuted: "#6b7280",
        },
        dark: {
            primary: "#818cf8",
            secondary: "#4338ca",
            accent: "#6366f133",
            background: "#020410",
            surface: "#080a18",
            text: "#f9fafb",
            textMuted: "#94a3b8",
        }
    },
    {
        id: "bauhaus-mono",
        name: "Bauhaus Mono",
        description: "Pure, high-contrast monochrome. For brands that let their content speak for itself.",
        light: {
            primary: "#000000",
            secondary: "#1a1a1a",
            accent: "#00000011",
            background: "#ffffff",
            surface: "#f2f2f2",
            text: "#000000",
            textMuted: "#666666",
        },
        dark: {
            primary: "#ffffff",
            secondary: "#e5e5e5",
            accent: "#ffffff22",
            background: "#000000",
            surface: "#111111",
            text: "#ffffff",
            textMuted: "#999999",
        }
    },
    {
        id: "velvet-rose",
        name: "Velvet Rose",
        description: "Intimate and warm. Ideal for romantic bistros, wine bars, and patisseries.",
        light: {
            primary: "#be123c",
            secondary: "#e11d48",
            accent: "#e11d4815",
            background: "#ffffff",
            surface: "#fff1f2",
            text: "#4c0519",
            textMuted: "#fb7185",
        },
        dark: {
            primary: "#fb7185",
            secondary: "#be123c",
            accent: "#fb718522",
            background: "#050001",
            surface: "#110408",
            text: "#fff1f2",
            textMuted: "#fb718588",
        }
    },
    {
        id: "nordic-slate",
        name: "Nordic Slate",
        description: "Clean, cool, and minimalist. A professional palette for modern tech and Scandinavian design.",
        light: {
            primary: "#334155",
            secondary: "#475569",
            accent: "#47556915",
            background: "#ffffff",
            surface: "#f1f5f9",
            text: "#0f172a",
            textMuted: "#64748b",
        },
        dark: {
            primary: "#94a3b8",
            secondary: "#334155",
            accent: "#94a3b822",
            background: "#020305",
            surface: "#0a0c10",
            text: "#f1f5f9",
            textMuted: "#94a3b888",
        }
    },
    {
        id: "crimson-earth",
        name: "Crimson Earth",
        description: "Rustic and grounded earthy tones. Perfect for pizzerias and traditional grills.",
        light: {
            primary: "#9a3412",
            secondary: "#c2410c",
            accent: "#c2410c15",
            background: "#ffffff",
            surface: "#fff7ed",
            text: "#431407",
            textMuted: "#ea580c",
        },
        dark: {
            primary: "#fb923c",
            secondary: "#9a3412",
            accent: "#fb923c22",
            background: "#050201",
            surface: "#110905",
            text: "#fff7ed",
            textMuted: "#fb923c88",
        }
    },
    {
        id: "electric-violet",
        name: "Electric Violet",
        description: "Energetic and futuristic. Designed for gaming lounges, nightclubs, and Gen-Z retail.",
        light: {
            primary: "#6d28d9",
            secondary: "#7c3aed",
            accent: "#7c3aed15",
            background: "#ffffff",
            surface: "#f5f3ff",
            text: "#2e1065",
            textMuted: "#8b5cf6",
        },
        dark: {
            primary: "#a78bfa",
            secondary: "#6d28d9",
            accent: "#a78bfa22",
            background: "#030005",
            surface: "#0c0a13",
            text: "#f5f3ff",
            textMuted: "#a78bfa88",
        }
    }
];

export const DEFAULT_THEME_ID = "botanical-mint";
