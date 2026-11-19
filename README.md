# Apocrycoin landing page (v4)

Live domain: https://apocrycoin.xyz

Static site. No build step, no dependencies.

**Open it:** double-click `index.html`, or serve the folder (`python3 -m http.server`) and visit http://localhost:8000.

## Edit content
Everything editable lives in `config.js`: hero copy, hero artwork (`hero.designs`), scene text and dialogue, blockchain-art lots, project status, footer, and links.

- **Links:** `links: []` is empty on purpose. Add only confirmed destinations, e.g. `{ label: "X", href: "https://x.com/..." }`. Empty means nothing is shown.
- **Status:** edit `info.status` when network, contract or launch details are confirmed.
- **Real clips:** put a file in `assets/video/` and set a scene's `video` to `{ src: "assets/video/yacht.mp4", poster: "assets/img/yacht-pitch.jpg" }`. The page then shows a native video player in place of the still. No fake play buttons are rendered for stills. Keep the nav/hero action as "Take a look" until real clips exist.
- **Dialogue:** only add lines verified from supplied material.

## Files
- `index.html` page shell
- `styles.css` design tokens (top of file) and layout
- `main.js` renders config, mobile menu, focus handling, reduced-motion-aware reveals
- `assets/img/` scene stills, cropped (WebP + JPEG fallback). Originals are not modified.
- `assets/art/sunset.svg` original concept artwork No. 01 (hand-built SVG, ours to use). Not an NFT; no mint announced.
- `assets/fonts/` self-hosted Anton, Inter, Instrument Serif (SIL Open Font License)

## Image notes
- Scene 01: top overlay counters and the bottom-right streamer avatar cropped out. Subtitles untouched.
- Both scene captures are under 1000px wide. Higher-resolution captures would sharpen the yacht scene.

## Metadata and sharing
`index.html` holds the title, description, canonical URL and Open Graph / Twitter card tags, all pointing at https://apocrycoin.xyz.
The share image is `assets/og-image.jpg` (1200x630). Sharing previews only work once the site is actually served from that domain.
No `twitter:site` handle is set because no account is confirmed.

## Holder Access
`holder.js` + `config.js` -> `holderAccess`. The rules and secrets live in the server (`apocrycoin-server/`, see its README), not in this public site.
The section shows "Holder verification opens soon." until `holderAccess.apiBase` points at the deployed server **and** that server reports itself enabled (mint verified on-chain, config complete).
Wallets: Wallet Standard on Solana mainnet (Phantom, Solflare, Backpack...). Phones without an injected wallet get "Open in Phantom/Solflare" links.

## Hero artwork rotation
- The cards in `hero.designs` rotate every `hero.rotateSeconds` (6) with a crossfade. The first card is random on each visit. After that a shuffled order shows every card once before any repeats, and never the same card twice in a row.
- There are previous, pause and next controls. Rotation pauses while the tab is hidden or the hero is off screen. It starts paused when the visitor prefers reduced motion, and then changes cards without the fade.
- Cards are always shown whole, never cropped. A soft blurred glow from the same card fills the space around it.
- To add a card, run `python3 ../apocrycoin-tools/prep_hero.py <source.png> <slug>` from the folder that contains `site/`. It writes the web sizes to `assets/hero/` and removes only a plain white background outside the card, if there is one. Then add an entry with a plain description as its alt text.
- These cards are public. Holder-only full-resolution artwork is served by `apocrycoin-server` and must never go in `assets/`.
