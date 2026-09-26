// Google Consent Mode v2 banner — two categories only, as requested:
// "Necessary" (always on, no toggle needed — it isn't a Google consent type)
// and "Advertising & analytics" (ad_storage/ad_user_data/ad_personalization/
// analytics_storage, granted or denied together as one choice).
//
// Shown to every visitor rather than geo-restricted to the UK: reliable
// client-side geolocation would need a third-party IP lookup service, and
// the safe default for a small site is to ask everyone rather than risk
// under-asking a visitor the law says must be asked. index.html's inline
// gtag snippet already sets `default` to "denied" before this file loads —
// this file only ever calls `update`, and decides whether to show the
// banner at all.
(function () {
  'use strict';

  var STORAGE_KEY = 'aizlabs_consent_v1';

  function getStoredChoice() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function storeChoice(granted) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ granted: granted, ts: Date.now() }));
    } catch (e) {
      // Private browsing / storage blocked: the choice just won't be
      // remembered across visits. Consent still applies for this pageview.
    }
  }

  function applyConsent(granted) {
    var state = granted ? 'granted' : 'denied';
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'update', {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
  }

  var bannerEl = null;

  function closeBanner() {
    if (!bannerEl) return;
    var el = bannerEl;
    bannerEl = null;
    el.classList.remove('in');
    // Wait for the slide-down transition before removing, so "Cookie
    // Settings" reopening it right after doesn't fight a mid-animation node.
    setTimeout(function () { el.remove(); }, 400);
  }

  function showBanner() {
    if (bannerEl) return;

    var bar = document.createElement('div');
    bar.className = 'consent-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie preferences');
    bar.innerHTML =
      '<div class="shell consent-inner">' +
        '<p class="consent-text">' +
          'We use <strong>necessary</strong> cookies to run this site, and — only with your permission — ' +
          '<strong>advertising &amp; analytics</strong> cookies to measure how our ads perform. ' +
          'Change your choice any time via &ldquo;Cookie Settings&rdquo; in the footer.' +
        '</p>' +
        '<div class="consent-actions">' +
          '<button type="button" class="btn btn-ghost consent-btn" data-consent="reject">Necessary Only</button>' +
          '<button type="button" class="btn btn-primary consent-btn" data-consent="accept">Accept All</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(bar);
    bannerEl = bar;

    bar.querySelector('[data-consent="accept"]').addEventListener('click', function () {
      applyConsent(true);
      storeChoice(true);
      closeBanner();
    });
    bar.querySelector('[data-consent="reject"]').addEventListener('click', function () {
      applyConsent(false);
      storeChoice(false);
      closeBanner();
    });

    // Double rAF: the slide-up transition needs the node painted in its
    // resting (translateY(100%)) state at least one frame before the "in"
    // class is added, or the browser collapses both into one and it just
    // appears with no animation.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.classList.add('in'); });
    });
  }

  function init() {
    var stored = getStoredChoice();
    if (stored) {
      applyConsent(!!stored.granted);
      return;
    }
    showBanner();
  }

  init();

  // "Cookie Settings" links/buttons anywhere on the page (see footer) reopen
  // the banner so a visitor can change an earlier choice — required
  // alongside consent itself: withdrawing must be as easy as giving it.
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (!trigger) return;
    e.preventDefault();
    showBanner();
  });
})();
