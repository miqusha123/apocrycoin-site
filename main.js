(function () {
  "use strict";
  var C = window.APOCRYCOIN;
  if (!C) return;

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // Escaped text where hyphenated words (e.g. "name-drop.") never split across lines.
  // An array renders one line per item.
  function title(s) {
    if (Array.isArray(s)) return s.map(function (l) { return '<span class="line">' + title(l) + "</span>"; }).join("");
    return esc(s).replace(/(\S*\w-\w\S*)/g, '<span class="nw">$1</span>');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function link(l, cls) {
    if (!l || !l.href) return "";
    var ext = /^https?:/i.test(l.href);
    return '<a class="' + (cls || "") + '" href="' + esc(l.href) + '"' +
      (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + esc(l.label) + "</a>";
  }
  function picture(m, cls, eager) {
    return "<picture>" +
      (m.webp ? '<source srcset="' + esc(m.webp) + '" type="image/webp">' : "") +
      '<img class="' + (cls || "") + '" src="' + esc(m.jpg) + '" width="' + m.width + '" height="' + m.height +
      '" alt="' + esc(m.alt) + '" decoding="async"' + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ">" +
      "</picture>";
  }

  // Original mark: a coin cut by a horizon, half a sunset showing.
  var MARK =
    '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M5 17.5h22" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M8.6 17.5a7.4 7.4 0 0 1 14.8 0z" fill="var(--coral)"/></svg>';
  // The display lockup is set in capitals; the brand name itself is "Apocrycoin".
  function wordmark() {
    return MARK + '<span class="wordmark" aria-hidden="true">' + esc(C.brand.toUpperCase()) + "</span>";
  }

  // ---------- header ----------
  $("[data-brand]").innerHTML = wordmark();
  $("[data-nav]").innerHTML = C.nav.map(function (n) { return "<li>" + link(n, "nav-link") + "</li>"; }).join("");
  $("[data-mobile-nav]").innerHTML = C.nav.map(function (n) { return "<li>" + link(n, "mobile-link") + "</li>"; }).join("");
  [$("[data-nav-action]"), $("[data-mobile-action]")].forEach(function (a) {
    a.href = C.navAction.href; a.textContent = C.navAction.label;
    if (C.navAction.wallet) a.setAttribute("data-wallet-open", "");
  });

  // ---------- hero ----------
  var H = C.hero;
  $("[data-hero]").innerHTML =
    '<div class="hero-media" data-rotator>' +
      '<div class="hero-stage" aria-live="off"></div>' +
      '<div class="hero-controls" hidden>' +
        '<button type="button" class="hc-btn" data-hc="prev" aria-label="Previous artwork">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg></button>' +
        '<button type="button" class="hc-btn" data-hc="pause" aria-label="Pause artwork rotation" aria-pressed="false">' +
          '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5v11M15 6.5v11"/></svg>' +
          '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.2v11.6L18 12z"/></svg></button>' +
        '<button type="button" class="hc-btn" data-hc="next" aria-label="Next artwork">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg></button>' +
      "</div>" +
    "</div>" +
    '<h1 class="hero-title" id="hero-title"><span class="sr-only">' + esc(C.brand) + "</span>" +
      '<svg class="hero-word" viewBox="0 0 1000 170" aria-hidden="true" focusable="false">' +
      '<text x="0" y="150">' + esc(C.brand.toUpperCase()) + "</text></svg></h1>" +
    '<div class="hero-copy">' +
      '<p class="eyebrow">' + esc(H.eyebrow) + "</p>" +
      '<p class="hero-headline">' + H.headline.map(function (l) { return "<span>" + esc(l) + "</span>"; }).join("") + "</p>" +
      '<p class="hero-sentence">' + esc(H.sentence) + "</p>" +
      '<div class="hero-actions">' + link(H.primary, "btn btn-accent") + link(H.secondary, "btn btn-ghost") + "</div>" +
    "</div>";

  // Fit the giant wordmark's viewBox to its real glyph bounds (cap height to
  // baseline) so it spans its column at true proportions once Anton loads.
  function fitWord() {
    var svg = $(".hero-word"), t = svg && svg.querySelector("text");
    if (!t) return;
    try {
      var b = t.getBBox();
      var fs = parseFloat(getComputedStyle(t).fontSize) || 205;
      var top = 150 - fs * 0.735;
      svg.setAttribute("viewBox", [b.x, top, b.width, 150 - top].join(" "));
    } catch (e) {}
  }
  fitWord();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);

  // ---------- hero artwork rotator ----------
  // The first design is random. After that, designs come from a shuffled bag
  // so each one shows once before any repeats, and never twice in a row.
  (function rotator() {
    var D = (H.designs || []).filter(function (d) { return d && d.jpg; });
    var root = $("[data-rotator]"), stage = $(".hero-stage", root);
    if (!D.length || !stage) return;
    var n = D.length, every = Math.max(3, +H.rotateSeconds || 6) * 1000;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var slides = [], bag = [], seq = [], pos = -1, timer = null, busy = false;
    var userPaused = reduced.matches, hidden = document.hidden, offscreen = false;

    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    function refill(avoid) {
      if (bag.length) return;
      bag = shuffle(D.map(function (_, i) { return i; }));
      if (n > 1 && bag[0] === avoid) bag.push(bag.shift()); // no repeat across cycles
    }
    function take(avoid) { refill(avoid); return bag.shift(); }
    function slide(i, first) {
      if (slides[i]) return slides[i];
      var d = D[i], el = document.createElement("div");
      el.className = "hero-slide";
      el.innerHTML =
        '<div class="hero-card" style="aspect-ratio:' + (+d.width) + " / " + (+d.height) + '">' +
          (d.glow ? '<img class="hero-glow" src="' + esc(d.glow) + '" alt="" aria-hidden="true" style="object-position:' + esc(d.focus || "50% 50%") + '">' : "") +
          "<picture>" + (d.webp ? '<source srcset="' + esc(d.webp) + '" type="image/webp">' : "") +
          '<img class="hero-img" src="' + esc(d.jpg) + '" width="' + d.width + '" height="' + d.height + '" alt="' + esc(d.alt) +
          '" decoding="async"' + (first ? ' fetchpriority="high"' : "") + "></picture>" +
        "</div>";
      el.setAttribute("aria-hidden", "true");
      stage.appendChild(el); // appended invisibly so it starts loading
      return (slides[i] = el);
    }
    function ready(el) {
      var img = el.querySelector(".hero-img");
      return new Promise(function (res) {
        if (img.complete && img.naturalWidth) return res();
        var done = function () { res(); };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        setTimeout(done, 5000);
      }).then(function () { return img.decode ? img.decode().catch(function () {}) : null; });
    }
    function upcoming() {
      if (pos < seq.length - 1) return seq[pos + 1];
      if (n < 2) return null;
      refill(seq[pos]); return bag[0];
    }
    function show(i) {
      busy = true;
      var el = slide(i);
      return ready(el).then(function () {
        slides.forEach(function (s) { if (s && s !== el) { s.classList.remove("on"); s.setAttribute("aria-hidden", "true"); } });
        el.classList.add("on"); el.removeAttribute("aria-hidden");
        var u = upcoming(); if (u != null && n > 1) slide(u); // preload the next design
        busy = false; schedule();
      });
    }
    function next() {
      if (busy || n < 2) return;
      if (pos < seq.length - 1) pos++; else { seq.push(take(seq[pos])); pos++; }
      show(seq[pos]);
    }
    function prev() {
      if (busy || n < 2) return;
      if (pos > 0) pos--;
      else { var c = seq[0], p; do { p = Math.floor(Math.random() * n); } while (p === c); seq.unshift(p); }
      show(seq[pos]);
    }
    function running() { return n > 1 && !userPaused && !hidden && !offscreen; }
    function schedule() {
      clearTimeout(timer); timer = null;
      if (running() && !busy) timer = setTimeout(next, every);
    }
    // First design: random, loaded straight away.
    seq.push(take(null)); pos = 0;
    var firstEl = slide(seq[0], true);
    firstEl.classList.add("first");
    show(seq[0]);

    if (n > 1) {
      var ctl = $(".hero-controls", root), pb = $('[data-hc="pause"]', root);
      ctl.hidden = false;
      var syncPause = function () {
        pb.setAttribute("aria-pressed", String(userPaused));
        pb.setAttribute("aria-label", userPaused ? "Play artwork rotation" : "Pause artwork rotation");
        root.classList.toggle("is-paused", userPaused);
      };
      syncPause();
      $('[data-hc="next"]', root).addEventListener("click", next);
      $('[data-hc="prev"]', root).addEventListener("click", prev);
      pb.addEventListener("click", function () { userPaused = !userPaused; syncPause(); schedule(); });
      document.addEventListener("visibilitychange", function () { hidden = document.hidden; schedule(); });
      if (reduced.addEventListener) reduced.addEventListener("change", function (e) { if (e.matches) { userPaused = true; syncPause(); schedule(); } });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) { offscreen = !es[0].isIntersecting; schedule(); }).observe(root);
      }
    }
  })();

  // ---------- yacht feature ----------
  var F = C.feature;
  var fMedia = F.video && F.video.src
    ? '<video class="scene-img" controls preload="none" playsinline' +
        (F.video.poster ? ' poster="' + esc(F.video.poster) + '"' : "") +
        ' width="' + F.media.width + '" height="' + F.media.height + '"><source src="' + esc(F.video.src) + '"></video>'
    : picture(F.media, "scene-img", false);
  $("[data-scenes]").innerHTML =
    '<div class="wrap feature">' +
      '<figure class="scene-media">' +
        '<div class="scene-frame">' + fMedia + "</div>" +
        '<figcaption class="scene-cap">' + esc(F.source) + "</figcaption>" +
      "</figure>" +
      '<div class="feature-copy">' +
        '<h2 class="eyebrow" id="apocrycoin-title">' + esc(F.label) + "</h2>" +
        '<blockquote class="quote"><p>' + esc(F.quote) + "</p></blockquote>" +
      "</div>" +
    "</div>";

  // ---------- the art ----------
  var A = C.art, AF = A.feature;
  $("[data-art]").innerHTML =
    '<div class="wrap art-grid">' +
      '<div class="art-copy">' +
        '<p class="eyebrow">' + esc(A.eyebrow) + "</p>" +
        '<h2 class="section-title" id="art-title">' + title(A.title) + "</h2>" +
        '<p class="section-lede">' + esc(A.body) + "</p>" +
        '<p class="art-label">' + esc(A.label) + "</p>" +
      "</div>" +
      '<figure class="artwork">' +
        '<div class="artwork-frame"><img src="' + esc(AF.src) + '" width="' + AF.width + '" height="' + AF.height + '" alt="' + esc(AF.alt) + '" loading="lazy" decoding="async"></div>' +
        '<figcaption class="artwork-cap"><span class="artwork-no">' + esc(AF.number) + "</span>" +
          '<span class="artwork-title">' + esc(AF.title) + "</span></figcaption>" +
      "</figure>" +
    "</div>";

  // ---------- the details ----------
  var I = C.details;
  var links = (C.links || []).filter(function (l) { return l && l.href; });
  $("[data-details]").innerHTML =
    '<div class="wrap info-grid">' +
      '<div class="info-copy">' +
        '<h2 class="section-title" id="details-title">' + title(I.title) + "</h2>" +
        '<p class="section-lede">' + esc(I.body) + "</p>" +
        (links.length ? '<ul class="info-links">' + links.map(function (l) { return "<li>" + link(l, "btn btn-ghost btn-sm") + "</li>"; }).join("") + "</ul>" : "") +
      "</div>" +
      '<dl class="status">' + I.status.map(function (s) {
        if (s.copy) {
          return '<div class="status-row"><dt>' + esc(s.label) + "</dt>" +
            '<dd class="status-copy"><code class="addr" translate="no">' + esc(s.value) + "</code>" +
            '<button type="button" class="btn btn-ghost btn-sm copy-btn" data-copy="' + esc(s.value) + '" aria-label="Copy ' + esc(s.label.toLowerCase()) + '">Copy</button>' +
            '<span class="copy-done" role="status" aria-live="polite"></span></dd></div>';
        }
        return '<div class="status-row"><dt>' + esc(s.label) + '</dt><dd><span class="dot" aria-hidden="true"></span>' + esc(s.value) + "</dd></div>";
      }).join("") + "</dl>" +
    "</div>";

  // Copy buttons (contract address).
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var v = b.getAttribute("data-copy"), done = b.parentNode.querySelector(".copy-done");
    function ok() { b.textContent = "Copied"; if (done) done.textContent = "Address copied."; setTimeout(function () { b.textContent = "Copy"; if (done) done.textContent = ""; }, 2000); }
    function fallback() {
      var t = document.createElement("textarea"); t.value = v; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); try { document.execCommand("copy"); ok(); } catch (x) {} document.body.removeChild(t);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(v).then(ok, fallback); else fallback();
  });

  // ---------- footer ----------
  $("[data-footer]").innerHTML =
    '<div class="wrap">' +
      '<div class="footer-top"><a class="brand" href="#top" aria-label="' + esc(C.brand) + ', back to top">' + wordmark() + "</a>" +
      '<ul class="footer-nav">' + C.nav.map(function (n) { return "<li>" + link(n) + "</li>"; }).join("") + "</ul></div>" +
      '<p class="footer-statement">' + esc(C.footer.statement) + "</p>" +
      '<p class="footer-risk">' + esc(C.footer.risk) + "</p>" +
    "</div>";

  // ---------- interactions ----------
  var header = $(".site-header");
  var toggle = $(".menu-toggle");
  var menu = $("#mobile-menu");
  var label = $("[data-menu-label]");

  function setMenu(open, returnFocus) {
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Close menu" : "Open menu";
    menu.hidden = !open;
    header.classList.toggle("menu-open", open);
    document.body.classList.toggle("no-scroll", open);
    if (open) { var first = menu.querySelector("a"); if (first) first.focus(); }
    else if (returnFocus) toggle.focus();
  }
  toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (e.key === "Escape") { setMenu(false, true); return; }
    if (e.key === "Tab") {
      var f = [toggle].concat([].slice.call(menu.querySelectorAll("a")));
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.matchMedia("(min-width: 900px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // In-page links move focus to the target for keyboard and screen reader users.
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute("data-wallet-open")) return; // holder.js handles the wallet button
    var t = document.getElementById(a.getAttribute("href").slice(1));
    if (!t) return;
    if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
    setTimeout(function () { t.focus({ preventScroll: true }); }, 0);
  });

  // Restrained motion: a slow settle on the hero image and quiet reveals.
  // Skipped entirely when reduced motion is requested.
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    document.documentElement.classList.add("motion");
    if ("IntersectionObserver" in window) {
      var els = document.querySelectorAll(".feature, .artwork, .art-copy, .status, .info-copy, .holder-copy, .holder-panel");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px" });
      els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
    }
  }
})();
