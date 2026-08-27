import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import content from "./src/content.ts";
import { cname, head, notFound, robots, sitemap } from "./src/seo.ts";

export default defineConfig({
  /* Builds into /docs, which .github/workflows/deploy.yml publishes to GitHub Pages (Settings > Pages > Source: GitHub Actions). */
  build: { outDir: "docs" },
  plugins: [
    react(),
    {
      /* Fills <!--head--> in index.html and writes robots.txt, sitemap.xml, CNAME, and 404.html, all from content.ts. */
      name: "site-seo",
      apply: (_, env) => !env.isSsrBuild,
      transformIndexHtml: (html) => html.replace("<!--head-->", head(content)),
      generateBundle() {
        const files = { "robots.txt": robots(content), "sitemap.xml": sitemap(content), CNAME: cname(content), "404.html": notFound(content) };
        for (const [fileName, source] of Object.entries(files)) this.emitFile({ type: "asset", fileName, source });
      },
    },
  ],
});
