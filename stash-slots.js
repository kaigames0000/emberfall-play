export function validStashSlot(slot, capacity) {
  return Number.isInteger(slot) && slot >= 0 && slot < capacity;
}

function stashIds(profile) {
  return [...(profile.stash ?? []), ...(profile.flaskStash ?? [])].map(item => item.id);
}

export function validStashSlots(profile, capacity) {
  const saved = profile?.stashSlots;
  if (saved === undefined) return true;
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return false;
  const ids = new Set(stashIds(profile)), occupied = new Set();
  return Object.entries(saved).every(([key, id]) => {
    const slot = Number(key);
    if (String(slot) !== key || !validStashSlot(slot, capacity) || !ids.has(id) || occupied.has(id)) return false;
    occupied.add(id);
    return true;
  });
}

export function stashSlots(profile, capacity) {
  const slots = Array(capacity).fill(null);
  const unplaced = new Set(stashIds(profile));
  for (const [key, id] of Object.entries(profile.stashSlots ?? {})) {
    const slot = Number(key);
    if (validStashSlot(slot, capacity) && unplaced.delete(id)) slots[slot] = id;
  }
  let next = 0;
  for (const id of unplaced) {
    next = slots.indexOf(null, next);
    if (next === -1) break;
    slots[next] = id;
  }
  return slots;
}

export function saveStashSlots(profile, slots) {
  const occupied = Object.fromEntries(slots.flatMap((id, index) => id === null ? [] : [[index, id]]));
  if (Object.keys(occupied).length) profile.stashSlots = occupied;
  else delete profile.stashSlots;
}
