/*
  Apocrycoin Holder Access (browser side)
  ---------------------------------------------------------------
  Solana mainnet. Wallets connect through Wallet Standard (Phantom, Solflare,
  Backpack and others). The browser never decides eligibility: the server at
  holderAccess.apiBase issues a one-time sign-in message, checks the
  signature, reads the balance on-chain and serves the artwork.

  The visitor only ever signs a plain-text sign-in message. This file never
  requests a transaction, approval, transfer, seed phrase or private key.

  Closed ("Holder verification opens soon.") unless apiBase is set AND the
  server reports itself enabled (mint verified on-chain, config complete).
*/
(function () {
  "use strict";
  var C = window.APOCRYCOIN;
  var H = C && C.holderAccess;
  var root = document.querySelector("[data-holder]");
  if (!H || !root) return;

  var API = (H.apiBase || "").replace(/\/$/, "");
  var CHAIN = "solana:mainnet";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function short(a) { return a && a.length > 14 ? a.slice(0, 6) + "…" + a.slice(-4) : a; }
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

  root.innerHTML =
    '<div class="wrap holder-grid">' +
      '<div class="holder-copy">' +
        '<p class="eyebrow">' + esc(H.eyebrow) + "</p>" +
        '<h2 class="section-title" id="holders-title">' + esc(H.title) + "</h2>" +
        '<p class="section-lede">' + esc(H.body) + "</p>" +
        (H.status ? '<p class="holder-mint"><span class="dot" aria-hidden="true"></span>' + esc(H.status) + "</p>" : "") +
        (H.note ? '<p class="holder-disclaimer">' + esc(H.note) + "</p>" : "") +
      "</div>" +
      '<div class="holder-panel" data-panel aria-live="polite"></div>' +
    "</div>" +
    (H.concept ? '<figure class="wrap holder-concept"><picture>' +
      (H.concept.webp ? '<source srcset="' + esc(H.concept.webp) + '" type="image/webp">' : "") +
      '<img src="' + esc(H.concept.jpg) + '" width="' + H.concept.width + '" height="' + H.concept.height + '" alt="' + esc(H.concept.alt) + '" loading="lazy" decoding="async"></picture>' +
      '<figcaption>' + esc(H.concept.caption) + "</figcaption></figure>" : "") +
    '<div class="wrap" data-gallery></div>' +
    (H.eligibleModal ? '<dialog class="mint-modal" aria-labelledby="mint-modal-title" aria-describedby="mint-modal-body">' +
      '<p class="eyebrow">' + esc(H.eyebrow) + "</p>" +
      '<h2 class="mint-modal-title" id="mint-modal-title" tabindex="-1">' + esc(H.eligibleModal.title) + "</h2>" +
      '<p class="mint-modal-body" id="mint-modal-body">' + esc(H.eligibleModal.body) + "</p>" +
      '<p class="holder-mint"><span class="dot" aria-hidden="true"></span>' + esc(H.eligibleModal.status) + "</p>" +
      '<p class="mint-modal-addr" data-modal-addr></p>' +
      '<button type="button" class="btn btn-accent" data-modal-close>' + esc(H.eligibleModal.close) + "</button>" +
    "</dialog>" : "");
  var panel = root.querySelector("[data-panel]");
  var galleryEl = root.querySelector("[data-gallery]");

  // ---------- API ----------
  function api(path, opts) {
    opts = opts || {};
    return fetch(API + path, {
      method: opts.method || "GET",
      credentials: "include",
      headers: opts.body ? { "content-type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; });
    });
  }

  // ---------- Wallet Standard discovery ----------
  var found = [];
  var registry = { register: function () {
    [].slice.call(arguments).forEach(function (w) { if (found.indexOf(w) < 0) found.push(w); });
    return function () {};
  } };
  window.addEventListener("wallet-standard:register-wallet", function (e) { try { e.detail(registry); } catch (x) {} });
  try { window.dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: registry })); } catch (x) {}
  function wallets() {
    return found.filter(function (w) {
      return w.features && w.features["standard:connect"] && w.features["solana:signMessage"] &&
        (w.chains || []).indexOf(CHAIN) >= 0;
    });
  }

  // ---------- state ----------
  var S = { step: "closed", req: null, previews: [], wallet: null, account: null, challenge: null, message: null, result: null, items: null };
  function set(p) { for (var k in p) S[k] = p[k]; render(); }

  function reqText() { return S.req ? "Hold at least " + Number(S.req.minimumWholeTokens).toLocaleString("en-US") + " Apocrycoin." : ""; }
  function reqBlock() { return S.req ? '<p class="holder-req"><span class="holder-k">Requirement</span>' + esc(reqText()) + "</p>" : ""; }
  function addrBlock() {
    return S.account ? '<p class="holder-addr"><span class="holder-k">Connected</span><span title="' + esc(S.account.address) + '">' +
      esc(S.wallet ? S.wallet.name + " · " : "") + esc(short(S.account.address)) + "</span></p>" : "";
  }
  var disconnectBtn = '<button class="btn btn-ghost" type="button" data-act="disconnect">Disconnect</button>';

  function render() {
    var h = "";
    switch (S.step) {
      case "closed":
        h = '<p class="holder-status"><span class="dot" aria-hidden="true"></span>' + esc(H.notReady) + "</p>"; break;
      case "idle": case "pick":
        h = reqBlock() +
          '<button class="btn btn-accent" type="button" data-act="connect">' + esc(H.button) + "</button>" +
          (S.step === "pick" ? walletList() : "") +
          (S.message ? '<p class="holder-msg" role="status">' + esc(S.message) + "</p>" : "") +
          '<p class="holder-note">Read-only. We never ask for your seed phrase, approvals, payments or transfers.</p>';
        break;
      case "busy":
        h = '<p class="holder-status holder-busy"><span class="spinner" aria-hidden="true"></span>' + esc(S.message) + "</p>"; break;
      case "sign":
        h = addrBlock() +
          '<p class="holder-k">Sign in</p>' +
          '<p class="holder-sign">Your wallet will show a short sign-in message for <strong>' + esc(H.domain) + "</strong>. " +
          "Signing it proves you own this wallet. It is not a transaction. It costs nothing, moves nothing and expires in 5 minutes.</p>" +
          '<div class="holder-actions"><button class="btn btn-accent" type="button" data-act="sign">Sign message</button>' + disconnectBtn + "</div>" +
          (S.message ? '<p class="holder-msg" role="status">' + esc(S.message) + "</p>" : "");
        break;
      case "result":
        var r = S.result, cls = r === "eligible" ? "ok" : r === "below" ? "no" : "err";
        h = '<p class="holder-result holder-' + cls + '">' + esc(H.results[r]) + "</p>" + reqBlock() + addrBlock() +
          '<div class="holder-actions">' +
            (r === "unavailable" ? '<button class="btn btn-accent" type="button" data-act="retry">Try again</button>' : "") +
            disconnectBtn + "</div>";
        break;
    }
    panel.innerHTML = h;
    renderGallery();
    syncHeader();
  }

  // Header "Connect wallet" buttons (desktop and mobile menu) open this same flow.
  function syncHeader() {
    var addr = S.account && S.account.address;
    [].forEach.call(document.querySelectorAll("[data-wallet-open]"), function (b) {
      b.textContent = addr ? short(addr) : H.button;
      b.classList.toggle("is-connected", !!addr);
      if (addr) b.setAttribute("aria-label", "Wallet " + addr + ", go to holder access"); else b.removeAttribute("aria-label");
    });
  }
  function startConnect() {
    var ws = wallets();
    if (ws.length === 1) return connect(ws[0]);
    set({ step: "pick", message: null });
    var first = panel.querySelector(".wallet-btn"); if (first) first.focus();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-wallet-open]");
    if (!b) return;
    e.preventDefault();
    var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(function () { root.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }); }, 0);
    if (S.step === "idle" || S.step === "pick") startConnect();
    else { var f = panel.querySelector("button, a"); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 0); }
  });

  function walletList() {
    var ws = wallets();
    if (ws.length) {
      return '<ul class="wallet-list">' + ws.map(function (w, i) {
        return '<li><button class="wallet-btn" type="button" data-act="pick" data-i="' + i + '">' +
          (w.icon && /^data:image\//.test(w.icon) ? '<img src="' + esc(w.icon) + '" alt="" width="24" height="24">' : "") + esc(w.name) + "</button></li>";
      }).join("") + "</ul>";
    }
    var here = location.href, ref = encodeURIComponent(location.origin);
    return '<p class="holder-msg">' + (isMobile ? "Open this page in your wallet app to connect." : "No Solana wallet found in this browser. Install Phantom or Solflare, then reload.") + "</p>" +
      (isMobile ? '<ul class="wallet-list">' +
        '<li><a class="wallet-btn" href="https://phantom.app/ul/browse/' + encodeURIComponent(here) + "?ref=" + ref + '">Open in Phantom</a></li>' +
        '<li><a class="wallet-btn" href="https://solflare.com/ul/v1/browse/' + encodeURIComponent(here) + "?ref=" + ref + '">Open in Solflare</a></li>' +
      "</ul>" : "");
  }

  function renderGallery() {
    if (S.step === "result" && S.result === "eligible" && S.items) {
      galleryEl.innerHTML =
        '<div class="gallery">' +
          '<p class="holder-k gallery-label">' + esc(H.galleryTitle) + "</p>" +
          (S.items.length
            ? '<ul class="gallery-grid">' + S.items.map(function (it) {
                return '<li class="gallery-item"><figure><div class="gallery-frame"><img src="' + esc(API + it.url) + '" alt="' + esc(it.title) + '"' +
                  (it.width ? ' width="' + it.width + '" height="' + it.height + '"' : "") + ' loading="lazy" decoding="async"></div>' +
                  '<figcaption>' + esc(it.title) + "</figcaption></figure></li>";
              }).join("") + "</ul>"
            : '<p class="gallery-empty">No pieces have been added yet.</p>') +
          '<p class="holder-note">' + esc(H.galleryNote) + " " + esc(H.shareNote) + "</p>" +
        "</div>";
    } else if (S.previews.length && S.step !== "closed") {
      galleryEl.innerHTML = '<div class="gallery"><p class="holder-k gallery-label">' + esc(H.previewsLabel) + '</p><ul class="gallery-grid gallery-previews">' + S.previews.map(function (it) {
        return '<li class="gallery-item"><figure><div class="gallery-frame"><img src="' + esc(API + it.thumb) + '" alt="' + esc(it.title) + ' (preview)" loading="lazy"></div>' +
          "<figcaption>" + esc(it.title) + "</figcaption></figure></li>";
      }).join("") + "</ul></div>";
    } else {
      galleryEl.innerHTML = "";
    }
  }

  // ---------- flow ----------
  function isRejection(e) { return e && (e.code === 4001 || /reject|denied|cancel|declin/i.test(e.message || "")); }
  function b64(bytes) { var s = ""; bytes = new Uint8Array(bytes); for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }

  function loadGallery() {
    return api("/api/gallery").then(function (g) {
      if (g._status === 200) return set({ step: "result", result: "eligible", items: g.items || [] });
      if (g._status === 403) return set({ step: "result", result: "below", items: null });
      if (g._status === 401) return set({ step: "idle", message: "Your session ended. Connect again.", items: null });
      set({ step: "result", result: "unavailable", items: null });
    }).catch(function () { set({ step: "result", result: "unavailable", items: null }); });
  }

  function requestChallenge() {
    set({ step: "busy", message: "Preparing sign-in…" });
    api("/api/holder/challenge", { method: "POST", body: { address: S.account.address } }).then(function (c) {
      if (c._status !== 200) throw new Error("challenge");
      set({ step: "sign", challenge: c, message: null });
    }).catch(function () { set({ step: "result", result: "unavailable" }); });
  }

  function sign() {
    var c = S.challenge;
    if (!c) return requestChallenge();
    set({ step: "busy", message: "Waiting for your signature…" });
    S.wallet.features["solana:signMessage"].signMessage({ account: S.account, message: new TextEncoder().encode(c.message) })
      .then(function (out) {
        out = out[0] || out;
        S.challenge = null; // single use
        set({ step: "busy", message: "Checking holdings…" });
        return api("/api/holder/verify", { method: "POST", body: { address: S.account.address, nonce: c.nonce, signature: b64(out.signature) } });
      })
      .then(function (v) {
        if (v.status === "eligible") return loadGallery().then(function () { if (S.result === "eligible") openModal(); });
        if (v.status === "below") return set({ step: "result", result: "below" });
        if (v.error === "challenge_expired") return set({ step: "sign", message: "That sign-in expired. Sign again." });
        set({ step: "result", result: "unavailable" });
      })
      .catch(function (e) {
        S.challenge = null;
        if (isRejection(e)) set({ step: "sign", message: "Signature cancelled. Nothing was signed." });
        else set({ step: "result", result: "unavailable" });
      });
  }

  // "Eligible to mint" pop-up: a native modal dialog (focus stays inside, Escape closes),
  // shown only after the server has verified this wallet. It offers no mint action.
  var modal = root.querySelector(".mint-modal"), lastFocus = null;
  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    var a = modal.querySelector("[data-modal-addr]"); if (a) a.textContent = S.account ? "Wallet " + short(S.account.address) : "";
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    document.body.classList.add("no-scroll");
    var t = modal.querySelector("[data-modal-close]"); if (t) t.focus();
  }
  function closeModal() {
    if (!modal) return;
    if (typeof modal.close === "function" && modal.open) modal.close(); else modal.removeAttribute("open");
  }
  if (modal) {
    modal.addEventListener("close", function () {
      document.body.classList.remove("no-scroll");
      var back = panel.querySelector(".holder-result") || lastFocus;
      if (back) { if (!back.hasAttribute("tabindex")) back.setAttribute("tabindex", "-1"); back.focus({ preventScroll: true }); }
    });
    modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest("[data-modal-close]")) closeModal(); });
    // Fallback focus trap for browsers without native modal dialogs.
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
      if (e.key !== "Tab") return;
      var f = [].slice.call(modal.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])"));
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
  }

  function connect(w) {
    set({ step: "busy", message: "Waiting for your wallet…" });
    w.features["standard:connect"].connect().then(function () {
      var acct = (w.accounts || []).filter(function (a) { return !a.chains || a.chains.indexOf(CHAIN) >= 0; })[0];
      if (!acct) { var e = new Error("unsupported"); e.code = "unsupported"; throw e; }
      S.wallet = w; S.account = acct;
      requestChallenge();
    }).catch(function (e) {
      var msg = e && e.code === "unsupported" ? "Switch this wallet to Solana mainnet and try again."
        : isRejection(e) ? "Connection cancelled." : "We couldn’t connect to that wallet. Try again.";
      set({ step: "idle", message: msg });
    });
  }

  function disconnect() {
    var w = S.wallet;
    api("/api/holder/logout", { method: "POST", body: {} }).catch(function () {});
    if (w && w.features["standard:disconnect"]) w.features["standard:disconnect"].disconnect().catch(function () {});
    set({ step: "idle", wallet: null, account: null, challenge: null, result: null, items: null, message: null });
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "connect") startConnect();
    else if (a === "pick") connect(wallets()[+b.getAttribute("data-i")]);
    else if (a === "sign") sign();
    else if (a === "retry") { if (S.result === "eligible" || !S.account) loadGallery(); else requestChallenge(); }
    else if (a === "disconnect") disconnect();
  });

  // ---------- start ----------
  render();
  if (!API) return; // production default: closed
  api("/api/holder/status").then(function (s) {
    if (!s.enabled) return;
    S.req = s.requirement;
    api("/api/gallery/previews").then(function (p) { S.previews = (p.items || []); render(); }).catch(function () {});
    return api("/api/holder/session").then(function (ss) {
      if (ss.session && ss.status === "eligible") {
        S.account = { address: ss.address };
        return loadGallery();
      }
      set({ step: "idle" });
    });
  }).catch(function () { /* server unreachable: stay closed */ });
})();
