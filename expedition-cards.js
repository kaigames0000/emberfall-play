import {pixelMapArt} from './pixel-map-art.js?v=108';
import {escapeHtml} from './ui-controls.js?v=152';

export function expeditionCardPicture(theme, name, label, badge = '') {
  const art = pixelMapArt(theme, escapeHtml(name) + '場景示意');
  return `<div class="chapter-card-picture">${art}<span class="chapter-card-number">${escapeHtml(label)}</span>${badge}</div>`;
}

export function expeditionCardTitle(name, detail, heading = false) {
  const tag = heading ? 'h3' : 'b';
  return `<div class="chapter-card-title"><${tag}>${escapeHtml(name)}</${tag}><small>${escapeHtml(detail)}</small></div>`;
}
