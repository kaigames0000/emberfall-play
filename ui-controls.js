const entities = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => entities[character]);
}

export function iconMarkup(name) {
  return `<svg aria-hidden="true"><use href="#i-${escapeHtml(name)}"/></svg>`;
}

export function closeButtonMarkup(attributes, label, extraClass = '') {
  const text = escapeHtml(label);
  return `<button type="button" class="modal-close${extraClass ? ' ' + extraClass : ''}" ${attributes} aria-label="${text}" title="${text}">${iconMarkup('close')}</button>`;
}

// Labels are plain text. Callers can supply markup for their own badges and icons.
export function choiceButtons(choices, selected, attribute) {
  return choices.map(([id, label, {
    before = '', after = '', title, ariaLabel, disabled = false, attributes = '',
  } = {}]) => {
    const active = id === selected;
    return `<button type="button" ${attribute}="${escapeHtml(id)}" class="ui-choice${active ? ' selected' : ''}" aria-pressed="${active}"${title ? ` title="${escapeHtml(title)}"` : ''}${ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : ''}${disabled ? ' disabled' : ''}${attributes ? ' ' + attributes : ''}>${before}${escapeHtml(label)}${after}</button>`;
  }).join('');
}

export function rarityCheckboxes(rarities, selected, attribute) {
  return rarities.map(({name, color}, index) =>
    `<label style="--rarity-color:${color}"><input type="checkbox" ${attribute}="${index}"${selected.includes(index) ? ' checked' : ''}><span>${escapeHtml(name.split('・')[0])}</span></label>`
  ).join('');
}
