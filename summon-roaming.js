const goldenAngle = 2.399963229728653;
const tau = 2 * Math.PI;
const roamRadius = 130;
const returnDistance = 146;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

// Waypoints use forward and sideways coordinates relative to a summon’s formation slot.
const waypoints = {
  patrol: [[0, -1], [.8, -.12], [.25, 1], [-.6, .15]],
  scout: [[-.72, -.5], [.72, -.92], [1, .32], [.12, 1], [-1, .36]],
  dart: [[-.6, -.92], [.9, -.45], [-.48, .14], [1, .8], [-.8, .48]],
};

const stone = {path: 'patrol', radius: 66, depth: 17, width: 30, period: 7.2, speed: 62, pause: .22};
const wolf = {path: 'scout', radius: 76, depth: 32, width: 43, period: 4.7, speed: 128, pause: .15};
const ice = {path: 'drift', radius: 63, depth: 23, width: 37, period: 5.9, speed: 88};
const storm = {path: 'dart', radius: 73, depth: 27, width: 43, period: 3.8, speed: 158, pause: .07};
const profiles = {
  earth_golem: stone,
  frost_golem: {...stone, radius: 71, depth: 13, width: 32, period: 8.4, speed: 56, pause: .14},
  titan: {...stone, radius: 81, width: 26, period: 9.8, speed: 50, pause: .31},
  knight: {...stone, depth: 22, period: 6.7, speed: 79},
  bear: {...stone, radius: 60, depth: 24, width: 39, period: 8.6, speed: 59, pause: .28},
  wolf,
  eagle: {path: 'orbit', radius: 0, depth: 116, width: 83, period: 4.6, speed: 183},
  mist_ice: ice,
  mist_thunder: storm,
  ice_god: {path: 'orbit', radius: 0, depth: 84, width: 64, period: 7.6, speed: 87},
  thunder_god: {...storm, radius: 72, depth: 32, width: 48, period: 5.6, speed: 126, pause: .12},
  ward_spirit: {path: 'orbit', radius: 58, depth: 21, width: 27, period: 5.4, speed: 67},
  ward_lantern: {path: 'drift', radius: 41, depth: 12, width: 18, period: 6.2, speed: 52},
  hex_idol: {path: 'orbit', radius: 79, depth: 22, width: 32, period: 6.4, speed: 74},
  mirror_clone: {...stone, radius: 69, depth: 27, width: 45, period: 5.8, speed: 110, pause: .14},
  shadow_clone: {...storm, radius: 68, depth: 21, width: 34, period: 4.5, speed: 128, pause: .23},
};
const moonWolf = {...wolf, radius: 71, depth: 29, width: 49, period: 4.2, speed: 137};
const legacy = {
  spirit: ice, frost_spirit: ice, fire_spirit: ice,
  storm_spirit: storm, storm_blade: storm, lightning_blade: storm, thorn_construct: wolf,
};

function pathOffset(profile, turn) {
  const angle = turn * tau;
  if (profile.path === 'orbit') return [Math.cos(angle), Math.sin(angle)];
  if (profile.path === 'drift') return [Math.sin(2 * angle), Math.sin(angle)];

  const points = waypoints[profile.path];
  const segment = turn * points.length;
  const index = Math.floor(segment);
  const from = points[index], to = points[(index + 1) % points.length];
  const moving = Math.min(1, (segment - index) / (1 - profile.pause));
  const mix = moving * moving * (3 - 2 * moving);
  return [from[0] + (to[0] - from[0]) * mix, from[1] + (to[1] - from[1]) * mix];
}

function clipGoal(game, bounds, dx, dy) {
  const player = game.player;
  const x = clamp(player.x + dx, bounds.left, bounds.right);
  const y = clamp(player.y + dy, bounds.top, bounds.bottom);
  if (!game.terrain) return {x, y};
  const goal = {x: player.x, y: player.y};
  game.moveActor(goal, x - player.x, y - player.y, false);
  return goal;
}

function roamingGoal(game, bounds, dx, dy) {
  const player = game.player;
  const goal = clipGoal(game, bounds, dx, dy);
  if (distance(player, goal) >= Math.min(28, Math.hypot(dx, dy) * .45)) return goal;

  // A wall or map edge can swallow a waypoint. Pick from three bounded, walkable alternatives.
  const alternatives = [goal, clipGoal(game, bounds, -dy, dx), clipGoal(game, bounds, dy, -dx), clipGoal(game, bounds, -dx, -dy)];
  return alternatives.reduce((best, candidate) => distance(player, candidate) > distance(player, best) ? candidate : best);
}

export class SummonRoaming {
  constructor(game) {
    this.g = game;
    this.phases = new WeakMap();
  }

  move(ally, dt, followSpeed, bounds) {
    if (dt <= 0) return;
    const g = this.g, player = g.player;
    let state = this.phases.get(ally);
    if (!state) {
      const index = ally.formationIndex || 0;
      const heading = index * goldenAngle + Math.PI / 2;
      const profile = ally.source === 'r_pack' ? moonWolf : profiles[ally.kind] ?? legacy[ally.kind] ?? stone;
      state = {profile, turn: index * .38196601125 % 1, forwardX: Math.cos(heading), forwardY: Math.sin(heading), ring: Math.floor(index / 7)};
      this.phases.set(ally, state);
    }
    const {profile, forwardX, forwardY, ring} = state;
    state.turn = (state.turn + dt / profile.period) % 1;
    const ownerDistance = distance(ally, player);
    const fromX = ally.x, fromY = ally.y;
    if (ownerDistance > returnDistance || (g.terrain && !g.walkVisible(ally, player))) {
      g.approachActor(ally, player, followSpeed * dt, 28);
    } else {
      const [ahead, side] = pathOffset(profile, state.turn);
      const forward = profile.radius + ring * 20 + ahead * profile.depth;
      const lateral = side * profile.width;
      const scale = Math.min(1, roamRadius / Math.max(1, Math.hypot(forward, lateral)));
      const dx = (forward * forwardX - lateral * forwardY) * scale;
      const dy = (forward * forwardY + lateral * forwardX) * scale;
      const goal = roamingGoal(g, bounds, dx, dy);
      if (g.terrain && !g.walkVisible(ally, goal)) {
        g.approachActor(ally, player, followSpeed * dt, 12);
      } else {
        const pace = profile.speed * followSpeed / 255;
        const urgency = clamp((ownerDistance - 100) / 45, 0, 1);
        g.approachActor(ally, goal, (pace + (followSpeed - pace) * urgency) * dt);
      }
    }
    ally.x = clamp(ally.x, bounds.left, bounds.right);
    ally.y = clamp(ally.y, bounds.top, bounds.bottom);
    if (Math.hypot(ally.x - fromX, ally.y - fromY) > .15) ally.angle = Math.atan2(ally.y - fromY, ally.x - fromX);
  }
}
