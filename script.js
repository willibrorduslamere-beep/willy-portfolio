/* ========== PARTICLE / GRID ANIMATION ========== */
document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════════════════════════════════════
  // ── Loading Screen Controller ──
  // ═══════════════════════════════════════════════════
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    let loadingDismissed = false;
    const MIN_DISPLAY_MS = 2800;
    const loadingStart = Date.now();

    function dismissLoading() {
      if (loadingDismissed) return;
      loadingDismissed = true;

      const elapsed = Date.now() - loadingStart;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

      setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        // Remove from DOM after fade-out transition
        setTimeout(() => {
          loadingScreen.classList.add('hidden');
        }, 520);
      }, remaining);
    }

    // Auto-dismiss after minimum duration
    setTimeout(dismissLoading, MIN_DISPLAY_MS);

    // Skip: click, any key, space, escape
    loadingScreen.addEventListener('click', dismissLoading);
    document.addEventListener('keydown', function loadingKeyHandler(e) {
      dismissLoading();
      document.removeEventListener('keydown', loadingKeyHandler);
    });
  }

  // ── Particle Canvas ──
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = [];
  const PARTICLE_COUNT = 60;

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.3 + 0.05;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    connectParticles();
    requestAnimationFrame(animateParticles);
  }

  animateParticles();

  // ── Cursor Glow ──
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    });
  }

  // ══════════════════════════════════════════════
  // ── Unified Animated Lanyard Strap + ID Card Assembly ──
  // ══════════════════════════════════════════════
  const assembly = document.getElementById('id-card-assembly');
  const strapCanvas = document.getElementById('lanyard-strap-canvas');
  const strapCtx = strapCanvas ? strapCanvas.getContext('2d') : null;

  if (assembly && strapCtx && strapCanvas) {
    // ── Responsive canvas sizing & coordinate system ──
    let STRAP_W = 320;
    let STRAP_H = 250;
    let PIN_X = 160;
    const PIN_Y = 8;
    let REST_ATTACH_Y = 165;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function setupStrapCanvas() {
      const rect = strapCanvas.getBoundingClientRect();
      STRAP_W = Math.round(rect.width) || (window.innerWidth <= 640 ? 240 : window.innerWidth <= 900 ? 280 : 320);
      STRAP_H = Math.round(rect.height) || (window.innerWidth <= 640 ? 160 : window.innerWidth <= 900 ? 200 : 250);
      PIN_X = STRAP_W / 2;
      REST_ATTACH_Y = window.innerWidth <= 640 ? 107 : window.innerWidth <= 900 ? 137 : 167;

      strapCanvas.width = Math.round(STRAP_W * DPR);
      strapCanvas.height = Math.round(STRAP_H * DPR);

      strapCtx.setTransform(1, 0, 0, 1, 0, 0);
      strapCtx.scale(DPR, DPR);
    }
    setupStrapCanvas();
    window.addEventListener('resize', () => {
      setupStrapCanvas();
      resetRopePoints();
    });

    // ── Load lanyard strap image ──
    const strapImg = new Image();
    strapImg.src = 'lanyard-strap.jpg';
    let strapImgLoaded = false;
    strapImg.onload = () => { strapImgLoaded = true; };

    // ── Physics state for Card Assembly ──
    let cardX = 0;
    let cardY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Boundaries: strictly prevents overlapping navbar or escaping
    const MIN_X = -100;
    const MAX_X = 100;
    const MIN_Y = -15; // Navbar protection
    const MAX_Y = 140;

    // Spring constants
    const SPRING = 0.09;
    const DAMPING = 0.84;

    // ── Verlet Rope simulation ──
    const NUM_POINTS = 16;
    const CONSTRAINT_ITERATIONS = 8;
    const GRAVITY = 0.25;
    const ROPE_DAMPING = 0.96;

    let ropePoints = [];
    function resetRopePoints() {
      ropePoints = [];
      const segH = (REST_ATTACH_Y - PIN_Y) / (NUM_POINTS - 1);
      for (let i = 0; i < NUM_POINTS; i++) {
        const y = PIN_Y + i * segH;
        ropePoints.push({
          x: PIN_X,
          y: y,
          prevX: PIN_X,
          prevY: y,
          pinned: i === 0 || i === NUM_POINTS - 1
        });
      }
    }
    resetRopePoints();

    let time = 0;

    // ── Physics & Animation Loop ──
    function updatePhysics() {
      if (!isDragging) {
        const forceX = -SPRING * cardX;
        const forceY = -SPRING * cardY;

        velocityX = (velocityX + forceX) * DAMPING;
        velocityY = (velocityY + forceY) * DAMPING;

        cardX += velocityX;
        cardY += velocityY;

        if (Math.abs(cardX) < 0.04 && Math.abs(velocityX) < 0.04) {
          cardX = 0; velocityX = 0;
        }
        if (Math.abs(cardY) < 0.04 && Math.abs(velocityY) < 0.04) {
          cardY = 0; velocityY = 0;
        }
      }

      // Synchronize Card Assembly DOM transform
      const rotation = cardX * 0.07;
      assembly.style.transform = `translate(${cardX}px, ${cardY}px) rotate(${rotation}deg)`;

      // Update rope endpoints
      // Point 0 = top pin
      ropePoints[0].x = PIN_X;
      ropePoints[0].y = PIN_Y;

      // Last point = top center of buckle (LOCKED in lockstep)
      const last = ropePoints[NUM_POINTS - 1];
      last.x = PIN_X + cardX;
      last.y = REST_ATTACH_Y + cardY;

      // Verlet physics for inner rope points
      for (let i = 1; i < NUM_POINTS - 1; i++) {
        const p = ropePoints[i];
        const vx = (p.x - p.prevX) * ROPE_DAMPING;
        const vy = (p.y - p.prevY) * ROPE_DAMPING;

        p.prevX = p.x;
        p.prevY = p.y;

        p.x += vx;
        p.y += vy + GRAVITY;

        // Gentle ambient sway
        const sway = Math.sin(time * 1.3 + i * 0.35) * 0.06;
        p.x += sway;
      }

      // Distance constraints
      const targetDist = (REST_ATTACH_Y - PIN_Y) / (NUM_POINTS - 1);
      for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
        for (let i = 0; i < NUM_POINTS - 1; i++) {
          const p1 = ropePoints[i];
          const p2 = ropePoints[i + 1];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) continue;
          const diff = (targetDist - dist) / dist;

          const offsetX = dx * diff * 0.5;
          const offsetY = dy * diff * 0.5;

          if (!p1.pinned) {
            p1.x -= offsetX;
            p1.y -= offsetY;
          }
          if (!p2.pinned) {
            p2.x += offsetX;
            p2.y += offsetY;
          }
        }
      }
    }

    // ── Continuous Catmull-Rom Spline Interpolation ──
    function getSplinePoint(pts, t) {
      const p = (pts.length - 1) * t;
      const intPoint = Math.floor(p);
      const weight = p - intPoint;

      const p0 = pts[Math.max(0, intPoint - 1)];
      const p1 = pts[intPoint];
      const p2 = pts[Math.min(pts.length - 1, intPoint + 1)];
      const p3 = pts[Math.min(pts.length - 1, intPoint + 2)];

      return {
        x: 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * weight +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * (weight * weight) +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * (weight * weight * weight)
        ),
        y: 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * weight +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * (weight * weight) +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * (weight * weight * weight)
        )
      };
    }

    // ── Draw Continuous Unified Lanyard Strap ──
    function drawStrap() {
      // Clean clear of entire canvas (anti-ghosting)
      strapCtx.save();
      strapCtx.setTransform(1, 0, 0, 1, 0, 0);
      strapCtx.clearRect(0, 0, strapCanvas.width, strapCanvas.height);
      strapCtx.restore();

      time += 0.016;

      updatePhysics();

      // Sample smooth continuous curve
      const NUM_SAMPLES = 36;
      const curvePoints = [];
      for (let i = 0; i <= NUM_SAMPLES; i++) {
        curvePoints.push(getSplinePoint(ropePoints, i / NUM_SAMPLES));
      }

      const strapWidth = STRAP_W <= 250 ? 24 : STRAP_W <= 290 ? 27 : 30;
      const halfW = strapWidth / 2;

      // Compute continuous left & right boundary vertices (Zero Gaps / Tears!)
      const leftVertices = [];
      const rightVertices = [];

      for (let i = 0; i < curvePoints.length; i++) {
        const curr = curvePoints[i];
        const next = curvePoints[Math.min(i + 1, curvePoints.length - 1)];
        const prev = curvePoints[Math.max(0, i - 1)];

        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const angle = Math.atan2(dy, dx);

        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);

        leftVertices.push({ x: curr.x + nx * halfW, y: curr.y + ny * halfW });
        rightVertices.push({ x: curr.x - nx * halfW, y: curr.y - ny * halfW });
      }

      // ── 1. Base Continuous Strap Ribbon Body ──
      strapCtx.save();
      strapCtx.beginPath();
      strapCtx.moveTo(leftVertices[0].x, leftVertices[0].y);
      for (let i = 1; i < leftVertices.length; i++) {
        strapCtx.lineTo(leftVertices[i].x, leftVertices[i].y);
      }
      for (let i = rightVertices.length - 1; i >= 0; i--) {
        strapCtx.lineTo(rightVertices[i].x, rightVertices[i].y);
      }
      strapCtx.closePath();

      // Deep rich lanyard strap background
      strapCtx.fillStyle = '#0f0f11';
      strapCtx.fill();

      // Clip inside the continuous ribbon for texture & pattern mapping
      strapCtx.clip();

      if (strapImgLoaded) {
        // Continuous mapped image textured strips with subtle seam overlap
        const imgW = strapImg.naturalWidth;
        const imgH = strapImg.naturalHeight;
        const cropX = (imgW - imgW * 0.55) / 2;
        const cropW = imgW * 0.55;

        for (let i = 0; i < curvePoints.length - 1; i++) {
          const p1 = curvePoints[i];
          const p2 = curvePoints[i + 1];

          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const segLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
          const srcY = (i / (curvePoints.length - 1)) * imgH;
          const srcH = imgH / (curvePoints.length - 1);

          strapCtx.save();
          strapCtx.translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          strapCtx.rotate(angle - Math.PI / 2);

          strapCtx.drawImage(
            strapImg,
            cropX, srcY, cropW, srcH + 1.5,
            -halfW, -segLen / 2 - 1.5,
            strapWidth, segLen + 3
          );
          strapCtx.restore();
        }
      }

      // Subtle linear gradient shading along strap length for depth
      const grad = strapCtx.createLinearGradient(PIN_X, PIN_Y, leftVertices[leftVertices.length - 1].x, leftVertices[leftVertices.length - 1].y);
      grad.addColorStop(0, 'rgba(255,255,255,0.06)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.3)');
      strapCtx.fillStyle = grad;
      strapCtx.fill();

      strapCtx.restore();

      // ── 2. Crisp Stitched Borders (Left & Right) ──
      strapCtx.save();
      strapCtx.lineWidth = 1.2;
      strapCtx.strokeStyle = 'rgba(255,255,255,0.12)';

      // Left border
      strapCtx.beginPath();
      strapCtx.moveTo(leftVertices[0].x, leftVertices[0].y);
      for (let i = 1; i < leftVertices.length; i++) {
        strapCtx.lineTo(leftVertices[i].x, leftVertices[i].y);
      }
      strapCtx.stroke();

      // Right border
      strapCtx.beginPath();
      strapCtx.moveTo(rightVertices[0].x, rightVertices[0].y);
      for (let i = 1; i < rightVertices.length; i++) {
        strapCtx.lineTo(rightVertices[i].x, rightVertices[i].y);
      }
      strapCtx.stroke();
      strapCtx.restore();

      // ── 3. Connector Loop At Top Pin (Seamless Anchor) ──
      strapCtx.save();
      strapCtx.beginPath();
      strapCtx.arc(PIN_X, PIN_Y + 2, 4, 0, Math.PI * 2);
      strapCtx.fillStyle = '#222';
      strapCtx.fill();
      strapCtx.strokeStyle = 'rgba(255,255,255,0.2)';
      strapCtx.lineWidth = 1.5;
      strapCtx.stroke();
      strapCtx.restore();

      requestAnimationFrame(drawStrap);
    }

    // ── Mouse Drag Events (Directly on Assembly) ──
    assembly.addEventListener('mousedown', (e) => {
      isDragging = true;
      assembly.classList.add('dragging');
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragOffsetX = cardX;
      dragOffsetY = cardY;
      velocityX = 0;
      velocityY = 0;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      const rawX = dragOffsetX + dx * 0.72;
      const rawY = dragOffsetY + dy * 0.72;

      cardX = Math.max(MIN_X, Math.min(MAX_X, rawX));
      cardY = Math.max(MIN_Y, Math.min(MAX_Y, rawY));
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        assembly.classList.remove('dragging');
      }
    });

    // ── Touch Drag Events for Mobile ──
    assembly.addEventListener('touchstart', (e) => {
      isDragging = true;
      assembly.classList.add('dragging');
      const touch = e.touches[0];
      dragStartX = touch.clientX;
      dragStartY = touch.clientY;
      dragOffsetX = cardX;
      dragOffsetY = cardY;
      velocityX = 0;
      velocityY = 0;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartX;
      const dy = touch.clientY - dragStartY;

      const rawX = dragOffsetX + dx * 0.72;
      const rawY = dragOffsetY + dy * 0.72;

      cardX = Math.max(MIN_X, Math.min(MAX_X, rawX));
      cardY = Math.max(MIN_Y, Math.min(MAX_Y, rawY));
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        assembly.classList.remove('dragging');
      }
    });

    // Start single continuous animation loop
    requestAnimationFrame(drawStrap);
  }

  // ── Navbar Scroll Effect + Parallax ──
  const navbar = document.querySelector('.navbar');
  const parallaxElements = document.querySelectorAll('[data-parallax-speed]');

  // Collect all animatable elements for scroll-based motion
  const motionElements = document.querySelectorAll(
    '.social-card, .map-container, .timeline-map, .origin-text'
  );

  let lastScrollY = 0;
  let ticking = false;

  function onScroll() {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  function updateParallax() {
    // Navbar effect
    if (lastScrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Parallax elements with data-parallax-speed
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const offset = (centerY - viewCenter) * speed;
      el.style.transform = `translateY(${offset}px)`;
    });

    // Subtle motion for all cards/maps based on scroll position
    motionElements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const direction = i % 2 === 0 ? 1 : -1;
        const translateX = (1 - progress) * 15 * direction;
        const translateY = (1 - progress) * 20;
        el.style.transform = `translate(${translateX}px, ${translateY}px)`;
        el.style.opacity = Math.min(1, progress * 1.5);
      }
    });

    ticking = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Mobile Nav Toggle ──
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // ── Scroll Reveal Animation ──
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .timeline-item, .skill-category');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ── Smooth anchor scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Tool card tilt effect ──
  document.querySelectorAll('.tool-card, .ai-skill-card, .other-skill-card, .social-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ── Typing effect for hero tagline ──
  const tagline = document.querySelector('.hero-tagline');
  if (tagline) {
    const text = tagline.textContent;
    tagline.textContent = '';
    tagline.style.opacity = '1';
    let charIndex = 0;

    function typeWriter() {
      if (charIndex < text.length) {
        tagline.textContent += text.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 25);
      }
    }

    setTimeout(typeWriter, 1200);
  }

  // ── Counter animation for stats (if any) ──
  function animateCounter(el, target, duration = 2000) {
    let start = 0;
    const step = target / (duration / 16);
    const counter = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target;
        clearInterval(counter);
      } else {
        el.textContent = Math.floor(start);
      }
    }, 16);
  }

  // ── Section active state in nav ──
  const sections = document.querySelectorAll('section[id]');
  const navLinksAll = document.querySelectorAll('.nav-links a[href^="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 200;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinksAll.forEach(link => {
      link.style.color = '';
      if (link.getAttribute('href') === '#' + current) {
        link.style.color = '#ffffff';
      }
    });
  });

  // ═══════════════════════════════════════════════════
  // ── SWIPEABLE STACKED CARD GALLERY SYSTEM ──
  // ── Modular, reusable component for ALL galleries ──
  // ═══════════════════════════════════════════════════

  const galleryData = {
    sdInpres: {
      id: 'sd-inpres',
      title: 'SD Negeri Inpres Sifnana',
      photos: [
        { id: 1, src: 'foto-1.jpg', caption: 'Kegiatan Belajar di Kelas' },
        { id: 2, src: 'foto-2.jpg', caption: 'Perayaan di Sekolah' },
        { id: 3, src: 'foto-3.jpg', caption: 'Kunjungan ke Kantor Desa' },
        { id: 4, src: 'foto-4.jpg', caption: 'Pertemuan dengan Pejabat' },
        { id: 5, src: 'foto-5.jpg', caption: 'Foto Bersama Siswa' }
      ]
    },
    itats: {
      id: 'itats',
      title: 'Institut Teknologi Adhi Tama Surabaya (ITATS)',
      photos: [
        { id: 1, src: 'itats-foto-1.jpg', caption: 'Foto Bersama HMTP Mining Engineering' },
        { id: 2, src: 'itats-foto-2.jpg', caption: 'Bravo Tambang!' },
        { id: 3, src: 'itats-foto-3.jpg', caption: 'Kebersamaan Mahasiswa' },
        { id: 4, src: 'itats-foto-4.jpg', caption: 'Semangat Juang' },
        { id: 5, src: 'itats-foto-5.jpg', caption: 'Kibarkan Bendera HMTP' }
      ]
    },
    sma: {
      id: 'sma',
      title: 'SMA Negeri 10 Tanimbar Selatan',
      photos: [
        { id: 1, src: 'sma-foto-1.jpg', caption: 'Kenangan Masa Sekolah di SMAN 10' },
        { id: 2, src: 'sma-foto-2.jpg', caption: 'Kebersamaan & Sahabat Putih Abu-Abu' },
        { id: 3, src: 'sma-foto-3.jpg', caption: 'Aktivitas & Kebersamaan Siswa' },
        { id: 4, src: 'sma-foto-4.jpg', caption: 'Semangat Merah Putih SMAN 10' },
        { id: 5, src: 'sma-foto-5.jpg', caption: 'Keluarga Besar SMAN 10 Tanimbar Selatan' }
      ]
    }
  };

  class GallerySwiper {
    constructor() {
      // DOM Elements
      this.modal = document.getElementById('gallery-modal-swipeable');
      this.backdrop = document.getElementById('gallery-backdrop');
      this.closeBtn = document.getElementById('gallery-close-btn');
      this.stack = document.getElementById('gallery-cards-stack');
      this.titleEl = document.querySelector('.gallery-title-text');
      this.captionEl = document.getElementById('gallery-card-caption');
      this.counterEl = document.getElementById('gallery-counter');
      this.dotsEl = document.getElementById('gallery-dots');
      this.prevBtn = document.getElementById('gallery-nav-prev');
      this.nextBtn = document.getElementById('gallery-nav-next');

      // Lightbox Elements
      this.lightbox = document.getElementById('lightbox');
      this.lightboxOverlay = document.getElementById('lightbox-overlay');
      this.lightboxClose = document.getElementById('lightbox-close');
      this.lightboxImg = document.getElementById('lightbox-img');
      this.lightboxCaption = document.getElementById('lightbox-caption');
      this.lightboxCounter = document.getElementById('lightbox-counter');
      this.lightboxPrev = document.getElementById('lightbox-prev');
      this.lightboxNext = document.getElementById('lightbox-next');

      // State
      this.currentGallery = null;
      this.photos = [];
      this.currentIndex = 0;
      this.isOpen = false;
      this.lightboxOpen = false;
      this.isAnimating = false;

      // Drag / Swipe State
      this.isDragging = false;
      this.startX = 0;
      this.startY = 0;
      this.currentDx = 0;
      this.currentDy = 0;
      this.startTime = 0;
      this.activeCard = null;

      this.init();
    }

    init() {
      if (!this.modal || !this.stack) return;

      // Bind Modal Controls
      if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
      if (this.backdrop) this.backdrop.addEventListener('click', () => this.close());
      if (this.prevBtn) this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prevCard();
      });
      if (this.nextBtn) this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextCard();
      });

      // Bind Lightbox Controls
      if (this.lightboxClose) this.lightboxClose.addEventListener('click', () => this.closeLightbox());
      if (this.lightboxOverlay) this.lightboxOverlay.addEventListener('click', () => this.closeLightbox());
      if (this.lightboxPrev) {
        this.lightboxPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateLightbox(-1);
        });
      }
      if (this.lightboxNext) {
        this.lightboxNext.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateLightbox(1);
        });
      }

      // Keyboard Controls
      document.addEventListener('keydown', (e) => this.handleKeydown(e));

      // Bind all gallery trigger buttons on the page
      document.querySelectorAll('.gallery-trigger-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          let galleryKey = btn.getAttribute('data-gallery');
          if (!galleryKey) {
            if (btn.id.includes('sd')) galleryKey = 'sdInpres';
            else if (btn.id.includes('itats')) galleryKey = 'itats';
            else if (btn.id.includes('sma')) galleryKey = 'sma';
          }
          if (galleryKey) this.open(galleryKey);
        });
      });
    }

    open(galleryKey, startIndex = 0) {
      const data = galleryData[galleryKey];
      if (!data || !data.photos || data.photos.length === 0) return;

      this.currentGallery = data;
      this.photos = data.photos;
      this.currentIndex = Math.max(0, Math.min(startIndex, this.photos.length - 1));
      this.isOpen = true;

      if (this.titleEl) this.titleEl.textContent = data.title;

      this.renderDots();
      this.renderStack();
      this.updateUI();

      this.modal.classList.add('active');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.modal.classList.remove('active');
      this.modal.setAttribute('aria-hidden', 'true');

      if (!this.lightboxOpen) {
        document.body.style.overflow = '';
      }
    }

    renderDots() {
      if (!this.dotsEl) return;
      this.dotsEl.innerHTML = '';
      this.photos.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.className = `gallery-dot ${idx === this.currentIndex ? 'active' : ''}`;
        dot.setAttribute('data-index', idx);
        dot.setAttribute('aria-label', `Foto ${idx + 1}`);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.goToIndex(idx);
        });
        this.dotsEl.appendChild(dot);
      });
    }

    renderStack() {
      if (!this.stack) return;
      this.stack.innerHTML = '';

      const total = this.photos.length;

      // Render cards in order, layered by distance from current index
      for (let offset = total - 1; offset >= 0; offset--) {
        const photoIdx = (this.currentIndex + offset) % total;
        const photo = this.photos[photoIdx];

        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-photo-index', photoIdx);

        // Assign layer: 0 = front, 1 = middle, 2 = back, 3+ = deep
        const layer = offset === 0 ? '0' : offset === 1 ? '1' : offset === 2 ? '2' : 'deep';
        card.setAttribute('data-layer', layer);

        card.innerHTML = `
          <img src="${photo.src}" alt="${photo.caption}" draggable="false" loading="eager" />
          <div class="gallery-card-badge">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
            <span>Perbesar</span>
          </div>
          <div class="gallery-card-gradient"></div>
        `;

        // If front card, attach pointer interactions
        if (layer === '0') {
          this.attachCardInteractions(card);
        }

        this.stack.appendChild(card);
      }
    }

    updateLayers() {
      const cards = this.stack.querySelectorAll('.gallery-card');
      const total = this.photos.length;

      cards.forEach((card) => {
        const photoIdx = parseInt(card.getAttribute('data-photo-index'), 10);
        let offset = (photoIdx - this.currentIndex + total) % total;

        const layer = offset === 0 ? '0' : offset === 1 ? '1' : offset === 2 ? '2' : 'deep';
        card.setAttribute('data-layer', layer);
        card.style.transform = '';

        // Detach old pointer events and attach to new front card
        card.onpointerdown = null;
        if (layer === '0') {
          this.attachCardInteractions(card);
        }
      });
    }

    attachCardInteractions(card) {
      card.onpointerdown = (e) => this.handlePointerDown(e, card);
    }

    handlePointerDown(e, card) {
      if (this.isAnimating) return;
      if (e.button !== undefined && e.button !== 0) return; // primary click only

      this.isDragging = true;
      this.activeCard = card;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.currentDx = 0;
      this.currentDy = 0;
      this.startTime = Date.now();

      card.setPointerCapture(e.pointerId);
      card.classList.add('is-dragging');

      const onPointerMove = (moveEvent) => {
        if (!this.isDragging) return;
        this.currentDx = moveEvent.clientX - this.startX;
        this.currentDy = moveEvent.clientY - this.startY;

        const rot = Math.max(-22, Math.min(22, this.currentDx * 0.04));
        card.style.transform = `translate3d(${this.currentDx}px, ${this.currentDy * 0.25}px, 0) rotate(${rot}deg) scale(1)`;

        // Visual feedback for layer 1 peeking forward slightly during drag
        const nextLayerCard = this.stack.querySelector('.gallery-card[data-layer="1"]');
        if (nextLayerCard) {
          const progress = Math.min(Math.abs(this.currentDx) / 200, 1);
          const peekScale = 0.96 + 0.04 * progress;
          const peekY = 12 - 12 * progress;
          nextLayerCard.style.transform = `translate3d(0, ${peekY}px, 0) scale(${peekScale})`;
          nextLayerCard.style.opacity = 0.8 + 0.2 * progress;
        }
      };

      const onPointerUp = (upEvent) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        card.releasePointerCapture(upEvent.pointerId);
        card.classList.remove('is-dragging');

        card.removeEventListener('pointermove', onPointerMove);
        card.removeEventListener('pointerup', onPointerUp);
        card.removeEventListener('pointercancel', onPointerUp);

        // Reset middle card style
        const nextLayerCard = this.stack.querySelector('.gallery-card[data-layer="1"]');
        if (nextLayerCard) {
          nextLayerCard.style.transform = '';
          nextLayerCard.style.opacity = '';
        }

        const elapsed = Date.now() - this.startTime;
        const velocity = Math.abs(this.currentDx) / (elapsed || 1);

        // Tap without significant drag -> open fullscreen Lightbox!
        if (Math.abs(this.currentDx) < 6 && Math.abs(this.currentDy) < 6) {
          this.openLightbox(this.currentIndex);
          return;
        }

        // Swipe threshold checks: 50px or quick flick (velocity > 0.35)
        if (this.currentDx < -50 || (this.currentDx < -20 && velocity > 0.35)) {
          this.triggerSwipeOut(card, 'left');
        } else if (this.currentDx > 50 || (this.currentDx > 20 && velocity > 0.35)) {
          this.triggerSwipeOut(card, 'right');
        } else {
          // Snap back to center
          card.style.transform = '';
        }
      };

      card.addEventListener('pointermove', onPointerMove);
      card.addEventListener('pointerup', onPointerUp);
      card.addEventListener('pointercancel', onPointerUp);
    }

    triggerSwipeOut(card, direction) {
      if (this.isAnimating) return;
      this.isAnimating = true;

      card.classList.add(direction === 'left' ? 'swipe-out-left' : 'swipe-out-right');

      setTimeout(() => {
        card.classList.remove('swipe-out-left', 'swipe-out-right');
        card.style.transform = '';

        if (direction === 'left') {
          this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        } else {
          this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        }

        this.updateLayers();
        this.updateUI();
        this.isAnimating = false;
      }, 380);
    }

    nextCard() {
      if (this.isAnimating) return;
      const frontCard = this.stack.querySelector('.gallery-card[data-layer="0"]');
      if (frontCard) {
        this.triggerSwipeOut(frontCard, 'left');
      } else {
        this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        this.updateLayers();
        this.updateUI();
      }
    }

    prevCard() {
      if (this.isAnimating) return;
      const frontCard = this.stack.querySelector('.gallery-card[data-layer="0"]');
      if (frontCard) {
        this.triggerSwipeOut(frontCard, 'right');
      } else {
        this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        this.updateLayers();
        this.updateUI();
      }
    }

    goToIndex(targetIndex) {
      if (this.isAnimating || targetIndex === this.currentIndex) return;
      this.currentIndex = targetIndex;
      this.updateLayers();
      this.updateUI();
    }

    updateUI() {
      const currentPhoto = this.photos[this.currentIndex];
      if (!currentPhoto) return;

      // Update Caption with smooth transition
      if (this.captionEl) {
        this.captionEl.style.opacity = '0';
        this.captionEl.style.transform = 'translateY(4px)';
        setTimeout(() => {
          this.captionEl.textContent = currentPhoto.caption;
          this.captionEl.style.opacity = '1';
          this.captionEl.style.transform = 'translateY(0)';
        }, 120);
      }

      // Update Counter
      if (this.counterEl) {
        this.counterEl.textContent = `${this.currentIndex + 1} / ${this.photos.length}`;
      }

      // Update Dots
      if (this.dotsEl) {
        const dots = this.dotsEl.querySelectorAll('.gallery-dot');
        dots.forEach((dot, idx) => {
          if (idx === this.currentIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
    }

    // ── Fullscreen Lightbox Integration ──
    openLightbox(index) {
      if (this.lightboxOpen) return;
      this.lightboxOpen = true;
      this.currentIndex = index;

      this.updateLightboxContent();
      if (this.lightbox) {
        this.lightbox.classList.add('active');
        this.lightbox.setAttribute('aria-hidden', 'false');
      }
      document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
      if (!this.lightboxOpen) return;
      this.lightboxOpen = false;

      if (this.lightbox) {
        this.lightbox.classList.remove('active');
        this.lightbox.setAttribute('aria-hidden', 'true');
      }

      // Sync gallery card stack with any changes made inside lightbox
      this.updateLayers();
      this.updateUI();

      if (!this.isOpen) {
        document.body.style.overflow = '';
      }
    }

    updateLightboxContent() {
      const photo = this.photos[this.currentIndex];
      if (!photo || !this.lightboxImg) return;

      this.lightboxImg.style.opacity = '0';
      this.lightboxImg.style.transform = 'scale(0.92)';

      setTimeout(() => {
        this.lightboxImg.src = photo.src;
        this.lightboxImg.alt = photo.caption;
        if (this.lightboxCaption) this.lightboxCaption.textContent = photo.caption;
        if (this.lightboxCounter) {
          this.lightboxCounter.textContent = `${this.currentIndex + 1} / ${this.photos.length}`;
        }

        requestAnimationFrame(() => {
          this.lightboxImg.style.opacity = '1';
          this.lightboxImg.style.transform = 'scale(1)';
        });
      }, 140);
    }

    navigateLightbox(direction) {
      this.currentIndex = (this.currentIndex + direction + this.photos.length) % this.photos.length;
      this.updateLightboxContent();
      this.updateLayers();
      this.updateUI();
    }

    // ── Keyboard Shortcuts ──
    handleKeydown(e) {
      if (this.lightboxOpen) {
        if (e.key === 'Escape') this.closeLightbox();
        else if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
        else if (e.key === 'ArrowRight') this.navigateLightbox(1);
      } else if (this.isOpen) {
        if (e.key === 'Escape') this.close();
        else if (e.key === 'ArrowLeft') this.prevCard();
        else if (e.key === 'ArrowRight') this.nextCard();
        else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.openLightbox(this.currentIndex);
        }
      }
    }
  }

  // Instantiate universal GallerySwiper singleton
  window.gallerySwiperInstance = new GallerySwiper();
});

