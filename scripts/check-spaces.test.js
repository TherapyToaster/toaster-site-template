'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const checker = require('./check-spaces');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'check-spaces.js');

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status: status,
    json: async function () { return body; },
    text: async function () { return JSON.stringify(body); }
  };
}

test('skips when the token or user id is missing', async () => {
  const missingToken = await checker.runCheck({
    token: '   ',
    userId: '123',
    fetchImpl: async function () { throw new Error('should not be called'); }
  });
  assert.equal(missingToken.action, 'skip');

  const missingId = await checker.runCheck({
    token: 'token',
    userId: '',
    fetchImpl: async function () { throw new Error('should not be called'); }
  });
  assert.equal(missingId.action, 'skip');
});

test('skips a non-numeric user id without calling the API', async () => {
  let called = false;
  const result = await checker.runCheck({
    token: 'token',
    userId: 'yourname',
    fetchImpl: async function () { called = true; return jsonResponse(200, { data: [] }); }
  });
  assert.equal(result.action, 'skip');
  assert.equal(result.reason, 'bad-user-id');
  assert.equal(called, false);
});

test('reads only spaces.userId', () => {
  assert.equal(checker.userIdFromConfig({ spaces: { userId: ' 42 ' }, twitter: { userId: '99' } }), '42');
  assert.equal(checker.userIdFromConfig({ twitter: { userId: '99' } }), '');
  assert.equal(checker.userIdFromConfig({}), '');
});

test('calls GET /2/spaces/by/creator_ids and does not put the token in the URL', async () => {
  let seenUrl = '';
  let seenAuth = '';
  const result = await checker.runCheck({
    token: 'secret-token',
    userId: '2244994945',
    now: '2026-10-21T04:00:00.000Z',
    fetchImpl: async function (url, init) {
      seenUrl = String(url);
      seenAuth = init.headers.Authorization;
      return jsonResponse(200, {
        data: [{ id: '1zqKVXPQhvZJB', state: 'live', title: 'Hello Space' }]
      });
    }
  });
  assert.equal(seenAuth, 'Bearer secret-token');
  assert.equal(seenUrl.includes('secret-token'), false);
  assert.match(seenUrl, /^https:\/\/api\.x\.com\/2\/spaces\/by\/creator_ids\?/);
  assert.match(seenUrl, /user_ids=2244994945/);
  assert.match(seenUrl, /space\.fields=/);
  assert.equal(result.action, 'write');
  assert.deepEqual(result.status, {
    live: true,
    id: '1zqKVXPQhvZJB',
    title: 'Hello Space',
    url: 'https://twitter.com/i/spaces/1zqKVXPQhvZJB',
    updated: '2026-10-21T04:00:00.000Z'
  });
});

test('ignores scheduled spaces and writes live false', async () => {
  const result = await checker.runCheck({
    token: 'token',
    userId: '123',
    now: '2026-10-21T04:00:00.000Z',
    fetchImpl: async function () {
      return jsonResponse(200, { data: [{ id: 'abc', state: 'scheduled', title: 'Later' }] });
    }
  });
  assert.equal(result.action, 'write');
  assert.equal(result.status.live, false);
  assert.equal(result.status.id, '');
});

test('an empty result is offline, not an error', async () => {
  const result = await checker.runCheck({
    token: 'token',
    userId: '123',
    now: '2026-10-21T04:00:00.000Z',
    fetchImpl: async function () { return jsonResponse(200, { meta: { result_count: 0 } }); }
  });
  assert.equal(result.action, 'write');
  assert.equal(result.status.live, false);
});

test('HTTP errors, network errors, and bad payloads do not ask for a write', async () => {
  const http = await checker.runCheck({
    token: 'token',
    userId: '123',
    fetchImpl: async function () { return jsonResponse(401, { title: 'Unauthorized' }); }
  });
  assert.equal(http.action, 'error');
  assert.equal(http.statusCode, 401);

  const down = await checker.runCheck({
    token: 'token',
    userId: '123',
    fetchImpl: async function () { throw new Error('network down'); }
  });
  assert.equal(down.action, 'error');
  assert.equal(down.reason, 'network');

  const bad = await checker.runCheck({
    token: 'token',
    userId: '123',
    fetchImpl: async function () {
      return jsonResponse(200, { errors: [{ message: 'nope' }] });
    }
  });
  assert.equal(bad.action, 'error');
  assert.equal(bad.reason, 'bad-payload');
});

