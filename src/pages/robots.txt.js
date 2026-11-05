// Staging: nobody indexes the preview. Switch with ROBOTS in config.js when Thulaib says go (bb_pending 1237).
import { ROBOTS, url } from '../config.js';
export function GET({ site }) {
  const closed = ROBOTS.includes('noindex');
  return new Response(closed ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${new URL(url('sitemap.xml'), site).href}\n`, { headers: { 'Content-Type': 'text/plain' } });
}
