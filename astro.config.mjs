// Rathnaweera home page. Static Astro on the BB stack standard (STACK-STANDARD.md, 9 Sep 2026).
// SITE_URL and BASE_PATH come from the deploy workflow, so the same source builds for GitHub Pages staging
// (https://businessboosterlk.github.io/rathnaweera-website/) and later for the client's own domain at '/'.
import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://businessboosterlk.github.io';
const base = process.env.BASE_PATH ?? '/rathnaweera-website';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory', assets: 'assets/app', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  image: { responsiveStyles: false },
  vite: { build: { cssCodeSplit: false, assetsInlineLimit: 0 } },
});
