/* ============================================================
   Neural Terminal — Portfolio JS
   ============================================================ */

/* ---- Neural Network Canvas ---- */
(function () {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const NODE_COUNT = 75;
  const MAX_DIST   = 130;
  const SPEED      = 0.28;
  const NODE_COLOR = '0, 229, 255';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, nodes, lowPower;
  let mouse = { x: -9999, y: -9999 };

  // Fewer nodes on small screens (the O(n²) edge loop + shadowBlur get expensive)
  function targetNodeCount() {
    return W < 768 ? 40 : NODE_COUNT;
  }

  // Buffer is sized in device pixels so rendering stays sharp on Retina/HiDPI;
  // setTransform maps drawing coordinates back to CSS pixels.
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lowPower = W < 768;
  }

  function makeNode() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r:  Math.random() * 1.4 + 0.8,
    };
  }

  function spawnNodes() {
    nodes = Array.from({ length: targetNodeCount() }, makeNode);
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    if (!reduceMotion) {
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x <= 0 || n.x >= W) n.vx *= -1;
        if (n.y <= 0 || n.y >= H) n.vy *= -1;

        // gentle mouse repulsion
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 90 && d > 0) {
          n.x += (dx / d) * 1.8;
          n.y += (dy / d) * 1.8;
        }
      });
    }

    // edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.3;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${NODE_COLOR}, ${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // nodes (shadowBlur is the expensive part — skip it on small screens)
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${NODE_COLOR}, 0.65)`;
      if (!lowPower) {
        ctx.shadowBlur  = 8;
        ctx.shadowColor = `rgba(${NODE_COLOR}, 0.9)`;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (!reduceMotion) requestAnimationFrame(tick);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const oldW = W, oldH = H;
      resize();
      if (!nodes || !oldW || !oldH) {
        spawnNodes();
      } else {
        // Rescale existing positions instead of respawning — avoids a visible
        // "flash" of a brand-new layout on every resize/orientation change.
        const sx = W / oldW, sy = H / oldH;
        nodes.forEach(n => { n.x *= sx; n.y *= sy; });
        // Adjust population for the new size tier without a full respawn
        const target = targetNodeCount();
        while (nodes.length < target) nodes.push(makeNode());
        if (nodes.length > target) nodes.length = target;
      }
      // Canvas buffer was cleared by resize(); redraw when the RAF loop is stopped.
      if (reduceMotion) tick();
    }, 150);
  });

  // Listen on .hero (not the canvas): .hero-content and the vignette overlay
  // sit above the canvas and swallow most mouse events before they reach it.
  const hero = canvas.closest('.hero') || canvas;
  hero.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  resize();
  spawnNodes();
  tick();
})();


/* ---- Typewriter ---- */
(function () {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const roles = [
    'Machine Learning Engineer',
    'AI Governance & Systems Engineer',
    'Agentic LLM Systems Specialist',
    'Multilingual NLP Researcher',
  ];

  const TYPING  = 75;
  const ERASING = 38;
  const PAUSE   = 2200;
  const GAP     = 400;

  let roleIdx = 0, charIdx = 0, erasing = false;

  // Reduced motion: show the first role statically, no typing loop
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = roles[0];
    return;
  }

  function step() {
    const current = roles[roleIdx];
    if (erasing) {
      charIdx--;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        erasing = false;
        roleIdx = (roleIdx + 1) % roles.length;
        setTimeout(step, GAP);
      } else {
        setTimeout(step, ERASING);
      }
    } else {
      charIdx++;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        erasing = true;
        setTimeout(step, PAUSE);
      } else {
        setTimeout(step, TYPING);
      }
    }
  }

  setTimeout(step, 1300);
})();


/* ---- Navigation ---- */
(function () {
  const nav       = document.getElementById('nav');
  const burger    = document.getElementById('hamburger');
  const links     = document.getElementById('navLinks');
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  // Overlay element
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  function closeMenu() {
    burger.classList.remove('active');
    links.classList.remove('open');
    overlay.classList.remove('show');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    burger.classList.toggle('active', isOpen);
    overlay.classList.toggle('show', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  overlay.addEventListener('click', closeMenu);

  navLinks.forEach(l => l.addEventListener('click', closeMenu));

  // Escape closes the drawer (expected keyboard behavior)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) closeMenu();
  });

  // Scroll: nav style + active link
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 50);

    const scrollY  = window.scrollY + 110;
    // Bottom-of-page override: short final sections may never cross the
    // offsetTop threshold on their own, so force the last section active.
    const atBottom = window.innerHeight + window.scrollY >=
                     document.documentElement.scrollHeight - 4;

    let activeId = null;
    sections.forEach(s => { if (scrollY >= s.offsetTop) activeId = s.id; });
    if (atBottom && sections.length) activeId = sections[sections.length - 1].id;

    // Sections without a nav link (#hero, #awards) keep the previous
    // highlight instead of clearing them all.
    if (!activeId || !document.querySelector(`.nav-link[href="#${activeId}"]`)) return;

    navLinks.forEach(l =>
      l.classList.toggle('active', l.getAttribute('href') === `#${activeId}`)
    );
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ---- Smooth scroll polyfill (old Safari) ---- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
});


/* ---- Scroll Reveal ---- */
(function () {
  // Stagger delays for grid children
  const staggerSelectors = [
    '.skills-grid .skill-group',
    '.projects-grid .project-card',
    '.awards-grid .award-item',
    '.contact-grid .contact-card',
    '.pub-list .pub-card',
    '.about-stats .stat-card',
    '.timeline .timeline-item',
  ];

  staggerSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      const siblings = Array.from(el.parentElement.children).filter(c =>
        c.matches(sel.split(' ').pop())
      );
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = `${idx * 0.075}s`;
    });
  });

  // Intersection observer
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ---- Footer year ---- */
(function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
