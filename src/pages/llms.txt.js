import { SITE, url } from '../config.js';
export function GET({ site }) {
  const home = new URL(url(''), site).href;
  return new Response(`# ${SITE.name}\n\n> Staging preview of the home page. Facts in brackets wait for the agency. Jobs shown are samples, not live vacancies.\n\nOffices: Ambalantota (Head Office) and Colombo.\n\n- [Home](${home})\n`, { headers: { 'Content-Type': 'text/plain' } });
}
