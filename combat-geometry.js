export function circleIntersects(origin, range, target, radius = target.r ?? 0) {
  return Math.hypot(target.x - origin.x, target.y - origin.y) <= range + radius;
}

export function projectileBodyRadius(radius, blastRadius = 0, hostile = false) {
  if (hostile) return radius;
  const base = radius + Math.min(3, radius * .25);
  return blastRadius > 0 ? Math.max(base, Math.min(22, 9 + blastRadius * .085)) : base;
}

export function segmentCircleEntry(from, to, target, radius) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const x = from.x - target.x, y = from.y - target.y;
  const distanceSquared = x * x + y * y - radius * radius;
  if (distanceSquared <= 0) return 0;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return null;
  const projection = x * dx + y * dy;
  const discriminant = projection * projection - lengthSquared * distanceSquared;
  if (discriminant < 0) return null;
  const entry = (-projection - Math.sqrt(discriminant)) / lengthSquared;
  return entry >= 0 && entry <= 1 ? entry : null;
}

export function circleInSector(origin, angle, range, halfArc, target, radius = target.r ?? 0) {
  const x = target.x - origin.x, y = target.y - origin.y;
  const distance = Math.hypot(x, y);
  if (distance <= radius) return true;
  if (distance > range + radius) return false;
  const delta = Math.abs(Math.atan2(Math.sin(Math.atan2(y, x) - angle), Math.cos(Math.atan2(y, x) - angle)));
  if (delta <= halfArc) return true;
  const edgeAngle = delta - halfArc;
  const along = Math.max(0, Math.min(range, distance * Math.cos(edgeAngle)));
  return distance * distance + along * along - 2 * along * distance * Math.cos(edgeAngle) <= radius * radius;
}

export function beamBoundingRadius(length, width) {
  return Math.hypot(length, width / 2);
}

export function circleInBeam(origin, angle, length, width, target, radius = target.r ?? 0) {
  const x = target.x - origin.x, y = target.y - origin.y;
  const forward = x * Math.cos(angle) + y * Math.sin(angle);
  const side = -x * Math.sin(angle) + y * Math.cos(angle);
  const endDistance = forward - Math.max(0, Math.min(length, forward));
  const sideDistance = Math.max(0, Math.abs(side) - width / 2);
  return endDistance * endDistance + sideDistance * sideDistance <= radius * radius;
}
