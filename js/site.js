/* Personal site. All visible copy comes from site.config.json. */
(function () {
  'use strict';

  var Guard = window.SiteGuard;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var pollTimer = 0;

  var ICONS = {
    twitter: [
      ['path', { d: 'M8.2 16.4c2.4-.7 4-3.2 4.9-5.6 1.2 1.6 2.8 2.4 4.8 2.2-.7 2.2-2.6 4-5.2 4.4-1.6.3-3-.1-4.1-1 .2.4.2.6-.4 0z' }],
      ['path', { d: 'M13.2 8.2c.9-1.1 1.8-1.8 3.2-2 .1 1.1-.3 1.9-.9 2.6  .7.1 1.4 0 2-.4-.4.7-1 1.2-1.7 1.6-.8.3-1.7.3-2.6.2z' }]
    ],
    tiktok: [
      ['path', { d: 'M9 17.5V7' }],
      ['path', { d: 'M9 7.2c1.6 1.8 3.2 2.4 5.2 2.4' }],
      ['path', { d: 'M14.2 9.6v5.2a3.2 3.2 0 1 1-2.2-3' }]
    ],
    instagram: [
      ['rect', { x: '4', y: '4', width: '16', height: '16', rx: '5' }],
      ['circle', { cx: '12', cy: '12', r: '3.4' }],
      ['circle', { cx: '17.2', cy: '6.8', r: '0.8', fill: 'currentColor', stroke: 'none' }]
    ],
    kick: [
      ['path', { d: 'M7 5v14' }],
      ['path', { d: 'M7 12h6' }],
      ['path', { d: 'M13 12l5-6.2' }],
      ['path', { d: 'M13 12l5 6.2' }]
    ],
    youtube: [
      ['rect', { x: '3', y: '6.5', width: '18', height: '11', rx: '3' }],
      ['path', { d: 'M11 9.5v5l4.2-2.5z', fill: 'currentColor', stroke: 'none' }]
    ],
    twitch: [
      ['path', { d: 'M6 5h12v9l-3 3h-3l-2 2H8v-2H6V5z' }],
      ['path', { d: 'M10 8v4.5M14 8v4.5' }]
    ],
    discord: [
      ['path', { d: 'M7.2 8.2c1.4-1 3-1.5 4.8-1.5s3.4.5 4.8 1.5' }],
      ['path', { d: 'M7.5 16c1.3.8 2.8 1.3 4.5 1.3s3.2-.5 4.5-1.3' }],
      ['path', { d: 'M8.2 9.4c.6 2.6 1.8 4 3.8 4s3.2-1.4 3.8-4' }]
    ],
    github: [
      ['path', { d: 'M9 18v-1.6c-2 .4-2.4-1-2.4-1s-.6-1.2 0-1.4 1.5.2 1.5.2 1-.6 2.2-.2' }],
      ['circle', { cx: '12', cy: '12', r: '8' }]
    ],
    facebook: [
      ['path', { d: 'M14 8h2V5.5h-2c-2 0-3.2 1.3-3.2 3.2V11H9v2.6h1.8V20H14v-6.4h2l.3-2.6H14V9c0-.5.2-1 .9-1z' }]
    ],
    website: [
      ['circle', { cx: '12', cy: '12', r: '8' }],
      ['path', { d: 'M4 12h16' }],
      ['path', { d: 'M12 4c2 2.5 2 13.5 0 16' }],
      ['path', { d: 'M12 4c-2 2.5-2 13.5 0 16' }]
    ],
    link: [
      ['path', { d: 'M10 13.2a4.2 4.2 0 0 0 6 .1l1.2-1.2a4.2 4.2 0 0 0-6-6l-.7.7' }],
      ['path', { d: 'M14 10.8a4.2 4.2 0 0 0-6-.1l-1.2 1.2a4.2 4.2 0 0 0 6 6l.7-.7' }]
    ]
  };

  var LABELS = {
    twitter: 'Twitter',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    kick: 'Kick',
    youtube: 'YouTube',
    twitch: 'Twitch',
    discord: 'Discord',
    github: 'GitHub',
    facebook: 'Facebook',
    website: 'Website',
    x: 'Twitter'
  };

  function el(tag, attrs) {
    var node = document.createElement(tag);
    var children = Array.prototype.slice.call(arguments, 2);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = String(value);
        else if (key === 'hidden') node.hidden = true;
        else node.setAttribute(key, value === true ? '' : String(value));
      });
    }
    children.forEach(function (child) {
      append(node, child);
    });
    return node;
  }

  function append(node, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (item) { append(node, item); });
      return;
    }
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  function icon(name) {
    var key = String(name || '').toLowerCase();
    if (key === 'x') key = 'twitter';
    var shapes = ICONS[key] || ICONS.link;
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    shapes.forEach(function (shape) {
      var part = document.createElementNS(SVG_NS, shape[0]);
      Object.keys(shape[1]).forEach(function (attr) {
        part.setAttribute(attr, shape[1][attr]);
      });
      svg.appendChild(part);
    });
    return svg;
  }

  function megaphone() {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var body = document.createElementNS(SVG_NS, 'path');
    body.setAttribute('d', 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z');
    body.setAttribute('fill', '#000');
    var waves = document.createElementNS(SVG_NS, 'path');
    waves.setAttribute('d', 'M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13');
    waves.setAttribute('fill', 'none');
    waves.setAttribute('stroke', '#000');
    waves.setAttribute('stroke-width', '2.2');
    waves.setAttribute('stroke-linecap', 'round');
    svg.appendChild(body);
    svg.appendChild(waves);
    return svg;
  }

  function text(value) {
    return value == null ? '' : String(value);
  }

  function list(value, limit) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, limit || 40);
  }

  function hrefFor(value) {
    return Guard.safeUrl(value, document.baseURI);
  }

  function isExternal(href) {
    try {
      return new URL(href, document.baseURI).origin !== window.location.origin;
    } catch (err) {
      return false;
    }
  }

  function newTab(node) {
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    node.appendChild(el('span', { class: 'sr-only', text: ' (opens in a new tab)' }));
  }

  function setMeta(selector, attr, value) {
    var node = document.head.querySelector(selector);
    if (node && value) node.setAttribute(attr, value);
  }

  function linesOf(cfg) {
    if (Array.isArray(cfg.nameLines) && cfg.nameLines.length) {
      return cfg.nameLines.map(text).filter(Boolean).slice(0, 4);
    }
    var name = text(cfg.name).trim();
    if (!name) return ['YOUR NAME'];
    return name.split(/\s+/).slice(0, 4);
  }

  function networkLabel(item) {
    if (item && item.label) return text(item.label);
    var key = text(item && item.network).toLowerCase();
    return LABELS[key] || 'Link';
  }

  function digits(value) {
    return text(value).slice(0, 12).split('').map(function (ch) {
      return el('span', { class: 'digit', text: ch });
    });
  }

  function renderError(message) {
    var app = document.getElementById('app');
    app.replaceChildren(el('div', { class: 'error-box', role: 'alert' },
      el('h1', { text: 'Could not load this site' }),
      el('p', { text: message }),
      el('p', { text: 'Fix site.config.json and refresh. Open the folder with a local web server if you are previewing on your computer.' })
    ));
  }

  function noticeTime(item) {
    var t = Date.parse(item && item.date || '');
    return t > 0 ? t : 0;
  }

  function sortedNotices(items) {
    return items.map(function (item, index) {
      return { item: item, index: index, time: noticeTime(item) };
    }).sort(function (a, b) {
      if (a.time !== b.time) return b.time - a.time;
      return a.index - b.index;
    });
  }

  function openDialog(trigger, title, message) {
    var old = document.getElementById('hero-dialog');
    if (old) old.remove();
    var dialog = el('dialog', { id: 'hero-dialog', class: 'modal', 'aria-labelledby': 'hero-dialog-title' },
      el('h2', { id: 'hero-dialog-title', text: title || "Don't click this" }),
      el('p', { text: message }),
      el('button', { type: 'button', class: 'btn', text: 'Close' })
    );
    dialog.querySelector('button').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      dialog.remove();
      if (trigger && trigger.focus) trigger.focus();
    });
    document.body.appendChild(dialog);
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }

  function heroControl(cfg) {
    var hero = cfg.hero || {};
    var label = text(hero.tape || hero.label || "DON'T CLICK THIS");
    var message = text(hero.message || 'Set hero.url in site.config.json to send people somewhere when they press this button.');
    var href = hrefFor(hero.url);
    var control;
    if (href) {
      control = el('a', { class: 'hero-btn', href: href });
    } else {
      control = el('button', { type: 'button', class: 'hero-btn' });
      control.addEventListener('click', function () {
        openDialog(control, label, message);
      });
    }
    append(control, el('span', { class: 'leds', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')));
    append(control, el('span', { class: 'orb', 'aria-hidden': 'true' }));
    append(control, el('span', { class: 'tape', 'aria-hidden': 'true' }));
    append(control, el('span', { class: 'tape-label', text: label }));
    if (href && isExternal(href)) newTab(control);
    return control;
  }

  function avatarBlock(cfg) {
    var avatar = cfg.avatar || {};
    var src = hrefFor(avatar.src || 'assets/avatar.svg');
    var alt = text(avatar.alt || (text(cfg.name) || 'Site') + ' portrait');
    var frame = el('div', { class: 'avatar-frame' });
    if (!src) {
      frame.appendChild(el('span', { class: 'avatar-fallback', text: 'Add your photo' }));
      return frame;
    }
    var img = el('img', { src: src, alt: alt, width: '210', height: '262' });
    img.addEventListener('error', function () {
      var fallback = el('span', { class: 'avatar-fallback', text: 'Add your photo' });
      if (img.parentNode) img.replaceWith(fallback);
    });
    frame.appendChild(img);
    return frame;
  }

  function renderNav(items) {
    var nav = el('nav', { class: 'nav', 'aria-label': 'Primary' });
    var ul = el('ul', { class: 'nav-list' });
    list(items, 24).forEach(function (item) {
      var href = hrefFor(item && item.href);
      var label = text(item && item.label);
      if (!href || !label) return;
      var link = el('a', { href: href, text: label });
      if (item.current) link.setAttribute('aria-current', 'page');
      if (isExternal(href)) newTab(link);
      ul.appendChild(el('li', null, link));
    });
    nav.appendChild(ul);
    return nav;
  }

  function renderNotices(cfg) {
    var items = sortedNotices(list(cfg.notices, 20));
    if (!items.length) return null;
    var section = el('section', { class: 'section', id: 'notices', 'aria-labelledby': 'notices-title' });
    var box = el('div', { class: 'notice-box' },
      el('div', { class: 'hazard', 'aria-hidden': 'true' }),
      el('div', { class: 'notice-hd' },
        el('span', { class: 'notice-icon', 'aria-hidden': 'true' }, megaphone()),
        el('h2', { id: 'notices-title', text: text(cfg.noticesTitle || 'Notice') }),
        cfg.noticesNote ? el('p', { class: 'section-note', text: text(cfg.noticesNote) }) : null
      )
    );
    var ul = el('ul', { class: 'notice-list' });
    var now = Date.now();
    items.forEach(function (entry) {
      var item = entry.item || {};
      var body = el('div', { class: 'notice-body' },
        el('p', { class: 'notice-text', text: text(item.text) })
      );
      if (entry.time && now - entry.time < 4 * 24 * 60 * 60 * 1000 && now - entry.time > -60000) {
        body.querySelector('.notice-text').appendChild(el('span', { class: 'badge-new', text: 'NEW' }));
      }
      var href = hrefFor(item.url);
      if (href && item.button) {
        var button = el('a', { class: 'btn', href: href, text: text(item.button) });
        if (isExternal(href)) newTab(button);
        body.appendChild(button);
      }
      ul.appendChild(el('li', { class: 'notice-item' },
        el('span', { class: 'notice-date', text: text(item.date || 'Note') }),
        body
      ));
    });
    box.appendChild(ul);
    box.appendChild(el('div', { class: 'hazard', 'aria-hidden': 'true' }));
    section.appendChild(box);
    return section;
  }

  function renderSocials(items) {
    var rows = list(items, 16).map(function (item) {
      var href = hrefFor(item && item.url);
      if (!href) return null;
      var link = el('a', { class: 'social', href: href });
      link.appendChild(icon(item.network));
      var label = el('span', null);
      label.appendChild(document.createTextNode(networkLabel(item)));
      var handle = text(item.handle);
      if (handle) label.appendChild(el('span', { class: 'handle', text: ' ' + handle }));
      link.appendChild(label);
      if (isExternal(href)) {
        link.rel = 'me noopener noreferrer';
        link.target = '_blank';
        link.appendChild(el('span', { class: 'sr-only', text: ' (opens in a new tab)' }));
      }
      return link;
    }).filter(Boolean);
    if (!rows.length) return null;
    return el('section', { class: 'section', id: 'socials', 'aria-label': 'Social links' },
      el('div', { class: 'socials' }, rows)
    );
  }

  function postId(value) {
    var id = text(value).trim();
    return /^\d{5,25}$/.test(id) ? id : '';
  }

  function handleOf(cfg) {
    var handle = text(cfg.twitter && cfg.twitter.handle).replace(/^@/, '').trim();
    return /^[A-Za-z0-9_]{1,15}$/.test(handle) ? handle : '';
  }

  function renderLatest(cfg) {
    var twitter = cfg.twitter || {};
    var id = postId(twitter.latestPostId);
    var handle = handleOf(cfg);
    var section = el('section', { class: 'section', id: 'latest', 'aria-labelledby': 'latest-title' },
      el('div', { class: 'section-hd' },
        el('h2', { id: 'latest-title', text: text(cfg.latestTitle || 'Latest from Twitter') }),
        cfg.latestNote ? el('p', { class: 'section-note', text: text(cfg.latestNote) }) : null
      )
    );
    if (!id) {
      var profile = hrefFor(twitter.profileUrl || (handle ? 'https://twitter.com/' + handle : ''));
      var card = el('div', { class: 'tweet-placeholder' },
        el('p', { class: 'kicker', text: 'EXAMPLE' }),
        el('p', { class: 'card-title', text: handle ? '@' + handle : 'Your post' }),
        el('p', { class: 'card-text', text: 'Paste a post ID into twitter.latestPostId. On Twitter, open the post and copy the long number at the end of the link.' })
      );
      if (profile) {
        var more = el('a', { class: 'btn', href: profile, text: 'See Twitter' });
        if (isExternal(profile)) newTab(more);
        card.appendChild(more);
      }
      section.appendChild(card);
      return section;
    }
    var tweetHref = 'https://twitter.com/' + (handle || 'i') + '/status/' + id;
    var quote = el('blockquote', { class: 'twitter-tweet', 'data-theme': 'dark', 'data-dnt': 'true' },
      el('a', { href: tweetHref, text: 'View this post on Twitter' })
    );
    section.appendChild(el('div', { class: 'tweet-embed' }, quote));
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://platform.twitter.com/widgets.js';
    script.charset = 'utf-8';
    document.body.appendChild(script);
    return section;
  }

  function renderCards(id, title, note, items, className) {
    var cards = list(items, 24).map(function (item) {
      var href = hrefFor(item && item.url);
      var heading = text(item && item.title);
      if (!heading) return null;
      var card = href ? el('a', { class: className, href: href }) : el('div', { class: className });
      if (href && isExternal(href)) newTab(card);
      if (className === 'game-card') card.appendChild(el('span', { class: 'game-tape', 'aria-hidden': 'true' }));
      if (item.kicker) card.appendChild(el('span', { class: 'kicker', text: text(item.kicker) }));
      var body = el('span', { class: 'card-copy' },
        el('span', { class: 'card-title', text: heading }),
        item.text ? el('span', { class: 'card-text', text: text(item.text) }) : null
      );
      card.appendChild(body);
      card.appendChild(el('span', { class: 'card-go', text: text(item.action || (className === 'game-card' ? 'Play' : 'Open')) }));
      return card;
    }).filter(Boolean);
    if (!cards.length) return null;
    return el('section', { class: 'section', id: id, 'aria-labelledby': id + '-title' },
      el('div', { class: 'section-hd' },
        el('h2', { id: id + '-title', text: title }),
        note ? el('p', { class: 'section-note', text: note }) : null
      ),
      el('div', { class: className === 'game-card' ? 'game-grid' : 'link-list' }, cards)
    );
  }

  function renderStats(items) {
    var stats = list(items, 4).filter(function (item) { return item && item.label && item.value != null; });
    if (!stats.length) return null;
    var row = el('div', { class: 'stats' });
    stats.forEach(function (item, index) {
      if (index) row.appendChild(el('span', { class: 'dot', 'aria-hidden': 'true', text: '·' }));
      row.appendChild(el('span', { class: 'stat' },
        el('span', { class: 'stat-label', text: text(item.label) }),
        el('span', { class: 'digits' }, digits(item.value))
      ));
    });
    return row;
  }

  function previewMode() {
    var params = new URLSearchParams(window.location.search);
    var value = params.get('live');
    if (value == null) value = params.get('ttlive');
    if (value === '1') return 'on';
    if (value === '0') return 'off';
    return '';
  }

  function fillBanner(cfg, status, decision) {
    var bar = document.getElementById('live-bar');
    if (!bar) return;
    var spaces = cfg.spaces || {};
    var title = '';
    if (!decision.preview && status && status.title) title = text(status.title);
    else if (decision.preview) title = text(spaces.previewTitle || 'Example live Space');
    var href = Guard.spaceHref(decision.preview ? null : status, spaces.fallbackUrl, document.baseURI);
    bar.href = href;
    bar.hidden = false;
    var titleNode = bar.querySelector('.live-title');
    titleNode.textContent = title ? '\u201C' + title + '\u201D' : '';
  }

  function updateBanner(cfg, status) {
    var decision = Guard.bannerDecision(status, { preview: previewMode() });
    var bar = document.getElementById('live-bar');
    if (!decision.show) {
      if (bar) bar.hidden = true;
      return;
    }
    fillBanner(cfg, status, decision);
  }

  function pollStatus(cfg) {
    var spaces = cfg.spaces || {};
    if (spaces.enabled === false) {
      updateBanner(cfg, null);
      return;
    }
    if (document.hidden && document.getElementById('live-bar')) return;
    var raw = text(spaces.statusUrl || 'status.json');
    var href = hrefFor(raw);
    if (!href) {
      updateBanner(cfg, null);
      return;
    }
    var url;
    try {
      url = new URL(href);
    } catch (err) {
      updateBanner(cfg, null);
      return;
    }
    url.searchParams.set('t', String(Date.now()));
    fetch(url.href, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { updateBanner(cfg, data); })
      .catch(function () { updateBanner(cfg, null); });
  }

  function startPolling(cfg) {
    if (pollTimer) clearInterval(pollTimer);
    pollStatus(cfg);
    pollTimer = setInterval(function () { pollStatus(cfg); }, 60000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) pollStatus(cfg);
    });
  }

  function render(cfg) {
    if (!cfg || typeof cfg !== 'object') {
      renderError('site.config.json must be a JSON object.');
      return;
    }
    var name = text(cfg.name || 'YOUR NAME HERE');
    document.title = name;
    if (cfg.lang) document.documentElement.lang = text(cfg.lang);
    setMeta('meta[name="description"]', 'content', text(cfg.tagline || name));
    setMeta('meta[property="og:title"]', 'content', name);
    setMeta('meta[property="og:description"]', 'content', text(cfg.tagline || name));

    var app = document.getElementById('app');
    var bar = el('a', { id: 'live-bar', class: 'live-bar', hidden: true },
      el('span', { class: 'live-dot', 'aria-hidden': 'true' }),
      el('span', { class: 'live-label', text: 'Live now on Twitter Spaces' }),
      el('span', { class: 'live-title' }),
      el('span', { class: 'live-join' }, 'Join ', el('span', { 'aria-hidden': 'true', text: '\u2197' })),
      el('span', { class: 'sr-only', text: ' Opens in a new tab.' })
    );
    bar.href = 'https://twitter.com/i/spaces';
    bar.target = '_blank';
    bar.rel = 'noopener noreferrer';
    bar.setAttribute('aria-live', 'polite');

    var wordmark = el('h1', { class: 'wordmark' });
    linesOf(cfg).forEach(function (line) {
      wordmark.appendChild(el('span', { text: line }));
    });

    var header = el('header', { class: 'site-header', id: 'top' },
      el('div', { class: 'header-inner' },
        el('div', { class: 'brand' }, wordmark, heroControl(cfg), avatarBlock(cfg)),
        renderNav(cfg.nav)
      )
    );

    var main = el('main', { id: 'content', tabindex: '-1' },
      cfg.showExampleBanner ? el('p', { class: 'example-banner', text: 'EXAMPLE CONTENT — edit site.config.json. Set showExampleBanner to false when this site is yours.' }) : null,
      cfg.tagline ? el('p', { class: 'welcome', text: text(cfg.tagline) }) : null,
      renderStats(cfg.stats),
      renderNotices(cfg),
      renderSocials(cfg.socials),
      cfg.twitter ? renderLatest(cfg) : null,
      renderCards('links', text(cfg.linksTitle || 'Links'), text(cfg.linksNote || ''), cfg.links, 'link-card'),
      renderCards('games', text(cfg.gamesTitle || 'Games'), text(cfg.gamesNote || ''), cfg.games, 'game-card'),
      text(cfg.about) ? el('section', { class: 'section', id: 'about', 'aria-labelledby': 'about-title' },
        el('div', { class: 'about-box' },
          el('h2', { id: 'about-title', text: text(cfg.aboutTitle || 'About') }),
          el('p', { class: 'about-text', text: text(cfg.about) })
        )
      ) : null
    );

    var footer = el('footer', { class: 'site-footer' });
    var note = text(cfg.footer && cfg.footer.note);
    if (note) footer.appendChild(el('p', { class: 'footer-note', text: note }));
    /* Template credit. Delete this block, or set footer.showTemplateCredit to false. */
    if (!cfg.footer || cfg.footer.showTemplateCredit !== false) {
      var credit = el('p', { class: 'credit', text: 'Template by ' });
      var by = el('a', { href: 'https://twitter.com/TherapyToaster', text: '@TherapyToaster' });
      newTab(by);
      credit.appendChild(by);
      credit.appendChild(document.createTextNode(' — '));
      var siteLink = el('a', { href: 'https://www.therapytoaster.com', text: 'therapytoaster.com' });
      newTab(siteLink);
      credit.appendChild(siteLink);
      footer.appendChild(credit);
    }

    app.replaceChildren(bar, header, el('div', { class: 'rule', 'aria-hidden': 'true' }), main, footer);
    startPolling(cfg);
  }

  function load() {
    var app = document.getElementById('app');
    app.replaceChildren(el('p', { class: 'loading', role: 'status', text: 'Loading your site…' }));
    if (!Guard) {
      renderError('This page is missing js/guard.js.');
      return;
    }
    fetch(new URL('site.config.json', document.baseURI), { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('site.config.json returned ' + res.status + '.');
        return res.json();
      })
      .then(render)
      .catch(function (err) {
        renderError(err && err.message ? err.message : 'Could not read site.config.json.');
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
