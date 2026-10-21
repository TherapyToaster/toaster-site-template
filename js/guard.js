/* Shared checks for the page and the Node tests. No dependencies. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SiteGuard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /* Hide a live bar whose status.json has not been refreshed in this long. */
  var LIVE_MAX_AGE_MS = 15 * 60 * 1000;

  function safeUrl(value, base) {
    if (value == null) return '';
    var raw = String(value).trim();
    if (!raw || /[\u0000-\u001F\u007F]/.test(raw)) return '';
    if (raw.indexOf('//') === 0) return '';
    var baseUrl = base || (typeof location !== 'undefined' ? location.href : '');
    if (!baseUrl) return '';
    var url;
    try {
      url = new URL(raw, baseUrl);
    } catch (err) {
      return '';
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  }

  function isFresh(updated, nowMs, maxAge) {
    var t = Date.parse(updated || '');
    if (!(t > 0)) return false;
    var age = nowMs - t;
    var limit = maxAge == null ? LIVE_MAX_AGE_MS : maxAge;
    return age <= limit && age >= -5 * 60 * 1000;
  }

  /*
   * preview: '' | 'on' | 'off'
   * 'on' forces the bar (for ?live=1). A fresh live status still wins so the
   * real title and link are used. 'off' forces it hidden.
   */
  function bannerDecision(status, options) {
    var opts = options || {};
    var now = opts.now != null ? opts.now : Date.now();
    var maxAge = opts.maxAge != null ? opts.maxAge : LIVE_MAX_AGE_MS;
    var preview = opts.preview || '';
    if (preview === 'off') return { show: false, preview: false };
    var fresh = !!(status && status.live === true && isFresh(status.updated, now, maxAge));
    if (fresh) return { show: true, preview: false };
    if (preview === 'on') return { show: true, preview: true };
    return { show: false, preview: false };
  }

  function isTwitterHost(href) {
    try {
      var host = new URL(href).hostname.toLowerCase().replace(/^www\./, '');
      return host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com';
    } catch (err) {
      return false;
    }
  }

  /* Status-file links may only point at Twitter. The config fallback may be any https URL. */
  function spaceHref(status, fallback, base) {
    var list = [];
    if (status && status.url) list.push(String(status.url));
    if (status && status.id && /^[A-Za-z0-9]+$/.test(String(status.id))) {
      list.push('https://twitter.com/i/spaces/' + encodeURIComponent(String(status.id)));
    }
    var i;
    for (i = 0; i < list.length; i++) {
      var href = safeUrl(list[i], base || 'https://example.test/');
      if (href && isTwitterHost(href)) return href;
    }
    var fb = safeUrl(fallback || '', base || 'https://example.test/');
    if (fb) return fb;
    return 'https://twitter.com/i/spaces';
  }

  return {
    LIVE_MAX_AGE_MS: LIVE_MAX_AGE_MS,
    safeUrl: safeUrl,
    isFresh: isFresh,
    bannerDecision: bannerDecision,
    spaceHref: spaceHref
  };
});
