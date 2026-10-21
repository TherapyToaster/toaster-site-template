#!/usr/bin/env node
'use strict';

/*
 * Twitter Spaces live checker.
 *
 * Calls GET https://api.x.com/2/spaces/by/creator_ids and writes status.json.
 * Exits 0 even when the API fails, and does not touch status.json in that case.
 * Does nothing unless both are set:
 *   - environment variable X_BEARER_TOKEN
 *   - spaces.userId in site.config.json (digits only)
 *
 * Requires Node 18+ (GitHub-hosted runners include it).
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.x.com/2/spaces/by/creator_ids';
const ROOT = path.resolve(__dirname, '..');
const FRESH_WRITE_MS = 4 * 60 * 1000;

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function userIdFromConfig(config) {
  if (!config || typeof config !== 'object') return '';
  const spaces = config.spaces && typeof config.spaces === 'object' ? config.spaces : null;
  if (!spaces || spaces.userId == null) return '';
  return String(spaces.userId).trim();
}

function cleanId(id) {
  const value = String(id || '');
  return /^[A-Za-z0-9]{1,32}$/.test(value) ? value : '';
}

function cleanTitle(title) {
  return String(title || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function pickLive(data) {
  const list = Array.isArray(data) ? data : [];
  for (let i = 0; i < list.length; i++) {
    const space = list[i];
    if (space && String(space.state || '').toLowerCase() === 'live') return space;
  }
  return null;
}

function statusFromSpace(space, now) {
  const id = space ? cleanId(space.id) : '';
  return {
    live: !!space,
    id: id,
    title: space ? cleanTitle(space.title) : '',
    url: id ? 'https://twitter.com/i/spaces/' + id : '',
    updated: now
  };
}

function isUnchanged(previous, next, nowIso) {
  if (!previous || typeof previous !== 'object') return false;
  const same = !!previous.live === !!next.live
    && String(previous.id || '') === next.id
    && String(previous.title || '') === next.title
    && String(previous.url || '') === next.url;
  if (!same) return false;
  if (!next.live) return true;
  const then = Date.parse(previous.updated || '');
  const now = Date.parse(nowIso);
  if (!(then > 0) || !(now > 0)) return false;
  return now - then < FRESH_WRITE_MS;
}

async function runCheck(options) {
  const opts = options || {};
  const token = String(opts.token || '').trim();
  const userId = String(opts.userId || '').trim();
  if (!token || !userId) return { action: 'skip', reason: 'missing-config' };
  if (!/^[0-9]{1,19}$/.test(userId)) return { action: 'skip', reason: 'bad-user-id' };
  if (typeof opts.fetchImpl !== 'function') return { action: 'error', reason: 'no-fetch' };

  const now = opts.now || new Date().toISOString();
  const url = new URL(API_URL);
  url.searchParams.set('user_ids', userId);
  url.searchParams.set('space.fields', 'creator_id,host_ids,started_at,state,title');

  let body;
  try {
    const res = await opts.fetchImpl(url, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json'
      },
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout
        ? AbortSignal.timeout(15000)
        : undefined
    });
    if (!res || !res.ok) {
      return { action: 'error', reason: 'http', statusCode: res && res.status };
    }
    body = await res.json();
  } catch (err) {
    return {
      action: 'error',
      reason: 'network',
      message: err && err.message ? err.message : String(err)
    };
  }

  if (!body || typeof body !== 'object' || (body.errors && !Array.isArray(body.data))) {
    return { action: 'error', reason: 'bad-payload' };
  }

  const next = statusFromSpace(pickLive(body.data), now);
  if (isUnchanged(opts.previous, next, now)) return { action: 'unchanged', status: next };
  return { action: 'write', status: next };
}

function readStatus(file) {
  try {
    return readJson(file);
  } catch (err) {
    return null;
  }
}

function writeStatus(file, status) {
  const text = JSON.stringify({
    live: status.live === true,
    id: status.id || '',
    title: status.title || '',
    url: status.url || '',
    updated: status.updated || ''
  }, null, 2) + '\n';
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

async function main(overrides) {
  const opts = overrides || {};
  const log = opts.log || function (message) { console.log(message); };
  try {
    const configPath = opts.configPath || process.env.SITE_CONFIG || path.join(ROOT, 'site.config.json');
    const statusPath = opts.statusPath || process.env.STATUS_PATH || path.join(ROOT, 'status.json');
    const token = opts.token != null ? opts.token : process.env.X_BEARER_TOKEN;
    let config;
    try {
      config = opts.config || readJson(configPath);
    } catch (err) {
      log('Spaces check skipped: could not read site.config.json (' + err.message + ').');
      return 0;
    }
    const previous = opts.previous !== undefined ? opts.previous : readStatus(statusPath);
    const result = await runCheck({
      token: token,
      userId: userIdFromConfig(config),
      fetchImpl: opts.fetchImpl || globalThis.fetch,
      now: opts.now,
      previous: previous
    });

    if (result.action === 'skip') {
      log(result.reason === 'bad-user-id'
        ? 'Spaces check skipped: spaces.userId must be digits only (the numeric Twitter user id). Nothing was changed.'
        : 'Spaces check skipped: set the X_BEARER_TOKEN repository secret and spaces.userId in site.config.json. Nothing was changed.');
      return 0;
    }
    if (result.action === 'error') {
      const detail = result.statusCode ? result.reason + ' ' + result.statusCode : result.reason;
      log('Spaces check hit an API error (' + detail + '). Leaving status.json unchanged.');
      return 0;
    }
    if (result.action === 'unchanged') {
      log('Spaces status unchanged.');
      return 0;
    }
    if (result.action === 'write') {
      if (opts.writeStatus) opts.writeStatus(result.status);
      else writeStatus(statusPath, result.status);
      log('Wrote status.json live=' + result.status.live + ' id=' + (result.status.id || ''));
      return 0;
    }
    log('Spaces check finished without changes.');
    return 0;
  } catch (err) {
    log('Spaces check failed safely: ' + (err && err.message ? err.message : err));
    return 0;
  }
}

module.exports = {
  API_URL: API_URL,
  userIdFromConfig: userIdFromConfig,
  statusFromSpace: statusFromSpace,
  isUnchanged: isUnchanged,
  runCheck: runCheck,
  main: main
};

if (require.main === module) {
  main().then(function (code) {
    process.exit(code || 0);
  }, function (err) {
    console.log('Spaces check failed safely: ' + (err && err.message ? err.message : err));
    process.exit(0);
  });
}
