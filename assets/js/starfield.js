(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Dracula Classic Tokens
  const DRACULA_COLORS = [
    { color: '#F8F8F2', weight: 0.50 }, // Foreground (primary stardust)
    { color: '#8BE9FD', weight: 0.20 }, // Cyan (cool stars)
    { color: '#BD93F9', weight: 0.15 }, // Purple (space hue)
    { color: '#6272A4', weight: 0.10 }, // Comment (faint distant dust)
    { color: '#50FA7B', weight: 0.025 }, // Green (rare spark)
    { color: '#FF79C6', weight: 0.025 }  // Pink (rare spark)
  ];

  function pickDraculaColor() {
    const r = Math.random();
    let cumulative = 0;
    for (const item of DRACULA_COLORS) {
      cumulative += item.weight;
      if (r <= cumulative) return item.color;
    }
    return '#F8F8F2';
  }

  let width = 0;
  let height = 0;
  let stars = [];
  let animId = null;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getStarCount() {
    // Density-based: approximately 1 star per 12,000 pixels, capped between 40 and 110
    const area = window.innerWidth * window.innerHeight;
    return Math.max(40, Math.min(110, Math.floor(area / 12000)));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    initStars();
  }

  function initStars() {
    const count = getStarCount();
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        // Tiny dots: 0.4px to 1.1px
        size: Math.random() * 0.7 + 0.4,
        // Ultra-slow upward drift: -0.06 to -0.20 px per frame
        vy: -(Math.random() * 0.14 + 0.06),
        // Faint horizontal sway: -0.03 to +0.05
        vx: (Math.random() - 0.38) * 0.08,
        // Soft opacity range: 0.15 to 0.65
        baseAlpha: Math.random() * 0.5 + 0.15,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.012 + 0.005,
        color: pickDraculaColor()
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      if (!isReducedMotion) {
        s.x += s.vx;
        s.y += s.vy;
        s.pulse += s.pulseSpeed;

        // Wrap around smoothly
        if (s.y < -5) {
          s.y = height + 5;
          s.x = Math.random() * width;
        }
        if (s.x < -5) s.x = width + 5;
        if (s.x > width + 5) s.x = -5;
      }

      // Smooth sinusoidal twinkle
      const alpha = s.baseAlpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.pulse)));

      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    if (!isReducedMotion) {
      animId = requestAnimationFrame(render);
    }
  }

  function start() {
    if (!animId && !isReducedMotion) {
      animId = requestAnimationFrame(render);
    }
  }

  function stop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // Handle tab visibility to save CPU and battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  window.addEventListener('resize', () => {
    resize();
    if (isReducedMotion) render();
  });

  // Start
  resize();
  render();
})();

