# ELANGO S — cinematic portfolio

A portfolio that plays like a film in five reels. Live at [elanxzz.me](https://elanxzz.me).

1. **Opening** — film-leader countdown, the shutter splits open, and the amber ELANGO S wordmark rises behind me.
2. **Stack** — my tech stack as a 3D ring orbiting around me. Drag it to spin it.
3. **Time machine** — a clock whose hand follows the cursor from 2007 in Erode to the 2029 vision.
4. **Work** — 15 projects on screens that surround me. Drag, use the arrows, or open any screen.
5. **Finale** — a terminal that types out who I am and how to reach me.

Plain HTML, CSS and JavaScript. No framework and no build step.

## Files

```
index.html          the whole site: styles, markup and scripts
assets/elango.webp  my cutout photo (background removed, colour graded)
assets/og.jpg       link-preview image for WhatsApp, LinkedIn, X
resume.pdf          opened by the Resume buttons
favicon.svg         browser tab icon
```

## Editing content

Everything personal lives in the `CONFIG` object near the top of the `<script>` in `index.html`:

- `chips`, `email`, `phone`, `socials`
- `stack` — cards in the ring (`m` is the two-letter monogram)
- `years` — timeline milestones
- `projects` — title, stack, description and `links` (add a `Launch live` URL to any project)

To change the photo, replace `assets/elango.webp` with a transparent image of the same proportions (waist-up works best). To update the resume, replace `resume.pdf`.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this repository.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy, then add `elanxzz.me` under **Settings → Domains**.

It also works on GitHub Pages or Netlify as-is, since it is a static site.

## Under the hood

- Smooth scrolling with [Lenis](https://github.com/darkroomengineering/lenis); every animation runs on one shared frame clock and pauses when off-screen.
- Real 3D with CSS transforms for the stack ring and the project room.
- Film grain, embers and the distressed letter texture are generated in the browser.
- Respects `prefers-reduced-motion` with a calm static version.
