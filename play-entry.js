import {mountGame} from './app.js?v=157';
import {mountInstallTools} from './pwa.js?v=154';
import {mountUpdateTools} from './updates.js?v=157';

export function startGameView(root, options) {
  const game = mountGame(root, options);
  try {
    const installDialog = mountInstallTools(root, game.signal);
    mountUpdateTools(root, installDialog, game.signal);
    return game;
  } catch (error) {
    game.destroy();
    throw error;
  }
}

const direct = document.querySelector('[data-game-view="direct"]');
if (direct) {
  const params = new URLSearchParams(location.search);
  if (params.get('direct') === '1' || params.get('realm') === 'verified') {
    startGameView(direct);
  } else {
    const destination = new URL('./', location.href);
    destination.search = location.search;
    destination.searchParams.set('view', 'play');
    location.replace(destination);
  }
}
