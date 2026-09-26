// Procedural, cinematic lensing: fine streams of light, not a relativistic solver.
export function drawBlackHole(context, width, height, colors, time) {
  const radius = Math.max(4, Math.min(width / 8.2, height / 4.2));
  context.save();
  context.translate(width / 2, height / 2);
  const backdrop = context.createRadialGradient(0, 0, radius, 0, 0, radius * 5);
  backdrop.addColorStop(0, colors.void);
  backdrop.addColorStop(0.55, colors.void);
  backdrop.addColorStop(1, 'transparent');
  context.fillStyle = backdrop;
  context.fillRect(-width / 2, -height / 2, width, height);
  context.rotate(-0.025);

  function glow(x, y, size, color, alpha) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.18, color);
    gradient.addColorStop(1, 'transparent');
    context.globalAlpha = alpha;
    context.fillStyle = gradient;
    context.beginPath(); context.arc(x, y, size, 0, Math.PI * 2); context.fill();
  }

  // Light is stronger on the approaching side. Keep the shadow genuinely dark.
  context.save();
  context.scale(1, 0.2);
  glow(0, 0, radius * 4, colors.ember, 0.16);
  glow(radius * 0.65, 0, radius * 2.8, colors.hot, 0.2);
  context.restore();
  context.globalAlpha = 1;
  context.fillStyle = colors.void;
  context.beginPath(); context.arc(0, 0, radius * 0.97, 0, Math.PI * 2); context.fill();

  const light = context.createLinearGradient(-radius * 3.9, 0, radius * 3.9, 0);
  light.addColorStop(0, colors.ember);
  light.addColorStop(0.25, colors.hot);
  light.addColorStop(0.48, colors.highlight);
  light.addColorStop(0.6, colors.radiance);
  light.addColorStop(0.8, colors.hot);
  light.addColorStop(1, colors.ember);

  // A continuous curve bends the back of each disk stream over the shadow.
  // Unlike separate rings, its shoulders flow smoothly into the flat disk.
  function stream(index, front, broad = false) {
    const t = index / 95;
    const outer = 1.08 + t * 2.85;
    const rx = radius * outer;
    const ry = radius * (0.105 + t * 0.29);
    const phase = time * (0.34 / outer ** 1.5) + index * 2.39996;
    context.beginPath();
    for (let j = 0; j <= 72; j++) {
      const theta = j / 72 * Math.PI;
      const x = Math.cos(theta) * rx;
      const bend = Math.exp(-Math.pow(Math.abs(x) / (radius * 1.01), 2.4));
      const ripple = Math.sin(theta * 13 + phase) * Math.sin(theta * 5 - phase * 0.7) * radius * 0.005;
      const y = (front ? 1 : -1) * Math.sin(theta) * ry
        - (front ? 0 : radius * (0.94 + t * 0.08) * bend) + ripple;
      if (j === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    const texture = 0.65 + 0.35 * Math.sin(index * 17.17) ** 2;
    context.strokeStyle = broad ? colors.hot : light;
    context.lineWidth = broad ? radius * 0.095 : Math.max(0.38, radius * (0.007 + (index % 3) * 0.002));
    context.globalAlpha = broad ? 0.032 : texture * (0.6 - t * 0.43) * (front ? 1 : 0.85);
    context.stroke();
  }

  // The faint lower image is light from the far side bent underneath the hole.
  context.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    context.strokeStyle = i < 12 ? colors.highlight : colors.hot;
    context.lineWidth = Math.max(0.55, radius * 0.008);
    context.globalAlpha = Math.sin(t * Math.PI) * 0.4;
    context.beginPath();
    context.ellipse(0, 0, radius * (0.98 + t * 0.14), radius * (0.91 + t * 0.19), 0, 0, Math.PI);
    context.stroke();
  }
  for (const front of [false, true]) {
    for (let i = 0; i < 96; i += 8) stream(i, front, true);
    for (let i = 95; i >= 0; i--) stream(i, front);
  }

  // Track bright knots of material around complete orbits. Inner streams lead
  // the outer ones; the far-side knots follow the same lensed arch as the disk.
  function flowPoint(theta, t) {
    const x = Math.cos(theta) * radius * (1.08 + t * 2.85);
    const front = Math.sin(theta) >= 0;
    const bend = Math.exp(-Math.pow(Math.abs(x) / (radius * 1.01), 2.4));
    return { x, y: Math.sin(theta) * radius * (0.105 + t * 0.29)
      - (front ? 0 : radius * (0.94 + t * 0.08) * bend) };
  }
  context.globalCompositeOperation = 'screen';
  context.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const t = 0.1 + (i % 8) / 8 * 0.85;
    const theta = time * (0.95 / Math.sqrt(1.08 + t * 2.85)) + i * 2.39996;
    const visibility = Math.min(1, Math.abs(Math.sin(theta)) * 5);
    const head = flowPoint(theta, t);
    for (let segment = 0; segment < 14; segment++) {
      const a = theta - 0.38 + segment / 14 * 0.38;
      // Fade at each disk edge instead of drawing across the lensing seam.
      const edgeFade = Math.min(1, Math.abs(Math.sin(a)) * 5);
      const from = flowPoint(a, t), to = flowPoint(a + 0.38 / 14, t);
      if (Math.sin(a) * Math.sin(a + 0.38 / 14) < 0) continue;
      context.globalAlpha = (segment + 1) / 14 * 0.8 * edgeFade;
      context.strokeStyle = i % 3 === 0 ? colors.radiance : colors.hot;
      context.lineWidth = Math.max(1.3, radius * 0.024);
      context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y); context.stroke();
    }
    glow(head.x, head.y, radius * 0.065, colors.hot, visibility * 0.55);
  }

  // Local bloom, strongest at the bright shoulder, softens the fine filaments.
  context.globalCompositeOperation = 'screen';
  glow(radius * 0.75, -radius * 0.25, radius * 0.9, colors.hot, 0.16);
  glow(radius * 0.8, -radius * 0.08, radius * 0.44, colors.radiance, 0.24);
  glow(0, -radius * 1.13, radius * 0.6, colors.hot, 0.13);
  context.restore();
}
