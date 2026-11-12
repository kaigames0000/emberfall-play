export const PICKUP_COLORS = Object.freeze([0, 1, 2, 3, 4, 5]);

export function pickupAllowed(hero, item) {
  return (hero.pickupRarities ?? PICKUP_COLORS).includes(item.rarity);
}