test('does not rewrite an unchanged offline file, and refreshes a live timestamp', async () => {
  const offline = await checker.runCheck({
    token: 'token',
    userId: '123',
    now: '2026-10-21T05:00:00.000Z',
    previous: { live: false, id: '', title: '', url: '', updated: '2026-10-21T04:00:00.000Z' },
    fetchImpl: async function () { return jsonResponse(200, { data: [] }); }
  });
  assert.equal(offline.action, 'unchanged');

  const recent = await checker.runCheck({
    token: 'token',
    userId: '123',
    now: '2026-10-21T05:02:00.000Z',
    previous: {
      live: true,
      id: 'abc',
      title: 'Hello',
      url: 'https://twitter.com/i/spaces/abc',
      updated: '2026-10-21T05:00:00.000Z'
    },
    fetchImpl: async function () {
      return jsonResponse(200, { data: [{ id: 'abc', state: 'live', title: 'Hello' }] });
    }
  });
  assert.equal(recent.action, 'unchanged');

  const stale = await checker.runCheck({
    token: 'token',
    userId: '123',
    now: '2026-10-21T05:10:00.000Z',
    previous: {
      live: true,
      id: 'abc',
      title: 'Hello',
      url: 'https://twitter.com/i/spaces/abc',
      updated: '2026-10-21T05:00:00.000Z'
    },
    fetchImpl: async function () {
      return jsonResponse(200, { data: [{ id: 'abc', state: 'live', title: 'Hello' }] });
    }
  });
  assert.equal(stale.action, 'write');
  assert.equal(stale.status.updated, '2026-10-21T05:10:00.000Z');
});

test('main leaves status.json alone when the API fails', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spaces-'));
  const statusPath = path.join(dir, 'status.json');
  const original = '{\n  "live": true,\n  "id": "keep"\n}\n';
  fs.writeFileSync(statusPath, original);
  const logs = [];
  const code = await checker.main({
    token: 'token',
    config: { spaces: { userId: '123' } },
    statusPath: statusPath,
    fetchImpl: async function () { return jsonResponse(500, { error: true }); },
    log: function (message) { logs.push(message); }
  });
  assert.equal(code, 0);
  assert.equal(fs.readFileSync(statusPath, 'utf8'), original);
  assert.match(logs.join('\n'), /API error/);
  assert.match(logs.join('\n'), /unchanged/);
});

test('main writes status.json for a live Space', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spaces-'));
  const statusPath = path.join(dir, 'status.json');
  const code = await checker.main({
    token: 'token',
    config: { spaces: { userId: '123' } },
    statusPath: statusPath,
    now: '2026-10-21T04:00:00.000Z',
    fetchImpl: async function () {
      return jsonResponse(200, { data: [{ id: 'abc123', state: 'live', title: 'On air' }] });
    }
  });
  assert.equal(code, 0);
  const written = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.equal(written.live, true);
  assert.equal(written.url, 'https://twitter.com/i/spaces/abc123');
  assert.equal(written.title, 'On air');
});

test('the CLI exits 0 and does not change status.json without a secret', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spaces-cli-'));
  const configPath = path.join(dir, 'site.config.json');
  const statusPath = path.join(dir, 'status.json');
  fs.writeFileSync(configPath, '{"spaces":{"userId":""}}\n');
  fs.writeFileSync(statusPath, '{"live":false,"id":"","title":"","url":"","updated":""}\n');
  const before = fs.readFileSync(statusPath);
  const result = spawnSync(process.execPath, [scriptPath], {
    env: Object.assign({}, process.env, {
      X_BEARER_TOKEN: '',
      SITE_CONFIG: configPath,
      STATUS_PATH: statusPath
    }),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(fs.readFileSync(statusPath), before);
  assert.match(result.stdout, /skipped/i);
});

test('the CLI exits 0 when site.config.json is invalid', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spaces-cli-'));
  const configPath = path.join(dir, 'site.config.json');
  const statusPath = path.join(dir, 'status.json');
  fs.writeFileSync(configPath, '{');
  fs.writeFileSync(statusPath, '{"live":false}\n');
  const result = spawnSync(process.execPath, [scriptPath], {
    env: Object.assign({}, process.env, {
      X_BEARER_TOKEN: 'token',
      SITE_CONFIG: configPath,
      STATUS_PATH: statusPath
    }),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /skipped/i);
  assert.equal(fs.readFileSync(statusPath, 'utf8'), '{"live":false}\n');
});
