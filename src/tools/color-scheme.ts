export const SCHEME_ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "tertiary",
  "onTertiary",
  "background",
  "surface",
] as const;

export type SchemeRole = (typeof SCHEME_ROLES)[number];

export type ColorSchemeCategory =
  | "content"
  | "expressive"
  | "fidelity"
  | "fruit-salad"
  | "monochrome"
  | "neutral"
  | "rainbow"
  | "tonal-spot"
  | "vibrant";

export interface GenerateColorSchemeOptions {
  seedColor: string;
  category: string;
  darkMode?: boolean;
  contrastLevel?: number;
}

type DynamicColor = {
  getArgb(scheme: DynamicScheme): number;
};

type MaterialDynamicColors = {
  primary(): DynamicColor;
  onPrimary(): DynamicColor;
  primaryContainer(): DynamicColor;
  onPrimaryContainer(): DynamicColor;
  secondary(): DynamicColor;
  onSecondary(): DynamicColor;
  tertiary(): DynamicColor;
  onTertiary(): DynamicColor;
  background(): DynamicColor;
  surface(): DynamicColor;
};

type DynamicScheme = {
  colors: MaterialDynamicColors;
};

type SchemeConstructor = new (
  sourceColorHct: unknown,
  isDark: boolean,
  contrastLevel: number
) => DynamicScheme;

const categoryAliases: Record<string, ColorSchemeCategory> = {
  content: "content",
  expressive: "expressive",
  fidelity: "fidelity",
  "fruit-salad": "fruit-salad",
  fruitsalad: "fruit-salad",
  "fruit salad": "fruit-salad",
  monochrome: "monochrome",
  neutral: "neutral",
  neutrals: "neutral",
  rainbow: "rainbow",
  "tonal-spot": "tonal-spot",
  "tonal spot": "tonal-spot",
  tonalspot: "tonal-spot",
  vibrant: "vibrant",
};

const colorRoleExtractors: Record<
  SchemeRole,
  (colors: MaterialDynamicColors, scheme: DynamicScheme) => number
> = {
  primary: (colors, scheme) => colors.primary().getArgb(scheme),
  onPrimary: (colors, scheme) => colors.onPrimary().getArgb(scheme),
  primaryContainer: (colors, scheme) =>
    colors.primaryContainer().getArgb(scheme),
  onPrimaryContainer: (colors, scheme) =>
    colors.onPrimaryContainer().getArgb(scheme),
  secondary: (colors, scheme) => colors.secondary().getArgb(scheme),
  onSecondary: (colors, scheme) => colors.onSecondary().getArgb(scheme),
  tertiary: (colors, scheme) => colors.tertiary().getArgb(scheme),
  onTertiary: (colors, scheme) => colors.onTertiary().getArgb(scheme),
  background: (colors, scheme) => colors.background().getArgb(scheme),
  surface: (colors, scheme) => colors.surface().getArgb(scheme),
};

type LoadedModules = {
  Hct: { fromInt(argb: number): unknown };
  argbFromHex(hex: string): number;
  hexFromArgb(argb: number): string;
  schemes: Record<ColorSchemeCategory, SchemeConstructor>;
};

let modulesPromise: Promise<LoadedModules> | null = null;

