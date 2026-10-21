# Pine Arbor Educational Institution website

Five responsive static pages: Home, About, Courses, Gallery, and Contact Us.

## Open or host
Open `dist/index.html` in a browser, or upload the contents of `dist/` to any static web host. No package installation, external fonts, or build service is required.

`build_site.py` regenerates the five HTML pages and search-discovery files. Shared styling and interactions are in `dist/assets/styles.css` and `dist/assets/app.js`. The slideshow and shared animation layer are in `dist/assets/motion.css` and `dist/assets/motion.js`.

## Slideshow and motion
The home banner contains the original photograph plus four new photorealistic conceptual images. A new image starts sliding every 3 seconds, including a smooth last-to-first loop. The location caption, top-right label, and visible slideshow control bar have been removed. Keyboard arrows and mobile touch swiping remain available, with automatic playback continuing after a manual change. Hover does not stop playback. Playback pauses while the banner is keyboard-focused, offscreen, or in a hidden browser tab. Visitors with reduced-motion enabled receive a still banner with instant manual image changes and no entrance/scroll animations.

All five pages have restrained heading entrances, one-time scroll reveals, and interaction effects. Content remains available without JavaScript; the first banner image remains visible. Image assets are local, optimized WebP files with responsive alternatives.

## Content
The company profile and the user's eight-course list are the source of institutional content. The published copy omits unresolved certification claims and draft placeholders. Course focus descriptions are broad orientation, not a confirmed syllabus. The previously removed phone number has not been reintroduced. The sole admissions number is +91 9077 002 002.

Gallery images were created for this website and are labelled as conceptual imagery. Replace them with approved campus/student photography when available.

## Enquiries
The form validates the visitor's details and opens a composed WhatsApp enquiry for review before the visitor sends it. It does not store data or claim that a message has already been delivered. No backend, SMTP service, API key, or invented email address is used.

## Search and answer discovery
Includes unique titles and descriptions, canonical and Open Graph URLs, semantic headings, address information, FAQs, JSON-LD, sitemap.xml, robots.txt, and llms.txt. These improve machine-readable clarity; they do not guarantee ranking or inclusion in AI responses. The review site is private, so search engines cannot access gated content. Public indexing requires a publicly accessible deployment.

Before moving to another domain, replace the BASE origin in build_site.py, run the generator, and update any deployment configuration. Confirm all programme facts, certifications, intakes, and admissions details before public launch.

## Design prompt
See docs/meta-prompt.md for the brief used to create the site.
