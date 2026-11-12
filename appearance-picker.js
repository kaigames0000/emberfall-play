import { HERO_APPEARANCES } from './character-appearance.js?v=108';
import { bplusAsset } from './bplus-art.js?v=124';

export function appearancePickerMarkup() {
  const options = Object.entries(HERO_APPEARANCES).map(([id, label], index) =>
    `<label class="appearance-option">
      <input type="radio" name="gender" value="${id}" aria-label="${label}" ${index === 0 ? 'checked' : ''} required>
      <img src="${bplusAsset('heroes/base/' + id + '-front.webp')}" alt="" draggable="false">
    </label>`
  ).join('');
  return `<fieldset class="appearance-picker"><legend>外觀</legend><div class="appearance-options">${options}</div></fieldset>`;
}
