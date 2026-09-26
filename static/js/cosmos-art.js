// Decorative Canvas rendering; all motion advances on the playground's clock.
// Return the first contact along a segment, including fast crossings of tiny planets.
export function segmentCircleHit(from, to, radius) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const c = from.x * from.x + from.y * from.y - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (from.x * dx + from.y * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

export function createScenery(context) {
  // Seeded positions stay put across redraws, without forming visible rows.
  let seed = 42;
  function random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
  const stars = Array.from({ length: 110 }, (_, i) => ({
    x: random(), y: random(),
    depth: 1 + i % 3, phase: i * 2.39996,
  }));
  const initialSeed = seed;
  let time = 0;
  let comet = null;
  let nextComet = 2.5;
  let targets = [];
  let previousTargets = new Map();
  let bursts = [];
  let flare = 0;
  let pointer = { x: 0, y: 0 };
  let offset = { x: 0, y: 0 };

  function circle(x, y, radius, fill) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();
  }
  function halo(x, y, radius, color, opacity) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    context.globalAlpha = opacity;
    circle(x, y, radius, gradient);
    context.globalAlpha = 1;
  }

  function advance(dt, reducedMotion) {
    if (reducedMotion) {
      offset = { x: 0, y: 0 };
      flare = 0;
      return;
    }
    time += dt;
    bursts = bursts.filter((burst) => time - burst.start < 1.25);
    if (comet && time >= comet.start + comet.duration) comet = null;
    if (time >= nextComet) {
      comet = {
        start: time, duration: 4 + random() * 3,
        angle: random() * Math.PI * 2,
        x: 0.35 + random() * 0.3, y: 0.35 + random() * 0.3,
        tail: 0.12 + random() * 0.12,
      };
      nextComet = time + comet.duration + 2.5 + random() * 3;
    }
    flare = Math.max(0, flare - dt * 1.5);
    const ease = 1 - Math.exp(-dt * 4);
    offset.x += (pointer.x - offset.x) * ease;
    offset.y += (pointer.y - offset.y) * ease;
  }

  function background(width, height, colors, reducedMotion) {
    targets = [];
    context.save();
    for (const star of stars) {
      const x = star.x * width + (reducedMotion ? 0 : offset.x * star.depth * 3);
      const y = star.y * height + (reducedMotion ? 0 : offset.y * star.depth * 3);
      const pulse = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time * (0.45 + star.depth * 0.2) + star.phase);
      context.globalAlpha = 0.2 + star.depth * 0.1 + pulse * 0.22;
      circle(x, y, star.depth * 0.4, colors.muted);
      if (star.depth === 3 && pulse > 0.88) {
        context.globalAlpha *= (pulse - 0.88) / 0.12;
        context.strokeStyle = colors.muted;
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(x - 3, y); context.lineTo(x + 3, y);
        context.moveTo(x, y - 3); context.lineTo(x, y + 3);
        context.stroke();
      }
    }
    context.restore();
  }

  // Called after planets and the Sun, so contact sparks appear above their surfaces.
  function effects(width, height, colors, reducedMotion) {
    if (reducedMotion) { previousTargets.clear(); return; }
    context.save();
    // Fit each pass to the viewport while preserving its angle on narrow screens.
    if (comet) {
      const progress = (time - comet.start) / comet.duration;
      const dx = Math.cos(comet.angle), dy = Math.sin(comet.angle);
      const distance = Math.min(width / Math.max(Math.abs(dx), 0.01), height / Math.max(Math.abs(dy), 0.01)) * 0.95;
      const x = width * comet.x + dx * distance * (progress - 0.5);
      const y = height * comet.y + dy * distance * (progress - 0.5);
      const before = comet.last ?? { x, y };
      let collision = null;
      for (const target of targets) {
        const old = comet.last ? (previousTargets.get(target.id) ?? target) : target;
        const t = segmentCircleHit({ x: before.x - old.x, y: before.y - old.y },
          { x: x - target.x, y: y - target.y }, target.radius + 1.6);
        if (t !== null && (!collision || t < collision.t)) collision = { t, target };
      }
      if (collision) {
        bursts.push({ x: before.x + (x - before.x) * collision.t,
          y: before.y + (y - before.y) * collision.t, start: time,
          solar: collision.target.id === 'sun' });
        bursts = bursts.slice(-3);
        if (collision.target.id === 'sun') flare = 1;
        comet = null;
      } else {
        comet.last = { x, y };
        const length = Math.min(160, distance * comet.tail);
        const tailX = x - dx * length, tailY = y - dy * length;
        const gradient = context.createLinearGradient(tailX, tailY, x, y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, colors.star);
        const opacity = Math.min(1, progress * 5, (1 - progress) * 4) * 0.8;
        context.globalAlpha = opacity;
        context.lineWidth = 1.6;
        context.lineCap = 'round';
        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(tailX, tailY); context.lineTo(x, y);
        context.stroke();
        halo(x, y, 6, colors.star, opacity * 0.35);
        context.globalAlpha = opacity;
        circle(x, y, 1.6, colors.highlight);
      }
    }
    previousTargets = new Map(targets.map((target) => [target.id, target]));
    for (const burst of bursts) {
      const age = (time - burst.start) / 1.25;
      const fade = (1 - age) ** 2;
      const reach = burst.solar ? 46 : 30;
      halo(burst.x, burst.y, 12 + age * reach, colors.star, fade * 0.3);
      context.globalAlpha = fade * 0.6;
      context.strokeStyle = colors.star;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(burst.x, burst.y, 3 + Math.sqrt(age) * reach, 0, Math.PI * 2);
      context.stroke();
      for (let i = 0; i < 12; i++) {
        const angle = i * 2.39996;
        const travel = (1 - (1 - age) ** 2) * reach * (0.45 + (i % 4) * 0.18);
        const x = burst.x + Math.cos(angle) * travel;
        const y = burst.y + Math.sin(angle) * travel;
        context.globalAlpha = fade;
        circle(x, y, (1 - age) * (i % 3 === 0 ? 1.8 : 1.1), i % 3 === 0 ? colors.highlight : colors.star);
      }
    }
    context.restore();
  }

  function planet(body, point, radius, center, colors) {
    targets.push({ id: body.id, x: point.x, y: point.y, radius });
    const color = body.color ?? [colors.planet, colors.secondary, colors.muted][body.tone];
    const angle = Math.atan2(center.y - point.y, center.x - point.x);
    const lightX = Math.cos(angle) * radius * 0.55;
    const lightY = Math.sin(angle) * radius * 0.55;
    const ringed = body.ringed ?? (body.seed && body.tone === 1);
    context.save();
    context.translate(point.x, point.y);
    halo(0, 0, radius * 2.3, color, 0.12);
    function ring(start, end) {
      context.save();
      context.rotate(-0.4);
      context.strokeStyle = color;
      context.globalAlpha = 0.65;
      context.lineWidth = Math.max(1.5, radius * 0.28);
      context.beginPath();
      context.ellipse(0, 0, radius * 1.95, radius * 0.62, 0, start, end);
      context.stroke();
      context.restore();
    }
    if (ringed) ring(Math.PI, Math.PI * 2);
    const surface = context.createRadialGradient(lightX, lightY, 0, 0, 0, radius);
    surface.addColorStop(0, colors.highlight);
    surface.addColorStop(0.32, color);
    surface.addColorStop(1, colors.shadow);
    circle(0, 0, radius, surface);
    // A thin illuminated limb keeps tiny planets legible in either theme.
    context.strokeStyle = color;
    context.globalAlpha = 0.65;
    context.lineWidth = 0.8;
    context.beginPath();
    context.arc(0, 0, radius, angle - Math.PI / 2, angle + Math.PI / 2);
    context.stroke();
    context.globalAlpha = 1;
    if (ringed) ring(0, Math.PI);
    context.restore();
  }

  function sun(x, y, radius, colors, reducedMotion) {
    targets.push({ id: 'sun', x, y, radius });
    context.save();
    const breath = reducedMotion ? 1 : 1 + Math.sin(time * 1.1) * 0.07;
    const impact = reducedMotion ? 0 : flare;
    halo(x, y, radius * (4.5 * breath + impact * 2), colors.star, 0.19 + impact * 0.15);
    halo(x, y, radius * 1.9, colors.star, 0.3);
    const surface = context.createRadialGradient(x - radius * 0.25, y - radius * 0.25, 0, x, y, radius);
    surface.addColorStop(0, colors.highlight);
    surface.addColorStop(0.55, colors.star);
    surface.addColorStop(1, colors.star);
    circle(x, y, radius, surface);
    if (impact > 0) {
      context.globalAlpha = impact * 0.55;
      context.strokeStyle = colors.star;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(x, y, radius * (1 + (1 - impact) * 4), 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }

  return {
    advance, background, planet, sun, effects,
    clearEffects() { comet = null; flare = 0; bursts = []; previousTargets.clear(); nextComet = time + 2.5; },
    pointAt(x, y) { pointer = { x, y }; },
    impact() { flare = 1; },
    reset() {
      time = 0; flare = 0; comet = null; nextComet = 2.5; seed = initialSeed;
      bursts = []; previousTargets.clear();
      pointer = { x: 0, y: 0 }; offset = { x: 0, y: 0 };
    },
  };
}
