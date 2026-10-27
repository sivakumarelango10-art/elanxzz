/**
 * Descriptions written from each repository's README and source files, used only when the
 * repository has no GitHub description (or one too short to explain the project).
 * Every entry must be supported by what the repository actually contains: no claims of
 * deployment, users or completeness that the repository itself doesn't show.
 * Last reviewed 2026-10-27 against the default branch of each repository.
 */
export const CURATED: Record<string, string> = {
  'elanxzz':
    'Source code for elanxzz.me, the personal portfolio of Elango S: a static, scroll-driven site with an About page, a WhatsApp contact form and projects pulled from GitHub.',
  'sincommunity':
    'The public website for SINC (Society for Innovation, Network & Collaboration), built with React, Vite, TypeScript and GSAP, linking visitors to the SINC platform to join or sign in.',
  'jessie':
    'A portfolio website for a physiotherapist, built as a dependency-free static page with a downloadable résumé, a link-preview image and Playwright scripts that check the layout.',
  'smart-travel':
    'A full-stack travel booking platform for flights and hotels, with a Spring Boot and MongoDB backend, a React and TypeScript frontend, JWT authentication and Razorpay payments.',
  'Syllora':
    'Front end for Syllora, a platform for planning a syllabus and tracking academic progress, centred on an animated, accessible sign-in experience written in plain HTML, CSS and JavaScript.',
  'MaamAI':
    'An AI assistant for university faculty that gives each staff member a separate workspace for email, calendar and an AI review queue, with JWT authentication and Supabase PostgreSQL.',
  'SkillBridge':
    'A platform where students and self-taught developers practise real-world workplace tasks, receive rubric-based feedback from automated checks and AI, and build a portfolio of their work.',
  'FixMyCity2':
    'A mobile-first civic services app built with Next.js and Supabase where citizens report complaints and pay bills, workers handle assigned tasks, and administrators manage departments.',
  'FixMyCity':
    'A civic services platform for reporting city issues, tracking complaints, using utility services and reading city information, with separate citizen and administrator dashboards.',
  'calculator':
    'KV Calc, a browser calculator in plain HTML, CSS and JavaScript with standard and scientific modes, calculation history, memory keys, keyboard support and four switchable themes.',
  'restaurant':
    'A restaurant management and point-of-sale system built with Next.js, TypeScript and Prisma, covering role-based staff access, menu management, table orders, billing and revenue reports.',
  'Elanxzz-Assistant':
    'A local-first Electron and Python desktop assistant that turns typed or spoken instructions into verified actions such as file management, launching apps, terminal commands and browser automation.',
  'theervu-ai':
    'An AI assistant that helps people in India prepare for visits to government offices, hospitals, banks and RTOs, with streamed guidance, checklists of what to bring and application tracking.',
  'Redbloom':
    'A generative art piece for the browser in which a procedural flower blooms, grows and sways in response to hand gestures tracked through the webcam with MediaPipe.',
  'naruto-rasengan':
    'A browser hand-tracking demo that summons a glowing rasengan above an open palm, using MediaPipe Hands in a single static HTML file, with all webcam processing kept on the device.',
  'HandConnect':
    'A webcam hand-tracking AR experiment using MediaPipe Hands that draws neon skeletons, particles, electric arcs and mandalas around the hands, with synthesised sound from the Web Audio API.',
  'Doctor-Strange':
    'A single-file browser AR experience inspired by Doctor Strange, where hand gestures tracked with MediaPipe cast spell trails, shields and portals rendered on an HTML5 canvas.',
  'alphaacademy':
    'An animated website for Alpha Academy, a coaching academy for UGC NET English Literature, presenting the academy, its founder, its teaching approach and its study materials.',
  'E-invitation':
    'An interactive, mobile-first wedding e-invitation with a timed opening reveal, scratch-to-reveal date, event timeline, venue map link, live countdown and swipeable photo gallery.',
  'guhas':
    'An online store for GUHAS Health & Organic built with Next.js and Prisma, with a product catalogue, cart, Razorpay checkout, blog and an admin panel for orders and products.',
  'zyrocore':
    'An online store for ZYRØCORE, a minimalist clothing brand, built with Next.js and Supabase, with product pages, cart, wishlist, accounts, Razorpay checkout and an admin dashboard.',
};

/** Forks that contain substantial original work and should be shown anyway. */
export const INCLUDE_FORKS: string[] = [];

/** Repositories to leave out even though they pass the automatic filters. */
export const EXCLUDE: string[] = [];
