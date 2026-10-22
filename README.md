# ELANGO S — cinematic portfolio

A portfolio that plays like a film in five reels. Live at [elanxzz.me](https://elanxzz.me).

1. **Opening** — the site "builds" itself: a neural network fires layer by layer under CODE → TRAIN → DEPLOY while a build log streams (`npm run build`, training epochs, deploy). Then a face-detection box tracks across the dark, locks onto me (`elango_s · 99.2%`) and the view opens on the amber ELANGO S wordmark.
2. **Stack** — my tech stack as a 3D ring orbiting around me. Drag it to spin it.
3. **Time machine** — a clock whose hand follows the cursor from 2007 in Erode to the 2029 vision.
4. **Work** — 15 projects on screens that surround me. Drag, use the arrows, or open any screen.
5. **Finale** — a terminal that types out who I am, a one-click resume download, and a contact block: contact details, social links and a message form. **Dispatch on WhatsApp** opens the visitor's own WhatsApp with their name, subject, email and message already written to my number; they tap send and it reaches me directly. No server, nothing stored.

Also on the page:
- **The reel** — a 12-second loop made from my photos (2.5D parallax shots: each photo split into me and the background, with a camera push and amber wipes). It opens from a small window to the whole screen as you scroll. Widescreen on desktop, vertical on phones.
- **Off the clock** — an amber field where my photos drop onto the headline like prints. Drag them around (or focus one and use the arrow keys); *Tidy up* puts them back.
- **Rolling figures** — projects, tools in the stack and years writing code count up when they arrive.
- **The footer monument** — the name returns full width in reversed colours.

Between reels, film strips scroll my stack and projects and speed up with your scroll. Headings rise word by word, buttons roll their labels, and a reel index on the right jumps between scenes.

Plain HTML, CSS and JavaScript. No framework and no build step.

Type: **Archivo**, one family in two widths: Expanded Black for the monument and headings, regular width for everything else. JetBrains Mono only in the terminal and build log.

## Files

```
index.html          the whole site: styles, markup and scripts
assets/elango.webp    hero, stack and project-room photo (background removed, colour graded)
assets/elango-2.webp  finale photo
assets/og.jpg       link-preview image for WhatsApp, LinkedIn, X
assets/gallery/      the five graded photos used for the prints
assets/reel-*.webm|mp4|webp  the reel (wide and tall) and its poster frames
resume.pdf          opened by the Resume buttons
favicon.svg         browser tab icon
```

## Editing content

Everything personal lives in the `CONFIG` object near the top of the `<script>` in `index.html`:

- `chips`, `email`, `phone`, `location`, `socials`
- `whatsapp` — the number the contact form sends to: country code + number, digits only (e.g. `916379883404`)
- `stack` — cards in the ring (`m` is the two-letter monogram)
- `years` — timeline milestones
- `projects` — title, stack, description and `links` (add a `Launch live` URL to any project)
- `gallery` — the prints: image, alt text and caption

To change a photo, replace `assets/elango.webp` (or `assets/elango-2.webp` for the finale) with a transparent image of the same proportions (waist-up works best). To update the resume, replace `resume.pdf`.

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
- The full intro plays once per visit; reloading in the same tab gets a short spotlight version.
- The detection box is placed from `CONFIG.face` (the face's position as fractions of the hero photo). Update it if you change the photo.
- Respects `prefers-reduced-motion` with a calm static version.
