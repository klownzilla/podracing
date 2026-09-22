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
  let resizeTimeout = null;

  const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isReducedMotion = motionMediaQuery.matches;

  function getStarCount(w, h) {
    // Density-based: approximately 1 star per 12,000 pixels, capped between 40 and 110
    const area = w * h;
    return Math.max(40, Math.min(110, Math.floor(area / 12000)));
  }

  function createStar(customX, customY) {
    return {
      x: typeof customX === 'number' ? customX : Math.random() * width,
      y: typeof customY === 'number' ? customY : Math.random() * height,
      // Particle radius: 0.8px to 1.9px
      size: Math.random() * 1.1 + 0.8,
      // Ultra-slow upward drift: -0.06 to -0.20 px per frame
      vy: -(Math.random() * 0.14 + 0.06),
      // Faint horizontal sway: -0.03 to +0.05
      vx: (Math.random() - 0.38) * 0.08,
      // Soft opacity range: 0.15 to 0.65
      baseAlpha: Math.random() * 0.5 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.012 + 0.005,
      color: pickDraculaColor()
    };
  }

  function updateStars(oldWidth, oldHeight) {
    const targetCount = getStarCount(width, height);

    if (stars.length === 0) {
      for (let i = 0; i < targetCount; i++) {
        stars.push(createStar());
      }
      return;
    }

    // Preserve existing stars: proportionally shift if width changed (rotation / desktop resize)
    if (oldWidth > 0 && oldWidth !== width) {
      const rx = width / oldWidth;
      const ry = (oldHeight > 0 && Math.abs(height - oldHeight) > 150) ? (height / oldHeight) : 1;
      for (let i = 0; i < stars.length; i++) {
        stars[i].x *= rx;
        stars[i].y *= ry;
      }
    }

    // Adjust count gracefully without wiping out existing stars
    if (stars.length < targetCount) {
      const toAdd = targetCount - stars.length;
      for (let i = 0; i < toAdd; i++) {
        stars.push(createStar());
      }
    } else if (stars.length > targetCount) {
      stars.length = targetCount;
    }
  }

  function applyResize(newWidth, newHeight) {
    const oldWidth = width;
    const oldHeight = height;
    width = newWidth;
    height = newHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    updateStars(oldWidth, oldHeight);
    drawFrame();
  }

  function onResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    if (newWidth === width && newHeight === height) return;

    // Mobile scroll check: address bar expansion/collapse changes innerHeight by a small amount (<150px)
    // while innerWidth remains strictly identical.
    const isMobileScroll = (newWidth === width && Math.abs(newHeight - height) < 150);

    if (isMobileScroll) {
      // Keep height boundary updated for particle wrapping without rebuilding the canvas buffer or stars
      height = newHeight;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        applyResize(window.innerWidth, window.innerHeight);
      }, 250);
      return;
    }

    // Real resize (orientation change or desktop window resize)
    clearTimeout(resizeTimeout);
    applyResize(newWidth, newHeight);
  }

  function drawFrame() {
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
        } else if (s.y > height + 5) {
          s.y = -5;
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
  }

  function loop() {
    drawFrame();
    if (!isReducedMotion) {
      animId = requestAnimationFrame(loop);
    } else {
      animId = null;
    }
  }

  function start() {
    if (!animId && !isReducedMotion) {
      animId = requestAnimationFrame(loop);
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

  // Dynamic prefers-reduced-motion listener
  motionMediaQuery.addEventListener('change', (e) => {
    isReducedMotion = e.matches;
    if (isReducedMotion) {
      stop();
      drawFrame();
    } else {
      start();
    }
  });

  window.addEventListener('resize', onResize);

  // Initial startup
  applyResize(window.innerWidth, window.innerHeight);
  start();
})();

