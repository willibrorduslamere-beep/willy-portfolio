/* ========== PARTICLE / GRID ANIMATION ========== */
document.addEventListener('DOMContentLoaded', () => {
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
  // ── ID Card Draggable + Spring Physics ──
  // ══════════════════════════════════════════════
  const idCard = document.getElementById('id-card');
  const lanyardCanvas = document.getElementById('lanyard-canvas');
  const lanyardCtx = lanyardCanvas ? lanyardCanvas.getContext('2d') : null;

  if (idCard && lanyardCtx) {
    // Physics state
    let cardX = 0;       // current displacement X
    let cardY = 0;       // current displacement Y
    let velocityX = 0;
    let velocityY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Spring constants
    const SPRING = 0.08;      // spring stiffness
    const DAMPING = 0.85;     // how fast it settles (lower = faster)
    const MASS = 1;

    // ── Draw the elastic lanyard string ──
    function drawLanyard() {
      const w = lanyardCanvas.width;
      const h = lanyardCanvas.height;
      lanyardCtx.clearRect(0, 0, w, h);

      // Pin point (top center)
      const pinX = w / 2;
      const pinY = 2;
      // Card attach point (bottom center, offset by card displacement)
      const attachX = w / 2 + cardX * 0.6;
      const attachY = h - 2 + Math.min(cardY * 0.3, 40);

      // Control points for bezier — create a nice curve
      const cp1x = pinX + cardX * 0.15;
      const cp1y = h * 0.35 + cardY * 0.15;
      const cp2x = attachX - cardX * 0.1;
      const cp2y = h * 0.65 + cardY * 0.1;

      // Draw string shadow
      lanyardCtx.beginPath();
      lanyardCtx.moveTo(pinX, pinY);
      lanyardCtx.bezierCurveTo(cp1x + 1, cp1y + 1, cp2x + 1, cp2y + 1, attachX + 1, attachY + 1);
      lanyardCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      lanyardCtx.lineWidth = 3;
      lanyardCtx.stroke();

      // Draw main string
      lanyardCtx.beginPath();
      lanyardCtx.moveTo(pinX, pinY);
      lanyardCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, attachX, attachY);
      lanyardCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      lanyardCtx.lineWidth = 2;
      lanyardCtx.stroke();

      // Highlight on string
      lanyardCtx.beginPath();
      lanyardCtx.moveTo(pinX, pinY);
      lanyardCtx.bezierCurveTo(cp1x - 0.5, cp1y - 0.5, cp2x - 0.5, cp2y - 0.5, attachX - 0.5, attachY - 0.5);
      lanyardCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      lanyardCtx.lineWidth = 1;
      lanyardCtx.stroke();
    }

    // ── Physics animation loop ──
    function physicsLoop() {
      if (!isDragging) {
        // Spring force pulls back to origin (0, 0)
        const forceX = -SPRING * cardX;
        const forceY = -SPRING * cardY;

        velocityX = (velocityX + forceX / MASS) * DAMPING;
        velocityY = (velocityY + forceY / MASS) * DAMPING;

        cardX += velocityX;
        cardY += velocityY;

        // Stop tiny oscillations
        if (Math.abs(cardX) < 0.1 && Math.abs(velocityX) < 0.1) {
          cardX = 0; velocityX = 0;
        }
        if (Math.abs(cardY) < 0.1 && Math.abs(velocityY) < 0.1) {
          cardY = 0; velocityY = 0;
        }
      }

      // Apply transform to card
      const rotation = cardX * 0.08; // slight rotation based on X offset
      idCard.style.transform = `translate(${cardX}px, ${cardY}px) rotate(${rotation}deg)`;

      // Draw the string
      drawLanyard();

      requestAnimationFrame(physicsLoop);
    }

    // ── Mouse events ──
    idCard.addEventListener('mousedown', (e) => {
      isDragging = true;
      idCard.classList.add('dragging');
      idCard.style.animation = 'none'; // stop initial swing
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
      // Rubber band: resistance increases with distance
      const maxDist = 200;
      cardX = dragOffsetX + dx * (1 - Math.abs(dx) / (maxDist * 3));
      cardY = dragOffsetY + dy * (1 - Math.abs(dy) / (maxDist * 3));
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        idCard.classList.remove('dragging');
      }
    });

    // ── Touch events for mobile ──
    idCard.addEventListener('touchstart', (e) => {
      isDragging = true;
      idCard.classList.add('dragging');
      idCard.style.animation = 'none';
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
      const maxDist = 200;
      cardX = dragOffsetX + dx * (1 - Math.abs(dx) / (maxDist * 3));
      cardY = dragOffsetY + dy * (1 - Math.abs(dy) / (maxDist * 3));
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        idCard.classList.remove('dragging');
      }
    });

    // Start physics
    drawLanyard();
    physicsLoop();
  }

  // ── Navbar Scroll Effect + Parallax ──
  const navbar = document.querySelector('.navbar');
  const parallaxElements = document.querySelectorAll('[data-parallax-speed]');

  // Collect all animatable elements for scroll-based motion
  const motionElements = document.querySelectorAll(
    '.tool-card, .ai-skill-card, .other-skill-card, .social-card, .map-container, .timeline-map, .creator-badge, .origin-text, .id-card-system'
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
});
