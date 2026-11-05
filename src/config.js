// THE ONE PLACE A FACT ABOUT THE AGENCY LIVES. Every value that is still waiting for Janaka is null here and the
// page draws a gold dashed placeholder for it. Fill a value here and every place that shows it changes together.
// Never type a licence number, phone number, fee, salary, year, count or timeline anywhere else.
export const BASE = String(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
export const url = p => BASE + String(p || '').replace(/^\//, '');

// STAGING. 'noindex, nofollow' until Thulaib says the site may be found (bb_pending 1237, hosting and domain).
export const ROBOTS = 'noindex, nofollow';
export const STAGING = true;

export const SITE = {
  name: 'Rathnaweera Foreign Employment Agency',
  short: 'Rathnaweera',
  description: 'Rathnaweera Foreign Employment Agency, Ambalantota and Colombo. Jobs abroad, the steps from first call to flight and how to apply. Staging preview.',
  offices: [
    { key: 'head', name: 'Head Office', town: 'Ambalantota', address: null, hours: null },
    { key: 'colombo', name: 'Colombo branch', town: 'Colombo', address: null, hours: null },
  ],
  // bb_pending 1255: the SLBFE register showed no Rathnaweera on 4 Nov 2026. Number stays null until it matches.
  licence: null,
  // STAGING ONLY (1255). The register search for our name. It must not go live until the certificate matches.
  registerUrl: 'https://applications.slbfe.lk/feb/la/la_details.asp?agency=RATHNAWEERA',
  phones: { landline: null, mobile1: null, mobile2: null },
  email: null,
  yearStarted: null,     // bb_pending 1257
  peoplePlaced: null,    // bb_pending 1257, only with proof
};
