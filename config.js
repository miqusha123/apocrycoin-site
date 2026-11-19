/*
  Apocrycoin site configuration
  ---------------------------------------------------------------
  All copy, scene media, project status and future links live here.
  index.html (metadata), main.js (templates) and styles.css pair with
  this file; update them together.

  Rules (from the project brief):
  - Only quote dialogue verified from supplied material.
  - Use direct game captures only. Do not use photos of screens.
  - Leave values unconfirmed until they are confirmed. Empty links are
    not rendered, so nothing unconfirmed reaches the page.
  - "Blockchain art" is a creative premise. No minting, prices, supply,
    wallet connection or purchase actions.

  Adding a real clip later (implementation note, not shown on the page):
  put the file in assets/video/ and set feature.video to
  { src: "assets/video/yacht.mp4", poster: "assets/img/yacht-pitch.jpg" }.
  The feature then renders a native <video controls> in place of the still.
  Keep the action label "Take a look" (not "Watch") until real clips exist.
*/
window.APOCRYCOIN = {
  brand: "Apocrycoin",
  // Canonical address. index.html sharing tags use it too; change both together.
  siteUrl: "https://apocrycoin.xyz/",

  nav: [
    { label: "Apocrycoin", href: "#apocrycoin" },
    { label: "Blockchain Art", href: "#art" },
    { label: "The Details", href: "#details" }
  ],
  // Header button: opens the same wallet flow as the Holder Access section.
  navAction: { label: "Connect wallet", href: "#holders", wallet: true },

  hero: {
    eyebrow: "Apocrycoin",
    headline: ["You’ve heard", "the name."],
    sentence: "Apocrycoin. For the art. For whatever comes next.",
    primary: { label: "Take a look", href: "#apocrycoin" },
    secondary: { label: "The art", href: "#art" },
    // Public hero artwork. It rotates in a shuffled order: the first one is
    // random, and every design shows once before any repeats.
    // To add a design, run prep_hero.py (kept with the project, outside the site), which writes {slug}.webp, {slug}.jpg
    // and {slug}-glow.jpg to assets/hero/, then add an entry here.
    // Cards are always shown whole. "focus" only positions the soft glow behind them.
    // Full-size holder-only artwork does NOT belong here (see apocrycoin-server).
    rotateSeconds: 6,
    designs: [
      {
        id: "mona-lisa",
        webp: "assets/hero/mona-lisa.webp",
        jpg: "assets/hero/mona-lisa.jpg",
        glow: "assets/hero/mona-lisa-glow.jpg",
        width: 900,
        height: 1205,
        focus: "50% 45%",
        alt: "Apocrycoin artwork card, Mona Lisa: the Mona Lisa in gold aviator sunglasses and a gold chain, with palm trees and a sunset city skyline behind her."
      },
      {
        id: "starry-night",
        webp: "assets/hero/starry-night.webp",
        jpg: "assets/hero/starry-night.jpg",
        glow: "assets/hero/starry-night-glow.jpg",
        width: 900,
        height: 1205,
        focus: "50% 50%",
        alt: "Apocrycoin artwork card, The Starry Night: a swirling Van Gogh-style night sky over a neon coastal city, with a sports car on a curving road."
      },
      {
        id: "pearl-earring",
        webp: "assets/hero/pearl-earring.webp",
        jpg: "assets/hero/pearl-earring.jpg",
        glow: "assets/hero/pearl-earring-glow.jpg",
        width: 900,
        height: 1205,
        focus: "50% 45%",
        alt: "Apocrycoin artwork card, Girl with a Pearl Earring: the girl in the blue and gold turban looks over her shoulder holding a cigar, a sunset skyline and palms behind her."
      },
      {
        id: "the-scream",
        webp: "assets/hero/the-scream.webp",
        jpg: "assets/hero/the-scream.jpg",
        glow: "assets/hero/the-scream-glow.jpg",
        width: 900,
        height: 1205,
        focus: "50% 50%",
        alt: "Apocrycoin artwork card, The Scream: the screaming figure on the bridge stands beside an open duffel bag of banknotes, with palms, a city skyline and police lights behind."
      }
    ]
  },

  // The yacht scene (section "#apocrycoin").
  feature: {
    label: "Word gets around",
    quote: "Yeah, well Apocrycoin, is really hot right now...",
    source: "Stream capture",
    media: {
      webp: "assets/img/yacht-pitch.webp",
      jpg: "assets/img/yacht-pitch.jpg",
      width: 892,
      height: 673,
      alt: "Yacht party at sunset with the on-screen subtitles: Hey man. Why everybody up in my DMs asking for that pink yay? Yeah, well Apocrycoin, is really hot right now."
    },
    video: null
  },

  art: {
    eyebrow: "Blockchain art",
    title: "Something to look at.",
    body: "We’ll let the art do the talking.",
    label: "Concept artwork",
    feature: {
      src: "assets/art/sunset.svg",
      width: 1000,
      height: 1250,
      title: "Sunset",
      number: "No. 01",
      alt: "Original concept artwork: a striped coral sun setting over violet water, seen past a yacht railing."
    }
  },

  // ---------------------------------------------------------------
  // Holder Access (Solana mainnet). The server in apocrycoin-server/ decides
  // everything: it verifies the mint on-chain, issues one-time sign-in
  // messages, checks signatures and balances, and serves the artwork.
  // The rules (mint, 1,000 whole tokens, RPC) live in the SERVER's
  // environment, not here. This page stays on "Holder verification opens
  // soon." until apiBase is set AND the server reports itself enabled.
  // ---------------------------------------------------------------
  holderAccess: {
    apiBase: "https://api.apocrycoin.xyz", // the server decides: it reports enabled:false (page shows "opens soon") until HOLDER_ENABLED=true and the mint verifies on-chain
    domain: "apocrycoin.xyz", // shown in the sign-in explanation; must match the server's SITE_DOMAIN

    eyebrow: "Holder access",
    // The holder benefit is eligibility for a PLANNED NFT mint. Minting is not built or enabled.
    // Never promise in-game display or present the collection as official GTA VI.
    title: "Hold the token. Claim the art.",
    body: "Hold at least 1,000 Apocrycoin to qualify for our planned NFT mint.",
    status: "Mint coming soon.",
    note: "An independent collection. No official GTA VI integration or in-game display functionality is currently available.",
    button: "Connect wallet",
    notReady: "Holder verification opens soon.",
    results: {
      eligible: "You qualify for the planned mint.",
      below: "You need at least 1,000 Apocrycoin in this wallet.",
      unavailable: "We couldn\u2019t check right now. Try again."
    },
    // Public concept art shown in the holder section. Caption stays "concept art"; no in-game claims.
    concept: {
      webp: "assets/art/penthouse-concept.webp",
      jpg: "assets/art/penthouse-concept.jpg",
      width: 1600,
      height: 1000,
      alt: "Concept art: a sunset penthouse living room with a city skyline and palms through the window, and the Mona Lisa framed above a long sofa.",
      caption: "Concept art. Mona Lisa by Leonardo da Vinci, public domain."
    },
    // Pop-up shown when the server verifies a wallet as eligible. No mint action until minting is built and tested.
    eligibleModal: {
      title: "Eligible to mint.",
      body: "This wallet holds at least 1,000 Apocrycoin, so it qualifies for the planned mint.",
      status: "Mint coming soon.",
      close: "Got it"
    },
    previewsLabel: "From the planned collection",
    galleryTitle: "The planned collection",
    galleryNote: "Work in progress. Nothing here has been minted, and pieces may change before the mint.",
    shareNote: "Anything shown here can still be saved or shared by whoever is viewing it. Access control can\u2019t prevent that."
  },

  details: {
    title: "The details.",
    body: "Launch information will be posted here.",
    status: [
      { label: "Network", value: "Solana" },
      { label: "Contract address", value: "4C4zPUS42QS2X25LYjZxaNwvLJ5F5LESvuA829mRpump", copy: true },
      { label: "Launch details", value: "To be announced" }
    ]
  },

  // Confirmed destinations only, e.g. { label: "X", href: "https://x.com/..." }.
  links: [],

  footer: {
    statement:
      "Apocrycoin is an independent, fan-inspired project. It is not affiliated with, endorsed by or sponsored by Rockstar Games or Take-Two Interactive. Scene images are shown for commentary, and the game footage they depict belongs to its owners.",
    risk:
      "Nothing on this site is financial advice or an offer of any asset. Meme coins are highly speculative."
  }
};
