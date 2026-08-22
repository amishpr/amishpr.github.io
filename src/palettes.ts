/* Color palettes. Pick one with `site.palette` in content.ts.
   Values come from the palette section of CLEAN-UP/mockups/src/pages/21-results-brief.html.
   Each token becomes a CSS variable (--light-paper, --dark-paper, ...) that site.css maps to the page.
   Roles: accent fills buttons, accent-text is for text and focus rings, mark is for bullets and rules,
   before/after are the two chart shades, fail is for error states only. */

type Tokens = {
  paper: string; surface: string; panel: string; ink: string; body: string; muted: string; line: string; "line-strong": string;
  accent: string; "accent-text": string; "accent-ink": string; mark: string; "accent-soft": string;
  before: string; after: string; fail: string; shadow: string;
};
type Palette = { light: Tokens; dark: Tokens; ambient: boolean };

export const palettes = {
  /* Emerald. Jewel green. The chosen palette. */
  emerald: {
    ambient: false,
    light: {
      paper: "#f4fbf7", surface: "#fcfffd", panel: "#e9f3ed", ink: "#051a0f", body: "#23342a", muted: "#53665a", line: "#dce6df", "line-strong": "#c2cec6",
      accent: "#007742", "accent-text": "#007742", "accent-ink": "#ffffff", mark: "#007742", "accent-soft": "rgba(0, 119, 66, 0.12)",
      before: "#79c795", after: "#007742", fail: "#b4442f", shadow: "rgba(7, 41, 24, 0.38)",
    },
    dark: {
      paper: "#0a140e", surface: "#101b15", panel: "#16211b", ink: "#e8edea", body: "#cdd3cf", muted: "#99a79f", line: "#202d26", "line-strong": "#324139",
      accent: "#54dc8b", "accent-text": "#54dc8b", "accent-ink": "#041b0f", mark: "#54dc8b", "accent-soft": "rgba(84, 220, 139, 0.16)",
      before: "#187c49", after: "#54dc8b", fail: "#f07a62", shadow: "rgba(0, 0, 0, .55)",
    },
  },
  /* Cobalt. Cobalt on cool gray, white cards, a faint cobalt glow behind the page. */
  cobalt: {
    ambient: true,
    light: {
      paper: "#eef0f3", surface: "#ffffff", panel: "#f6f7f9", ink: "#0e1116", body: "#2b313c", muted: "#5b6270", line: "#dfe1e5", "line-strong": "#c6cad1",
      accent: "#2b50e0", "accent-text": "#2447d0", "accent-ink": "#ffffff", mark: "#2b50e0", "accent-soft": "rgba(43, 80, 224, .16)",
      before: "#97b0eb", after: "#2b50e0", fail: "#d0402b", shadow: "rgba(23, 32, 58, 0.38)",
    },
    dark: {
      paper: "#0a0c10", surface: "#12151b", panel: "#171b22", ink: "#e9ecf2", body: "#c9ced8", muted: "#98a0ae", line: "#22262e", "line-strong": "#343a45",
      accent: "#7c9bff", "accent-text": "#8fa9ff", "accent-ink": "#0a0c10", mark: "#7c9bff", "accent-soft": "rgba(124, 155, 255, .2)",
      before: "#3552ae", after: "#7c9bff", fail: "#ff7a66", shadow: "rgba(0, 0, 0, .55)",
    },
  },
  /* Navy. Banking navy for headings, buttons, and figures; dark mode is a deep navy. */
  navy: {
    ambient: false,
    light: {
      paper: "#f6f9ff", surface: "#fdfeff", panel: "#ecf0f9", ink: "#0a193c", body: "#293345", muted: "#586170", line: "#dee3ec", "line-strong": "#c5cbd5",
      accent: "#173166", "accent-text": "#254c96", "accent-ink": "#ffffff", mark: "#173166", "accent-soft": "rgba(23, 49, 102, 0.12)",
      before: "#90add7", after: "#234077", fail: "#b4442f", shadow: "rgba(20, 33, 57, 0.38)",
    },
    dark: {
      paper: "#081120", surface: "#0e182a", panel: "#141e31", ink: "#e7ecf4", body: "#cbd2dd", muted: "#96a4bc", line: "#1e293e", "line-strong": "#2f3d56",
      accent: "#8fc7fc", "accent-text": "#8fc7fc", "accent-ink": "#081733", mark: "#8fc7fc", "accent-soft": "rgba(143, 199, 252, 0.16)",
      before: "#35669a", after: "#8fc7fc", fail: "#f07a62", shadow: "rgba(0, 0, 0, .55)",
    },
  },
  /* Mint. Mint buttons with evergreen text on a pale mint page. */
  mint: {
    ambient: false,
    light: {
      paper: "#edfcf5", surface: "#fcfffd", panel: "#e0f5eb", ink: "#011f18", body: "#1e332c", muted: "#4b625a", line: "#d0e9dd", "line-strong": "#b1d2c3",
      accent: "#7aedbe", "accent-text": "#166e54", "accent-ink": "#00291e", mark: "#4bbc93", "accent-soft": "rgba(122, 237, 190, 0.32)",
      before: "#5fc8a0", after: "#166e54", fail: "#b4442f", shadow: "rgba(1, 41, 29, 0.38)",
    },
    dark: {
      paper: "#081410", surface: "#0e1c17", panel: "#13221d", ink: "#e7edeb", body: "#ccd4d0", muted: "#96a8a1", line: "#1d2d27", "line-strong": "#2f423b",
      accent: "#7ef2c5", "accent-text": "#7ef2c5", "accent-ink": "#002117", mark: "#7ef2c5", "accent-soft": "rgba(126, 242, 197, 0.18)",
      before: "#28795e", after: "#7ef2c5", fail: "#f07a62", shadow: "rgba(0, 0, 0, .55)",
    },
  },
  /* Pine. The original Results Brief green on warm gray. */
  pine: {
    ambient: false,
    light: {
      paper: "#fafaf8", surface: "#ffffff", panel: "#f1f2ee", ink: "#111614", body: "#2b302d", muted: "#5d6460", line: "#e2e4df", "line-strong": "#c9ccc5",
      accent: "#1a6b4f", "accent-text": "#1a6b4f", "accent-ink": "#ffffff", mark: "#1a6b4f", "accent-soft": "rgba(26, 107, 79, .12)",
      before: "#7db89f", after: "#1a6b4f", fail: "#b4442f", shadow: "rgba(10, 40, 28, .4)",
    },
    dark: {
      paper: "#0f1311", surface: "#151a17", panel: "#1a201d", ink: "#e8ece9", body: "#cdd3cf", muted: "#99a29d", line: "#242b27", "line-strong": "#34403a",
      accent: "#5fd0a3", "accent-text": "#5fd0a3", "accent-ink": "#07120d", mark: "#5fd0a3", "accent-soft": "rgba(95, 208, 163, .16)",
      before: "#2c7258", after: "#5fd0a3", fail: "#f07a62", shadow: "rgba(10, 40, 28, .4)",
    },
  },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;

const AMBIENT = "radial-gradient(1000px 600px at 90% -20%, var(--accent-soft), transparent 60%), radial-gradient(800px 500px at -10% 110%, var(--accent-soft), transparent 60%)";

/* The chosen palette as one :root rule, injected into <head> at build time. */
export function paletteCss(name: PaletteName): string {
  const p: Palette = palettes[name];
  const vars = (mode: "light" | "dark") => Object.entries(p[mode]).map(([k, v]) => `--${mode}-${k}:${v};`).join("");
  return `:root{${vars("light")}${vars("dark")}--ambient:${p.ambient ? AMBIENT : "none"};}`;
}
