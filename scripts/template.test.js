'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const guard = require('../js/guard');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('example config is placeholders and enables the template credit', () => {
  const cfg = JSON.parse(read('site.config.json'));
  assert.equal(cfg.name, 'YOUR NAME HERE');
  assert.equal(cfg.footer.showTemplateCredit, true);
  assert.equal(cfg.spaces.userId, '');
  assert.equal(cfg.spaces.statusUrl, 'status.json');
  assert.equal(cfg.twitter.latestPostId, '');
  assert.ok(cfg.socials.some(function (item) { return item.network === 'twitter' && item.label === 'Twitter'; }));
  assert.ok(cfg.socials.some(function (item) { return item.network === 'tiktok'; }));
  assert.ok(cfg.socials.some(function (item) { return item.network === 'instagram'; }));
  assert.ok(cfg.socials.some(function (item) { return item.network === 'kick'; }));
  assert.ok(cfg.socials.some(function (item) { return item.network === 'youtube'; }));
  assert.ok(cfg.links.some(function (item) { return /book/i.test(item.kicker); }));
  assert.ok(cfg.games.length >= 1);
  const blob = JSON.stringify(cfg);
  assert.equal(/therapytoaster|coty|yellowblankey|pump\.fun|squarespace/i.test(blob), false);
});

test('status.json starts offline with no personal ids', () => {
  const status = JSON.parse(read('status.json'));
  assert.equal(status.live, false);
  assert.equal(status.id, '');
  assert.equal(status.url, '');
});

test('the page credits the template and says Twitter in the UI strings', () => {
  const site = read('js/site.js');
  const html = read('index.html');
  assert.match(site, /Template by /);
  assert.match(site, /@TherapyToaster/);
  assert.match(site, /therapytoaster\.com/);
  assert.match(site, /showTemplateCredit/);
  assert.match(site, /Live now on Twitter Spaces/);
  assert.match(site, /Latest from Twitter/);
  assert.equal(site.includes('innerHTML'), false);
  assert.match(html, /js\/guard\.js/);
  assert.match(html, /js\/site\.js/);
  assert.doesNotMatch(html, /onclick=/);
});

test('workflows wire Pages deploy and the Spaces checker', () => {
  const pages = read('.github/workflows/pages.yml');
  const spaces = read('.github/workflows/spaces-live.yml');
  assert.match(pages, /actions\/deploy-pages@v4/);
  assert.match(pages, /actions\/upload-pages-artifact@v3/);
  assert.match(pages, /github-pages/);
  assert.match(spaces, /X_BEARER_TOKEN/);
  assert.match(spaces, /cron:\s*'\*\/5 \* \* \* \*'/);
  assert.match(spaces, /check-spaces\.js/);
  assert.match(spaces, /actions\/deploy-pages@v4/);
  assert.match(spaces, /contents:\s*write/);
  assert.doesNotMatch(pages + spaces, /Bearer [A-Za-z0-9]{20,}/);
});

test('safeUrl rejects scripts and protocol-relative links', () => {
  const base = 'https://user.github.io/repo/index.html';
  assert.equal(guard.safeUrl('javascript:alert(1)', base), '');
  assert.equal(guard.safeUrl('data:text/html,hi', base), '');
  assert.equal(guard.safeUrl('//evil.example/phish', base), '');
  assert.equal(guard.safeUrl('https://example.com/book', base), 'https://example.com/book');
  assert.equal(guard.safeUrl('assets/avatar.svg', base), 'https://user.github.io/repo/assets/avatar.svg');
  assert.equal(guard.safeUrl('#games', base), 'https://user.github.io/repo/index.html#games');
  assert.equal(guard.safeUrl('  ', base), '');
});

test('banner freshness and preview query behavior', () => {
  const now = Date.parse('2026-10-21T12:00:00.000Z');
  const fresh = { live: true, updated: '2026-10-21T11:50:00.000Z', id: 'abc', title: 'Hi' };
  const stale = { live: true, updated: '2026-10-21T11:00:00.000Z', id: 'abc', title: 'Hi' };
  assert.deepEqual(guard.bannerDecision(fresh, { now: now }), { show: true, preview: false });
  assert.deepEqual(guard.bannerDecision(stale, { now: now }), { show: false, preview: false });
  assert.deepEqual(guard.bannerDecision({ live: false, updated: fresh.updated }, { now: now }), { show: false, preview: false });
  assert.deepEqual(guard.bannerDecision(stale, { now: now, preview: 'on' }), { show: true, preview: true });
  assert.deepEqual(guard.bannerDecision(fresh, { now: now, preview: 'on' }), { show: true, preview: false });
  assert.deepEqual(guard.bannerDecision(fresh, { now: now, preview: 'off' }), { show: false, preview: false });
  assert.equal(guard.LIVE_MAX_AGE_MS, 15 * 60 * 1000);
});

test('space links from status.json stay on Twitter', () => {
  const base = 'https://user.github.io/repo/';
  assert.equal(
    guard.spaceHref({ url: 'https://twitter.com/i/spaces/abc', id: 'abc' }, '', base),
    'https://twitter.com/i/spaces/abc'
  );
  assert.equal(
    guard.spaceHref({ url: 'https://evil.example/steal', id: 'abc' }, 'https://twitter.com/yourname', base),
    'https://twitter.com/i/spaces/abc'
  );
  assert.equal(
    guard.spaceHref({ url: 'javascript:alert(1)', id: '!!!' }, 'https://example.com/fallback', base),
    'https://example.com/fallback'
  );
  assert.equal(guard.spaceHref(null, '', base), 'https://twitter.com/i/spaces');
});

test('shipped text files do not contain secrets or Squarespace ids', () => {
  const skip = new Set(['.git', 'node_modules', 'assets', 'docs']);
  const files = [];
  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
      if (skip.has(entry.name) || entry.name.endsWith('.test.js')) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|css|js|json|yml|md|sh|txt)$/.test(entry.name)) files.push(full);
    });
  }
  walk(root);
  const secret = /ghp_[A-Za-z0-9]{20,}|xox[baprs]-|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|sqs-/i;
  files.forEach(function (file) {
    const text = fs.readFileSync(file, 'utf8');
    assert.equal(secret.test(text), false, file);
  });
});
