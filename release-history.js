export function validReleaseNote(note) {
  if (typeof note?.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(note.version) ||
      !Number.isSafeInteger(note.revision) || note.revision < 1 ||
      typeof note.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(note.date) ||
      !Array.isArray(note.changes) || !note.changes.length ||
      !note.changes.every(change => typeof change === 'string' && change.trim())) return false;
  const date = new Date(note.date);
  return Number.isFinite(+date) && date.toISOString().slice(0,10) === note.date;
}

export function upcomingReleaseNote(release, currentRevision) {
  const note = release?.note;
  return validReleaseNote(note) && note.revision > currentRevision &&
    note.revision === release.revision && note.version === release.version ? note : null;
}

export function renderReleaseHistory(container, history, incoming = null) {
  const doc = container.ownerDocument;
  const focused = container.contains(doc.activeElement) ? doc.activeElement.closest('[data-release-revision]')?.dataset.releaseRevision : null;
  const open = new Map([...container.querySelectorAll('details[data-release-revision]')]
    .map(entry => [Number(entry.dataset.releaseRevision), entry.open]));
  const entries = incoming ? [incoming, ...history.filter(note => note.revision < incoming.revision)] : history;
  const fragment = doc.createDocumentFragment();

  for (const [index, note] of entries.entries()) {
    const entry = doc.createElement('details');
    entry.dataset.releaseRevision = note.revision;
    entry.open = open.get(note.revision) ?? index === 0;
    const summary = doc.createElement('summary');
    const version = doc.createElement('b');
    version.textContent = 'v' + note.version;
    const date = doc.createElement('time');
    date.dateTime = note.date;
    date.textContent = note.date.replaceAll('-', '/');
    summary.append(version, date);
    if (note === incoming) {
      const label = doc.createElement('span');
      label.className = 'release-history-new';
      label.textContent = '新版';
      summary.append(label);
    }
    const list = doc.createElement('ul');
    for (const change of note.changes) {
      const item = doc.createElement('li');
      item.textContent = change;
      list.append(item);
    }
    entry.append(summary, list);
    fragment.append(entry);
  }
  container.replaceChildren(fragment);
  if(focused)container.querySelector(`[data-release-revision="${focused}"] summary`)?.focus({preventScroll:true});
}
