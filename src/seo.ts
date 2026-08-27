/* Head tags, structured data, and the small files Google and GitHub Pages read.
   All built from content.ts at build time (vite.config.ts calls these). */
import type { Content } from "./types.ts";
import { palettes, paletteCss } from "./palettes.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (c: Content, path: string) => (/^https?:/.test(path) ? path : c.site.url.replace(/\/$/, "") + path);
const home = (c: Content) => c.site.url.replace(/\/$/, "") + "/";

/* ProfilePage + Person (https://developers.google.com/search/docs/appearance/structured-data/profile-page). */
function jsonLd(c: Content, today: string) {
  const P = c.person, now = c.experience[0];
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: home(c),
    dateModified: today,
    mainEntity: {
      "@type": "Person",
      name: P.name,
      url: home(c),
      image: abs(c, P.photo),
      jobTitle: P.role,
      description: P.intro,
      email: `mailto:${P.email}`,
      sameAs: P.links.map((l) => l.url),
      ...(/present/i.test(now.end) && { worksFor: { "@type": "Organization", name: now.company } }),
      alumniOf: c.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
      knowsAbout: c.skills.flatMap((g) => g.items),
    },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function head(c: Content, today = new Date().toISOString().slice(0, 10)): string {
  const s = c.site, pal = palettes[s.palette];
  const og = abs(c, s.ogImage);
  /* Runs before first paint: marks JS as on (reveal animations) and applies a saved light/dark choice. */
  const themeScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;var c=t==="dark"?"${pal.dark.paper}":"${pal.light.paper}";document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=c})}}catch(e){}`;
  return [
    `<title>${esc(s.title)}</title>`,
    `<meta name="description" content="${esc(s.description)}">`,
    `<link rel="canonical" href="${home(c)}">`,
    `<meta name="author" content="${esc(c.person.name)}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:site_name" content="${esc(c.person.name)}">`,
    `<meta property="og:title" content="${esc(s.title)}">`,
    `<meta property="og:description" content="${esc(s.description)}">`,
    `<meta property="og:url" content="${home(c)}">`,
    `<meta property="og:image" content="${og}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(s.ogImageAlt)}">`,
    `<meta property="profile:first_name" content="${esc(c.person.name.split(" ")[0])}">`,
    `<meta property="profile:last_name" content="${esc(c.person.name.split(" ").slice(1).join(" "))}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(s.title)}">`,
    `<meta name="twitter:description" content="${esc(s.description)}">`,
    `<meta name="twitter:image" content="${og}">`,
    `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${pal.light.paper}">`,
    `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${pal.dark.paper}">`,
    `<script>${themeScript}</script>`,
    `<style>${paletteCss(s.palette)}</style>`,
    `<script type="application/ld+json">${jsonLd(c, today)}</script>`,
  ].join("\n");
}

export const robots = (c: Content) => `User-agent: *\nAllow: /\n\nSitemap: ${home(c)}sitemap.xml\n`;

export const sitemap = (c: Content, today = new Date().toISOString().slice(0, 10)) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${home(c)}</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`;

export const cname = (c: Content) => new URL(c.site.url).hostname + "\n";

/* GitHub Pages serves this for any unknown path. noindex keeps it out of search results. */
export function notFound(c: Content) {
  const p = palettes[c.site.palette];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found | ${esc(c.person.name)}</title>
<link rel="icon" href="/favicon.ico">
<style>
:root { color-scheme: light dark; --bg: ${p.light.paper}; --ink: ${p.light.ink}; --muted: ${p.light.muted}; --accent: ${p.light.accent}; --on: ${p.light["accent-ink"]}; }
@media (prefers-color-scheme: dark) { :root { --bg: ${p.dark.paper}; --ink: ${p.dark.ink}; --muted: ${p.dark.muted}; --accent: ${p.dark.accent}; --on: ${p.dark["accent-ink"]}; } }
body { margin: 0; min-height: 100vh; display: grid; place-content: center; gap: 16px; padding: 24px; background: var(--bg); color: var(--ink); font: 17px/1.6 ui-sans-serif, system-ui, sans-serif; }
h1 { margin: 0; font-size: clamp(2rem, 6vw, 3rem); letter-spacing: -0.04em; line-height: 1.05; }
p { margin: 0; color: var(--muted); }
a { justify-self: start; padding: 12px 18px; border-radius: 8px; background: var(--accent); color: var(--on); font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<h1>This page doesn't exist.</h1>
<p>The link may be old, or the address has a typo.</p>
<a href="/">Go to ${esc(c.person.name)}'s site</a>
</body>
</html>
`;
}
