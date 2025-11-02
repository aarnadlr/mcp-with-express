declare module "@material/material-color-utilities" {
  export interface DynamicColor {
    getArgb(scheme: unknown): number;
  }

  export const MaterialDynamicColors: {
    primary: DynamicColor;
    onPrimary: DynamicColor;
    primaryContainer: DynamicColor;
    onPrimaryContainer: DynamicColor;
    secondary: DynamicColor;
    onSecondary: DynamicColor;
    tertiary: DynamicColor;
    onTertiary: DynamicColor;
    background: DynamicColor;
    surface: DynamicColor;
  };

  export class Hct {
    static fromInt(argb: number): Hct;
    toInt(): number;
  }

  export function argbFromHex(hex: string): number;
  export function hexFromArgb(argb: number): string;

  export class TonalPalette {
    readonly keyColor: Hct;
    tone(tone: number): number;
  }

  export class CorePalette {
    static of(argb: number): CorePalette;

    readonly a1: TonalPalette;
    readonly a2: TonalPalette;
    readonly a3: TonalPalette;
    readonly n1: TonalPalette;
    readonly n2: TonalPalette;
    readonly error: TonalPalette;
  }

  export class SchemeContent {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeExpressive {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeFidelity {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeFruitSalad {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeMonochrome {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeNeutral {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeRainbow {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeTonalSpot {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
  export class SchemeVibrant {
    constructor(sourceColorHct: unknown, isDark: boolean, contrastLevel: number);
  }
}