async function loadModules(): Promise<LoadedModules> {
  if (!modulesPromise) {
    modulesPromise = (async () => {
      const baseUrl = new URL(
        "../../material-color-utilities/typescript/",
        import.meta.url
      );

      const importModule = async <T>(relativePath: string) => {
        const url = new URL(relativePath, baseUrl);
        return (await import(url.href)) as T;
      };

      const [
        hctModule,
        stringUtilsModule,
        contentModule,
        expressiveModule,
        fidelityModule,
        fruitSaladModule,
        monochromeModule,
        neutralModule,
        rainbowModule,
        tonalSpotModule,
        vibrantModule,
      ] = await Promise.all([
        importModule<{ Hct: { fromInt(argb: number): unknown } }>(
          "hct/hct.js"
        ),
        importModule<{
          argbFromHex(hex: string): number;
          hexFromArgb(argb: number): string;
        }>("utils/string_utils.js"),
        importModule<{ SchemeContent: SchemeConstructor }>(
          "scheme/scheme_content.js"
        ),
        importModule<{ SchemeExpressive: SchemeConstructor }>(
          "scheme/scheme_expressive.js"
        ),
        importModule<{ SchemeFidelity: SchemeConstructor }>(
          "scheme/scheme_fidelity.js"
        ),
        importModule<{ SchemeFruitSalad: SchemeConstructor }>(
          "scheme/scheme_fruit_salad.js"
        ),
        importModule<{ SchemeMonochrome: SchemeConstructor }>(
          "scheme/scheme_monochrome.js"
        ),
        importModule<{ SchemeNeutral: SchemeConstructor }>(
          "scheme/scheme_neutral.js"
        ),
        importModule<{ SchemeRainbow: SchemeConstructor }>(
          "scheme/scheme_rainbow.js"
        ),
        importModule<{ SchemeTonalSpot: SchemeConstructor }>(
          "scheme/scheme_tonal_spot.js"
        ),
        importModule<{ SchemeVibrant: SchemeConstructor }>(
          "scheme/scheme_vibrant.js"
        ),
      ]);

      const schemes: Record<ColorSchemeCategory, SchemeConstructor> = {
        content: contentModule.SchemeContent,
        expressive: expressiveModule.SchemeExpressive,
        fidelity: fidelityModule.SchemeFidelity,
        "fruit-salad": fruitSaladModule.SchemeFruitSalad,
        monochrome: monochromeModule.SchemeMonochrome,
        neutral: neutralModule.SchemeNeutral,
        rainbow: rainbowModule.SchemeRainbow,
        "tonal-spot": tonalSpotModule.SchemeTonalSpot,
        vibrant: vibrantModule.SchemeVibrant,
      };

      return {
        Hct: hctModule.Hct,
        argbFromHex: stringUtilsModule.argbFromHex,
        hexFromArgb: stringUtilsModule.hexFromArgb,
        schemes,
      };
    })();
  }

  return modulesPromise!;
}

export function normalizeCategory(category: string): ColorSchemeCategory {
  const normalized = category.trim().toLowerCase().replace(/[_\s]+/g, "-");
  const match = categoryAliases[normalized];
  if (!match) {
    throw new Error(
      `Unsupported color scheme category: "${category}". Supported categories: ${supportedCategories()
        .map((name) => `"${name}"`)
        .join(", ")}.`
    );
  }
  return match;
}

export function supportedCategories(): ColorSchemeCategory[] {
  return [
    "content",
    "expressive",
    "fidelity",
    "fruit-salad",
    "monochrome",
    "neutral",
    "rainbow",
    "tonal-spot",
    "vibrant",
  ];
}

export async function buildScheme(
  options: GenerateColorSchemeOptions
): Promise<{ scheme: DynamicScheme; hexFromArgb: (argb: number) => string }> {
  const { seedColor, category, darkMode = false, contrastLevel = 0 } = options;
  const normalizedCategory = normalizeCategory(category);
  const modules = await loadModules();
  const factory = modules.schemes[normalizedCategory];
  if (!factory) {
    throw new Error(`No scheme factory found for category "${category}".`);
  }
  const argb = modules.argbFromHex(seedColor);
  const sourceHct = modules.Hct.fromInt(argb);
  const scheme = new factory(sourceHct, darkMode, contrastLevel);
  return { scheme, hexFromArgb: modules.hexFromArgb };
}

export function extractHexColors(
  scheme: DynamicScheme,
  hexFromArgb: (argb: number) => string
): Record<SchemeRole, string> {
  const colors = scheme.colors;
  return SCHEME_ROLES.reduce((acc, role) => {
    const toArgb = colorRoleExtractors[role];
    const argb = toArgb(colors, scheme);
    acc[role] = hexFromArgb(argb);
    return acc;
  }, {} as Record<SchemeRole, string>);
}

export async function generateColorScheme(
  options: GenerateColorSchemeOptions
) {
  const { scheme, hexFromArgb } = await buildScheme(options);
  return extractHexColors(scheme, hexFromArgb);
}
