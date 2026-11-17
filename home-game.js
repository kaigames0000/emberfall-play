const historyKey = 'emberfallView';

export function connectGameView({ home, homeStyle, setLoading, reloadRoster, canEnter, inlineGame }) {
  let current = null;
  let pending = null;
  let leaving = false;
  let playPage = null;

  const gameUrl = () => {
    const url = new URL(location.href);
    url.searchParams.set('view', 'play');
    return url;
  };
  const homeUrl = () => {
    const url = new URL(location.href);
    url.searchParams.delete('view');
    return url;
  };
  const wantsGame = () => new URLSearchParams(location.search).get('view') === 'play';
  const historyData = view => ({ ...history.state, [historyKey]: view });
  const showHomeUrl = () => history.replaceState(historyData('home'), '', homeUrl());

  async function loadPlayPage(signal) {
    if (playPage) return playPage;
    const playUrl = new URL('./play.html', document.baseURI);
    const response = await fetch(playUrl, { signal });
    if (!response.ok) throw Error('Game page unavailable');
    const html = await response.text();
    signal.throwIfAborted();
    const page = new DOMParser().parseFromString(html, 'text/html');
    const game = page.querySelector('[data-game-view="direct"]');
    const revision = page.querySelector('meta[name="emberfall-release"]')?.content;
    if (!game || revision !== document.querySelector('meta[name="emberfall-release"]')?.content) {
      throw Error('Game page version mismatch');
    }
    const styles = [...page.querySelectorAll('link[rel="stylesheet"]')]
      .map(link => new URL(link.getAttribute('href'), playUrl).href);
    playPage = { game, styles };
    return playPage;
  }

  function loadStyle(href, operation) {
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === href))
      return Promise.resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'not all';
    operation.styles.push(link);
    return new Promise((resolve, reject) => {
      const signal = operation.abort.signal;
      signal.addEventListener('abort', () => reject(signal.reason), { once:true });
      link.addEventListener('load', resolve, { once:true, signal });
      link.addEventListener('error', () => reject(Error('Game styles unavailable')), { once:true, signal });
      document.head.append(link);
    });
  }

  function dispose(operation) {
    operation.abort.abort();
    operation.game?.destroy();
    operation.root?.remove();
    for (const link of operation.styles) link.remove();
    if (inlineGame) inlineGame.style.media = 'not all';
    homeStyle.disabled = false;
    home.hidden = false;
  }

  async function enter({ fromHistory = false } = {}) {
    if (pending || current || leaving || !canEnter()) return false;
    const operation = { abort:new AbortController(), styles:[], cancelled:false };
    pending = operation;
    const signal = operation.abort.signal;
    setLoading(true);
    try {
      const [page, { startGameView }] = inlineGame ? [inlineGame, inlineGame] : await Promise.all([
        loadPlayPage(signal),
        import('./play-entry.js?v=158'),
      ]);
      signal.throwIfAborted();
      await Promise.all(page.styles.map(href => loadStyle(href, operation)));
      signal.throwIfAborted();
      operation.root = document.importNode(page.game, true);
      operation.root.dataset.gameView = 'mounted';
      operation.root.style.display = 'contents';
      document.body.append(operation.root);
      // Switch styles before measuring the canvas or opening the orientation prompt.
      home.hidden = true;
      homeStyle.disabled = true;
      if (inlineGame) inlineGame.style.media = 'all';
      for (const link of operation.styles) link.media = 'all';
      operation.game = startGameView(operation.root, { onRequestHome:requestHome });
      if (!await operation.game.ready) throw Error('Game storage unavailable');
      signal.throwIfAborted();
      if (!inlineGame && !fromHistory) history.pushState(historyData('from-home'), '', gameUrl());
      current = operation;
      const canvas = operation.root.querySelector('#world');
      canvas.tabIndex = -1;
      if (!operation.root.querySelector('#orientation-guard').open) canvas.focus({ preventScroll:true });
      return true;
    } catch {
      dispose(operation);
      if (!inlineGame && wantsGame()) showHomeUrl();
      setLoading(false, operation.cancelled ? '' : '遊戲暫時無法載入。請再試一次，或使用直接入口。');
      return false;
    } finally {
      pending = null;
      if (current) setLoading(false);
    }
  }

  function cancel() {
    if (!pending) return;
    pending.cancelled = true;
    pending.abort.abort();
  }

  async function leave() {
    if (!current || leaving) return false;
    leaving = true;
    try {
      if (!await current.game.saveAndExit()) return false;
      dispose(current);
      current = null;
      await reloadRoster();
      return true;
    } finally {
      leaving = false;
    }
  }

  async function requestHome() {
    if (!await leave()) return;
    if (inlineGame) return;
    if (wantsGame() && history.state?.[historyKey] === 'from-home') history.back();
    else if (wantsGame()) showHomeUrl();
  }

  async function restoreLocation() {
    if (leaving || inlineGame) return;
    if (wantsGame()) {
      if (pending || current) return;
      if (!canEnter()) showHomeUrl();
      else await enter({ fromHistory:true });
      return;
    }
    if (pending) cancel();
    if (!current) return;
    const previous = current;
    if (await leave()) {
      if (wantsGame()) await restoreLocation();
    } else if (current === previous && !wantsGame()) {
      if (!history.state?.[historyKey]) history.replaceState(historyData('direct'), '', gameUrl());
      else history.forward();
    }
  }

  // A reload starts a new document, so the previous entry may no longer be part of this view.
  if (!inlineGame) {
    history.replaceState(historyData(wantsGame() ? 'direct' : 'home'), '');
    window.addEventListener('popstate', () => void restoreLocation());
  }
  return { enter, cancel, restoreLocation };
}
