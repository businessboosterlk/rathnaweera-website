# Rathnaweera Foreign Employment Agency: home page (staging)

Astro static site. No backend, no database, no form endpoint. The form is a preview that sends nothing.

## Run it

```bash
npm ci
npm run dev        # http://localhost:4661/rathnaweera-website/
npm run build      # icon check, astro build, then scripts/check-dist.mjs (fails the build on any fault)
npm run preview
```

## Where things live

- `src/pages/index.astro`: the whole home page, in the approved storyboard's section order.
- `src/config.js`: every fact the agency still has to give. All are `null` and show as gold dashed placeholders.
  Fill a value here and it appears everywhere it is used.
- `src/styles/global.css`: tokens (navy #002B63, red #A80000, gold #C8982A, white, warm white #F7F5EF) and layout.
  Phone below 760px, tablet 760 to 1099, desk from 1100.
- `src/scripts/site.js`: the only script (hero flight, phone menu, country filter, checklist, form preview).
- `scripts/build-icons.mjs`: icons come from Lucide through this generator. Never type an svg by hand.
- `scripts/prep-images.mjs`: makes the image masters. It refuses the seal from before the 4 Nov repair by its hash.
- `scripts/check-site.mjs`: the click path. Presses every button at phone and desk, Back once and twice, and runs
  the nothing cut off audit at 375, 390, 768 and 1440.

## Before launch (not done on purpose)

- `ROBOTS` in `src/config.js` is `noindex, nofollow` and robots.txt closes the site. Open them only at launch.
- The words "licensed" and the Check it link stay staging only until the agency shows on the SLBFE register.
- No `tel:` or WhatsApp link exists until the numbers are confirmed. `check-dist.mjs` fails the build on one.
- Hosting, domain and any form service are held by the agency in its own name. BB provides none of them.
