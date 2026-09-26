// Deliberately compressed scales: a pocket atlas, not an ephemeris.
import { drawBlackHole } from './cosmos-black-hole.js';
export const PLANETS = Object.freeze([
  { name: 'Mercury', color: 'muted', size: 0.45, period: 0.24, fact: 'A small, cratered world. One year lasts just 88 Earth days.' },
  { name: 'Venus', color: 'planet', size: 0.72, period: 0.62, fact: 'Wrapped in thick clouds, Venus is the hottest planet in our Solar System.' },
  { name: 'Earth', color: 'ocean', size: 0.8, period: 1, fact: 'Our pale blue home. The little companion circling it is the Moon.' },
  { name: 'Mars', color: 'rust', size: 0.6, period: 1.88, fact: 'The red planet has the tallest known volcano in the Solar System: Olympus Mons.' },
  { name: 'Jupiter', color: 'planet', size: 1.6, period: 11.86, fact: 'The giant of the family. Its Great Red Spot is a storm larger than Earth.' },
  { name: 'Saturn', color: 'star', size: 1.3, period: 29.46, fact: 'Its spectacular rings are made mostly of countless pieces of ice.' },
  { name: 'Uranus', color: 'ice', size: 1, period: 84.01, fact: 'An ice giant tipped on its side, with an axis tilted about 98 degrees.' },
  { name: 'Neptune', color: 'ocean', size: 0.95, period: 164.8, fact: 'A deep-blue, windswept world. One orbit takes about 165 Earth years.' },
]);

export function orbit(index, time) {
  const planet = PLANETS[index];
  // Compress periods as well as distances, so Neptune moves during a short visit.
  const angle = index * 2.39996 + time * 0.35 / planet.period ** 0.35;
  const radius = 0.19 + index * 0.108 + (index >= 4 ? 0.045 : 0);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle, radius };
}

export function galaxyStars() {
  let seed = 146;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: 2800 }, (_, i) => {
    const core = i < 550;
    const radius = core ? random() ** 1.6 * 0.25 : 0.13 + random() ** 0.75 * 0.87;
    const angle = core || i % 7 === 0 ? random() * Math.PI * 2
      : (i % 4) * Math.PI / 2 + Math.log(radius / 0.13) * 1.6 + (random() - 0.5) * 0.75;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius,
      size: 0.35 + random() * 1.1, alpha: 0.2 + random() * 0.65, core };
  });
}

