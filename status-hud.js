import {actorStatusIconMarkup} from './status-effects.js?v=130';

const rows = { effects: '增益、減益與光環', summons: '召喚物' };
const lifeBorder = '<svg class="status-life" viewBox="0 0 32 35" preserveAspectRatio="none" aria-hidden="true"><rect x=".6" y=".6" width="30.8" height="33.8" pathLength="100"/></svg>';

function remainingText(status) {
  if (status.value) return status.value;
  if (!Number.isFinite(status.remaining)) return '';
  const seconds = Math.max(0, Math.ceil(status.remaining));
  return seconds >= 60 ? Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') : seconds + '秒';
}

export function updateStatusHUD(container, statuses) {
  if (!container.dataset.statusReady) {
    container.dataset.statusReady = 'true';
    const placeTooltip = event => {
      const badge = event.target.closest('[data-status-id]');
      if (!badge || !container.contains(badge)) return;
      const tooltip = badge.querySelector('.status-tooltip');
      const bounds = badge.getBoundingClientRect(), width = tooltip.getBoundingClientRect().width;
      tooltip.style.left = Math.max(12, Math.min(bounds.left, innerWidth - 12 - width)) + 'px';
      tooltip.style.top = (bounds.bottom + 5) + 'px';
    };
    container.addEventListener('pointerover', placeTooltip);
    container.addEventListener('focusin', placeTooltip);
    for (const [row, label] of Object.entries(rows)) {
      const section = document.createElement('div');
      section.className = 'player-status-list status-' + row;
      section.dataset.statusGroup = row;
      section.setAttribute('role', 'group');
      section.setAttribute('aria-label', label);
      container.append(section);
    }
  }

  // Preserve badges while timers tick so hover and keyboard focus stay stable.
  const current = new Map([...container.querySelectorAll('[data-status-id]')].map(node => [node.dataset.statusId, node]));
  const grouped = new Map();
  for (const status of statuses) {
    const existing = grouped.get(status.id);
    if (existing) {
      existing.stacks = (existing.stacks || 1) + (status.stacks || 1);
      if ((status.remaining ?? 0) > (existing.remaining ?? 0)) Object.assign(existing, status, { stacks: existing.stacks });
    } else grouped.set(status.id, { ...status });
  }

  for (const row of Object.keys(rows)) {
    const list = container.querySelector('[data-status-group="' + row + '"]');
    const entries = [...grouped.values()].filter(status => (status.group === 'summons') === (row === 'summons'));
    if (row === 'effects') entries.sort((a, b) => Number(b.group === 'harmful') - Number(a.group === 'harmful'));
    list.hidden = entries.length === 0;
    for (const status of entries) {
      let badge = current.get(status.id);
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'player-status-badge';
        badge.dataset.statusId = status.id;
        badge.tabIndex = 0;
        badge.innerHTML = '<span class="status-icon"></span><span class="status-copy"><strong></strong><small></small></span><span class="status-time"></span><span class="status-stacks"></span><span class="status-progress"></span><span class="status-tooltip" role="tooltip"></span>';
        if (row === 'summons') badge.insertAdjacentHTML('beforeend', lifeBorder);
      }
      if (badge.parentElement !== list) {
        if (status.group === 'harmful') list.insertBefore(badge, list.querySelector('.player-status-badge:not(.harmful)'));
        else list.append(badge);
      }
      current.delete(status.id);
      const glyph = status.icon || 'rune';
      if (badge.dataset.icon !== glyph) {
        badge.querySelector('.status-icon').innerHTML = actorStatusIconMarkup({icon:glyph});
        badge.dataset.icon = glyph;
      }
      badge.querySelector('strong').textContent = status.name;
      const meta = badge.querySelector('.status-copy small');
      meta.textContent = status.meta || '';
      meta.hidden = !status.meta;
      const time = remainingText(status);
      badge.querySelector('.status-time').textContent = time;
      badge.classList.toggle('has-status-time', !!time);
      badge.classList.toggle('harmful', status.group === 'harmful');
      const stacks = badge.querySelector('.status-stacks');
      stacks.textContent = status.stacks > 1 ? '×' + status.stacks : '';
      stacks.hidden = !(status.stacks > 1);
      badge.style.setProperty('--status-color', status.color || (status.group === 'harmful' ? '#f09080' : '#aaca98'));
      const fraction = status.fraction ?? (status.max > 0 && status.remaining != null ? status.remaining / status.max : 1);
      badge.style.setProperty('--status-progress', Math.max(0, Math.min(1, fraction)));
      badge.classList.toggle('low-life', row === 'summons' && fraction < .3);
      badge.classList.toggle('wounded', row === 'summons' && fraction >= .3 && fraction < .65);
      badge.classList.toggle('expiring', status.remaining != null && status.remaining <= 3);
      badge.classList.toggle('timed', status.remaining != null);
      badge.classList.toggle('tracked', status.remaining != null || status.fraction != null);
      const description = status.name + (status.detail ? ' · ' + status.detail : '') + (status.stacks > 1 ? ' · 同類效果 ' + status.stacks + ' 個' : '');
      badge.querySelector('.status-tooltip').textContent = description;
      badge.setAttribute('aria-label', description + (time ? ' · ' + time : ''));
    }
  }
  for (const badge of current.values()) badge.remove();
  container.hidden = grouped.size === 0;
}

