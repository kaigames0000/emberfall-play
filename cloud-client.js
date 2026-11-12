import {CLOUD_CONFIG} from './cloud-config.js?v=108';

const LOGIN_MAX_AGE = 15 * 60_000;
const TOKEN_BUFFER = 45_000;

function publicURL(input, originOnly = false) {
  try {
    const url = new URL(input);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
        url.username || url.password || url.search || url.hash ||
        (originOnly && url.pathname !== '/')) return '';
    return url.href.replace(/\/+$/, '');
  } catch { return ''; }
}

function publicKey(value) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return value;
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(value)) return '';
  try {
    const payload = value.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    return JSON.parse(atob(payload)).role === 'anon' ? value : '';
  } catch { return ''; }
}

export function cloudEndpoints(config = CLOUD_CONFIG) {
  const supabase = publicURL(config.supabaseUrl, true);
  const key = publicKey(config.publishableKey);
  return supabase && key
    ? {supabase, key, verified: publicURL(config.verifiedUrl)}
    : null;
}

export class CloudRequestError extends Error {
  constructor(status, result) {
    super(result?.error || 'cloud_request_failed');
    this.status = status;
    this.result = result;
  }
}

const base64url = bytes => btoa(String.fromCharCode(...bytes))
  .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

export function createCloudClient({
  config = CLOUD_CONFIG, fetcher = globalThis.fetch.bind(globalThis),
  clock = Date.now, cryptography = globalThis.crypto, location = globalThis.location,
  history = globalThis.history, storage, onChange = () => {}
} = {}) {
  const endpoint = cloudEndpoints(config);
  if (storage === undefined) {
    try { storage = globalThis.sessionStorage; } catch { storage = null; }
  }
  const prefix = 'emberfall-cloud-' + (endpoint?.supabase ?? '') + '-';
  const read = key => {
    try { return JSON.parse(storage?.getItem(prefix + key) ?? 'null'); }
    catch { return null; }
  };
  const keep = (key, value) => {
    try {
      if (!storage) return false;
      if (value === null) storage.removeItem(prefix + key);
      else storage.setItem(prefix + key, JSON.stringify(value));
      return true;
    } catch { return false; }
  };
  const valid = session => typeof session?.account === 'string' && !!session.account &&
    typeof session.access === 'string' && !!session.access &&
    typeof session.refresh === 'string' && !!session.refresh && Number.isFinite(session.expiresAt);
  let session = endpoint ? read('session') : null;
  if (!valid(session)) session = null;
  let generation = 0, refreshTask = null;

  function setSession(value) {
    session = value;
    keep('session', value);
    onChange(session?.account ?? null);
  }

  async function json(url, {method = 'GET', token, body, apiKey = true} = {}) {
    const headers = {};
    if (apiKey) headers.apikey = endpoint.key;
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetcher(url, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store', credentials: 'omit', redirect: 'error',
      referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15_000)
    });
    const result = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new CloudRequestError(response.status, result);
    if (response.status !== 204 && !result) throw new CloudRequestError(502, null);
    return result;
  }

  async function requestToken(grant, body, epoch) {
    const response = await json(endpoint.supabase + '/auth/v1/token?grant_type=' + grant, {method:'POST', body});
    const value = {
      account: response.user?.id,
      access: response.access_token,
      refresh: response.refresh_token,
      expiresAt: Number.isFinite(response.expires_at)
        ? response.expires_at * 1000 : clock() + Number(response.expires_in) * 1000
    };
    if (generation !== epoch) throw new CloudRequestError(401, null);
    if (!valid(value) || value.expiresAt <= clock() ||
        (grant === 'refresh_token' && value.account !== session?.account)) {
      throw new CloudRequestError(401, null);
    }
    setSession(value);
    return value.access;
  }

  async function accessToken() {
    if (!session) throw new CloudRequestError(401, null);
    if (session.expiresAt - clock() > TOKEN_BUFFER) return session.access;
    if (refreshTask) return refreshTask;
    const epoch = generation, token = session.refresh;
    const task = requestToken('refresh_token', {refresh_token:token}, epoch).catch(error => {
      if (generation === epoch && [400, 401, 403].includes(error.status)) {
        generation++;
        setSession(null);
      }
      throw error;
    });
    refreshTask = task;
    try { return await task; }
    finally { if (refreshTask === task) refreshTask = null; }
  }

  async function authed(url, options) {
    const epoch = generation, token = await accessToken();
    if (generation !== epoch) throw new CloudRequestError(401, null);
    try {
      const result = await json(url, {...options, token});
      if (generation !== epoch) throw new CloudRequestError(401, null);
      return result;
    } catch (error) {
      if (error.status === 401 && generation === epoch && session?.access === token) {
        generation++;
        setSession(null);
      }
      throw error;
    }
  }

  const sync = (path = '', options) => {
    if (!endpoint) throw new CloudRequestError(503, null);
    return authed(endpoint.supabase + '/functions/v1/emberfall-sync' + path, options);
  };

  return {
    enabled: !!endpoint && /^https?:$/.test(location?.protocol ?? ''),
    verifiedEnabled: !!endpoint?.verified && /^https?:$/.test(location?.protocol ?? ''),
    get account() { return session?.account ?? null; },
    async signIn(realm) {
      if (!this.enabled || !cryptography?.subtle) throw new CloudRequestError(503, null);
      const verifier = base64url(cryptography.getRandomValues(new Uint8Array(48)));
      const hash = await cryptography.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      if (!keep('pkce', {verifier, startedAt:clock()})) throw new CloudRequestError(503, null);
      const callback = new URL(realm==='home'?'./index.html':'./play.html', location.href);
      if (realm === 'verified') callback.searchParams.set('realm', 'verified');
      const url = new URL(endpoint.supabase + '/auth/v1/authorize');
      url.search = new URLSearchParams({
        provider:'google', redirect_to:callback.href, code_challenge:base64url(new Uint8Array(hash)),
        code_challenge_method:'s256'
      });
      location.assign(url.href);
    },
    async completeLogin() {
      if (!this.enabled) return false;
      const url = new URL(location.href);
      const code = url.searchParams.get('code'), failed = url.searchParams.has('error');
      if (!code && !failed) return false;
      const pending = read('pkce');
      keep('pkce', null);
      for (const key of ['code','error','error_code','error_description']) url.searchParams.delete(key);
      history.replaceState(history.state, '', url.href);
      if (failed || !code || typeof pending?.verifier !== 'string' || !Number.isFinite(pending.startedAt) ||
          clock() - pending.startedAt > LOGIN_MAX_AGE || clock() < pending.startedAt) {
        throw new CloudRequestError(401, null);
      }
      const epoch = ++generation;
      await requestToken('pkce', {auth_code:code, code_verifier:pending.verifier}, epoch);
      return true;
    },
    async signOut() {
      const token = session?.access;
      generation++;
      refreshTask = null;
      setSession(null);
      keep('pkce', null);
      if (token && endpoint) {
        await json(endpoint.supabase + '/auth/v1/logout?scope=local', {method:'POST', token}).catch(() => {});
      }
    },
    readBackup(revision) { return sync(revision === undefined ? '' : '?revision=' + revision); },
    writeBackup(expectedRevision, profile) { return sync('', {method:'PUT', body:{expectedRevision, profile}}); },
    sendFeedback(report) { return sync('/feedback', {method:'POST', body:report}); },
    verified(action) {
      if (!this.verifiedEnabled) throw new CloudRequestError(503, null);
      return authed(endpoint.verified + '/gameplay', {method:'POST', body:action, apiKey:false});
    }
  };
}