export function createAtlas(context, scenery) {
  const stars = galaxyStars();
  const times = { solar: 0, galaxy: 0, blackhole: 0 };
  let targets = [];
  let selected = 2;

  function dot(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
  }
  function label(text, x, y, colors) {
    context.font = '12px "Geist Mono", monospace';
    const width = context.measureText(text).width;
    context.fillStyle = colors.background;
    context.globalAlpha = 0.88;
    context.fillRect(x - width / 2 - 7, y - 12, width + 14, 20);
    context.globalAlpha = 1;
    context.fillStyle = colors.text;
    context.textAlign = 'center';
    context.fillText(text, x, y + 2);
  }
  function solar(width, height, colors, reducedMotion) {
    const center = { x: width / 2, y: height / 2 };
    const extent = Math.max(1, Math.min(width / 2 - 26, (height / 2 - 36) / 0.64));
    const unit = Math.max(3, Math.min(9, extent / 28));
    const position = (p) => ({ x: center.x + p.x * extent, y: center.y + p.y * extent * 0.64 });
    targets = [];
    context.lineWidth = 0.7;
    for (let i = 0; i < PLANETS.length; i++) {
      const p = orbit(i, times.solar);
      context.strokeStyle = colors.guide;
      context.beginPath();
      context.ellipse(center.x, center.y, p.radius * extent, p.radius * extent * 0.64, 0, 0, Math.PI * 2);
      context.stroke();
    }
    // Asteroid belt: fixed count, cheap points, no extra physics system.
    context.fillStyle = colors.muted;
    context.globalAlpha = 0.35;
    for (let i = 0; i < 200; i++) {
      const angle = i * 2.39996 + times.solar * 0.08;
      const radius = 0.565 + (i % 7) * 0.005;
      const p = position({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      context.fillRect(p.x, p.y, 1, 1);
    }
    context.globalAlpha = 1;
    scenery.sun(center.x, center.y, unit * 2.3, colors, reducedMotion);
    for (let i = 0; i < PLANETS.length; i++) {
      const planet = PLANETS[i];
      const point = position(orbit(i, times.solar));
      const radius = Math.max(2.6, unit * planet.size);
      scenery.planet({ id: i, color: colors[planet.color], ringed: i === 5 }, point, radius, center, colors);
      if (i === 2) {
        const angle = times.solar * 1.4;
        dot(point.x + Math.cos(angle) * (radius + 7), point.y + Math.sin(angle) * (radius + 7) * 0.6, 1.5, colors.muted);
      }
      targets.push({ id: i, ...point, radius: Math.max(radius + 5, 12) });
      if (i === selected) {
        context.strokeStyle = colors.text;
        context.globalAlpha = 0.5;
        context.lineWidth = 1;
        context.beginPath(); context.arc(point.x, point.y, radius + 5, 0, Math.PI * 2); context.stroke();
        context.globalAlpha = 1;
        label(planet.name, Math.max(38, Math.min(width - 38, point.x)), point.y - radius - 17, colors);
      }
    }
  }

  function galaxy(width, height, colors) {
    const extent = Math.max(1, Math.min(width * 0.43, height * 0.65));
    const angle = times.galaxy * 0.025;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const project = (x, y) => ({
      x: width / 2 + (x * cos - y * sin) * extent,
      y: height / 2 + (x * sin + y * cos) * extent * 0.6,
    });
    // A broad, inclined glow under the star field gives the disk volume.
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(1, 0.6);
    const glow = context.createRadialGradient(0, 0, 0, 0, 0, extent);
    glow.addColorStop(0, colors.star); glow.addColorStop(0.2, colors.nebula); glow.addColorStop(1, 'transparent');
    context.globalAlpha = 0.22;
    dot(0, 0, extent, glow);
    context.restore();

    // Soft ribbons link the individual stars into sweeping spiral arms.
    for (let arm = 0; arm < 4; arm++) {
      context.beginPath();
      for (let i = 0; i <= 70; i++) {
        const radius = 0.13 + i / 70 * 0.86;
        const theta = arm * Math.PI / 2 + Math.log(radius / 0.13) * 1.6;
        const p = project(Math.cos(theta) * radius, Math.sin(theta) * radius);
        if (i === 0) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
      }
      context.strokeStyle = colors.nebula;
      context.lineCap = 'round';
      for (const width of [0.09, 0.055, 0.025]) {
        context.lineWidth = extent * width;
        context.globalAlpha = 0.035;
        context.stroke();
      }
    }
    for (const star of stars) {
      const p = project(star.x, star.y);
      context.globalAlpha = star.alpha;
      context.fillStyle = star.core ? colors.star : colors.ice;
      context.fillRect(p.x, p.y, star.size, star.size);
    }
    context.globalAlpha = 1;
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(0.3);
    context.scale(1, 0.42);
    const core = context.createRadialGradient(0, 0, 0, 0, 0, extent * 0.24);
    core.addColorStop(0, colors.highlight); core.addColorStop(0.3, colors.star); core.addColorStop(1, 'transparent');
    dot(0, 0, extent * 0.24, core);
    context.restore();
    const home = project(0.48, -0.29);
    context.strokeStyle = colors.text;
    context.lineWidth = 1;
    context.beginPath(); context.arc(home.x, home.y, 8, 0, Math.PI * 2); context.stroke();
    dot(home.x, home.y, 2.5, colors.star);
    label('You are here', Math.max(58, Math.min(width - 58, home.x)), home.y - 22, colors);
    targets = [{ id: 'solar', ...home, radius: 22 }];
  }

  return {
    advance(view, elapsed) { if (view in times) times[view] += elapsed; },
    draw(view, width, height, colors, reducedMotion) {
      context.save();
      if (view === 'solar') solar(width, height, colors, reducedMotion);
      else if (view === 'galaxy') galaxy(width, height, colors);
      else { targets = []; drawBlackHole(context, width, height, colors, times.blackhole); }
      context.restore();
    },
    hit(x, y) {
      // Choose the nearest hit when compressed orbits place two targets close together.
      return targets.filter((p) => Math.hypot(p.x - x, p.y - y) <= p.radius)
        .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]?.id;
    },
    select(index) { selected = index; },
    reset(view) { if (view in times) times[view] = 0; if (view === 'solar') selected = 2; },
  };
}
