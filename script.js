/* ═══════════════════════════════════════════════════════════════════
   WILLY LAMERE — CREATIVE PORTFOLIO CORE JAVASCRIPT
   Lenis Smooth Scroll, Dynamic Section Theming, 3D Tilt & Modals
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. INITIALIZE LUCIDE ICONS ──
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // ── 2. LENIS SMOOTH SCROLLING ──
  let lenis = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ── 3. PRELOADER CONTROLLER (Max 1.5s, Auto Dismiss, Clean Progress) ──
  const preloader = document.getElementById('preloader');
  const preloaderCounter = document.getElementById('preloader-counter');
  const preloaderBar = document.getElementById('preloader-progress-bar');

  if (preloader) {
    let isDismissed = false;

    function dismissPreloader() {
      if (isDismissed) return;
      isDismissed = true;
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    }

    if (prefersReducedMotion) {
      dismissPreloader();
    } else {
      const startTime = performance.now();
      const totalDuration = 1100; // smooth 1.1s progress animation

      function updateProgress(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        
        if (preloaderCounter) preloaderCounter.textContent = `${progress}%`;
        if (preloaderBar) preloaderBar.style.width = `${progress}%`;

        if (progress < 100) {
          requestAnimationFrame(updateProgress);
        } else {
          setTimeout(dismissPreloader, 200);
        }
      }

      requestAnimationFrame(updateProgress);

      // Hard safeguard: auto dismiss within 1.5s max
      setTimeout(dismissPreloader, 1500);
    }
  }

  // ── 4. CUSTOM CURSOR (DESKTOP FINE-POINTER ONLY) ──
  const cursor = document.getElementById('custom-cursor');
  const follower = document.getElementById('custom-cursor-follower');

  if (cursor && follower && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = -100;
    let mouseY = -100;
    let followerX = -100;
    let followerY = -100;
    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      if (!isVisible) {
        isVisible = true;
        cursor.classList.add('visible');
        follower.classList.add('visible');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isVisible = false;
      cursor.classList.remove('visible');
      follower.classList.remove('visible');
    });

    document.addEventListener('mouseenter', () => {
      isVisible = true;
      cursor.classList.add('visible');
      follower.classList.add('visible');
    });

    function renderCursorFollower() {
      followerX += (mouseX - followerX) * 0.18;
      followerY += (mouseY - followerY) * 0.18;
      follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
      requestAnimationFrame(renderCursorFollower);
    }
    requestAnimationFrame(renderCursorFollower);

    // Interactive Hover Expansion
    const hoverTargets = 'a, button, [role="button"], .poster-frame, .bento-card, .social-card, input, select';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        cursor.classList.add('active');
        follower.classList.add('active');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        cursor.classList.remove('active');
        follower.classList.remove('active');
      }
    });
  }

  // ── 5. THEME SWITCHER (DARK / LIGHT MODE - 60-30-10) ──
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('willy-portfolio-theme') || 'dark';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('willy-portfolio-theme', theme);
    
    // Update theme icon
    const iconEl = document.getElementById('theme-icon');
    if (iconEl && window.lucide) {
      iconEl.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      window.lucide.createIcons();
    }
  }

  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(current);
    });
  }

  // ── 6. DYNAMIC ACTIVE NAV HIGHLIGHT ON SCROLL ──
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    threshold: 0.35
  });

  sections.forEach(sec => navObserver.observe(sec));

  // ── 7. NAVBAR SCROLL SHRINK EFFECT ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── 8. MOBILE HAMBURGER MENU ──
  const hamburger = document.getElementById('nav-hamburger');
  const navMenu = document.getElementById('nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }

  // ── 9. SMOOTH ANCHOR NAVIGATION ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -30 });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // ── 10. BACK TO TOP BUTTON ──
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ── 11. 3D TILT EFFECT ON HOVER (POSTER FRAMES) ──
  if (!prefersReducedMotion && !window.matchMedia('(pointer: coarse)').matches) {
    const tiltElements = document.querySelectorAll('.tilt-element');

    tiltElements.forEach(el => {
      const maxTilt = parseFloat(el.getAttribute('data-tilt-max')) || 7;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((centerY - y) / centerY) * maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // ── 12. COUNT-UP METRICS ANIMATION ──
  const countUpElements = document.querySelectorAll('.count-up');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10) || 0;
        let start = 0;
        const duration = 1500;
        const stepTime = 30;
        const totalSteps = duration / stepTime;
        const increment = target / totalSteps;

        const timer = setInterval(() => {
          start += increment;
          if (start >= target) {
            el.textContent = `${target}+`;
            clearInterval(timer);
          } else {
            el.textContent = Math.floor(start);
          }
        }, stepTime);

        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  countUpElements.forEach(el => countObserver.observe(el));

  // ── 13. EDUCATION TIMELINE PROGRESS LINE ──
  const timelineProgress = document.getElementById('timeline-line-progress');
  const educationSection = document.getElementById('education');

  if (timelineProgress && educationSection) {
    window.addEventListener('scroll', () => {
      const rect = educationSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const totalHeight = rect.height;
        const visibleScrolled = windowHeight - rect.top;
        const progress = Math.max(0, Math.min(100, (visibleScrolled / (totalHeight + windowHeight * 0.3)) * 100));
        timelineProgress.style.height = `${progress}%`;
      }
    }, { passive: true });
  }

  // ── 14. POSTER LIGHTBOX SYSTEM ──
  const posterData = [
    {
      src: 'poster-1-canon.jpg',
      webp: 'assets/posters/poster-1-canon-1080w.webp',
      fallback: 'assets/posters/poster-1-canon.jpg',
      title: 'Poster #01 · Canon Capture Vision / Iso Raw',
      caption: 'Visual fotografis & film strip. Canon EOS 5Ds R, 50.6 MP detail.'
    },
    {
      src: 'poster-2-whatever.jpg',
      webp: 'assets/posters/poster-2-whatever-1080w.webp',
      fallback: 'assets/posters/poster-2-whatever.jpg',
      title: 'Poster #02 · Do Whatever',
      caption: 'Eksplorasi AI Creative, generative artwork & laptop melayang.'
    },
    {
      src: 'poster-3-order.jpg',
      webp: 'assets/posters/poster-3-order-1080w.webp',
      fallback: 'assets/posters/poster-3-order.jpg',
      title: 'Poster #03 · Order Sekarang',
      caption: 'Layanan pengerjaan tugas Word & PowerPoint kilat & rapi.'
    },
    {
      src: 'poster-4-style.jpg',
      webp: 'assets/posters/poster-4-style-1080w.webp',
      fallback: 'assets/posters/poster-4-style.jpg',
      title: 'Poster #04 · Keep Your Style',
      caption: 'Streetwear culture, boombox vintage, dan kolaborasi kreatif.'
    },
    {
      src: 'poster-5-vibe.jpg',
      webp: 'assets/posters/poster-5-vibe-1080w.webp',
      fallback: 'assets/posters/poster-5-vibe.jpg',
      title: 'Poster #05 · On Your Vibe',
      caption: '“Need to be better and believe in myself.” Creator mindset.'
    },
    {
      src: 'poster-6-willy.jpg',
      webp: 'assets/posters/poster-6-willy-1080w.webp',
      fallback: 'assets/posters/poster-6-willy.jpg',
      title: 'Poster #06 · Willy Lamere Identity',
      caption: 'Tipografi raksasa latar olive. Profil & visi sang kreator.'
    },
    {
      src: 'poster-7-hello.jpg',
      webp: 'assets/posters/poster-7-hello-1080w.webp',
      fallback: 'assets/posters/poster-7-hello.jpg',
      title: 'Poster #07 · Hello Willy',
      caption: 'Hello, I am Willy, I can do anything. Sudut pandang melalui kacamata.'
    }
  ];

  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let currentPosterIndex = 0;

  function openLightbox(index) {
    currentPosterIndex = (index + posterData.length) % posterData.length;
    const item = posterData[currentPosterIndex];
    if (!item) return;

    lightboxImg.onerror = function() {
      if (this.src.indexOf('.webp') !== -1) {
        this.src = item.src;
      } else if (this.src.indexOf('assets/posters') === -1) {
        this.src = item.fallback;
      }
    };

    lightboxImg.src = item.webp || item.src;
    lightboxImg.alt = item.title;
    lightboxCaption.innerHTML = `<strong>${item.title}</strong><br />${item.caption} (${currentPosterIndex + 1} / ${posterData.length})`;
    
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeLightbox() {
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  document.querySelectorAll('[data-poster-index]').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-poster-index'), 10);
      if (!isNaN(idx)) openLightbox(idx);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = parseInt(card.getAttribute('data-poster-index'), 10);
        if (!isNaN(idx)) openLightbox(idx);
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => openLightbox(currentPosterIndex - 1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => openLightbox(currentPosterIndex + 1));

  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  // ── 15. SCHOOL PHOTO GALLERY MODAL ──
  const schoolGalleryData = {
    sdInpres: {
      title: 'SD Negeri Inpres Sifnana',
      photos: [
        { src: 'foto-1.jpg', caption: 'Kegiatan Belajar di Kelas' },
        { src: 'foto-2.jpg', caption: 'Perayaan di Sekolah' },
        { src: 'foto-3.jpg', caption: 'Kunjungan ke Kantor Desa' },
        { src: 'foto-4.jpg', caption: 'Pertemuan dengan Pejabat' },
        { src: 'foto-5.jpg', caption: 'Foto Bersama Siswa' }
      ]
    },
    sma: {
      title: 'SMA Negeri 10 Tanimbar Selatan',
      photos: [
        { src: 'sma-foto-1.jpg', caption: 'Kenangan Masa Sekolah di SMAN 10' },
        { src: 'sma-foto-2.jpg', caption: 'Kebersamaan & Sahabat Putih Abu-Abu' },
        { src: 'sma-foto-3.jpg', caption: 'Aktivitas & Kebersamaan Siswa' },
        { src: 'sma-foto-4.jpg', caption: 'Semangat Merah Putih SMAN 10' },
        { src: 'sma-foto-5.jpg', caption: 'Keluarga Besar SMAN 10 Tanimbar Selatan' }
      ]
    },
    itats: {
      title: 'Institut Teknologi Adhi Tama Surabaya (ITATS)',
      photos: [
        { src: 'itats-foto-1.jpg', caption: 'Foto Bersama HMTP Mining Engineering' },
        { src: 'itats-foto-2.jpg', caption: 'Bravo Tambang!' },
        { src: 'itats-foto-3.jpg', caption: 'Kebersamaan Mahasiswa Pertambangan' },
        { src: 'itats-foto-4.jpg', caption: 'Semangat Juang Mahasiswa Teknik' },
        { src: 'itats-foto-5.jpg', caption: 'Kibarkan Bendera HMTP ITATS' }
      ]
    }
  };

  const schoolModal = document.getElementById('school-modal');
  const schoolModalTitle = document.getElementById('school-modal-title');
  const schoolModalClose = document.getElementById('school-modal-close');
  const schoolPhotoImg = document.getElementById('school-photo-img');
  const schoolPhotoCaption = document.getElementById('school-photo-caption');
  const schoolCounter = document.getElementById('school-counter');
  const schoolPrevBtn = document.getElementById('school-prev-btn');
  const schoolNextBtn = document.getElementById('school-next-btn');

  let currentSchoolKey = 'sdInpres';
  let currentSchoolPhotoIdx = 0;

  function renderSchoolPhoto() {
    const group = schoolGalleryData[currentSchoolKey];
    if (!group || !group.photos.length) return;

    const photo = group.photos[currentSchoolPhotoIdx];
    schoolModalTitle.textContent = group.title;
    schoolPhotoImg.src = photo.src;
    schoolPhotoImg.alt = photo.caption;
    schoolPhotoCaption.textContent = photo.caption;
    schoolCounter.textContent = `${currentSchoolPhotoIdx + 1} / ${group.photos.length}`;
  }

  function openSchoolGallery(key) {
    if (!schoolGalleryData[key]) return;
    currentSchoolKey = key;
    currentSchoolPhotoIdx = 0;
    renderSchoolPhoto();
    schoolModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeSchoolGallery() {
    schoolModal.classList.remove('active');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  document.querySelectorAll('[data-school-gallery]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-school-gallery');
      openSchoolGallery(key);
    });
  });

  if (schoolModalClose) schoolModalClose.addEventListener('click', closeSchoolGallery);
  if (schoolPrevBtn) {
    schoolPrevBtn.addEventListener('click', () => {
      const photos = schoolGalleryData[currentSchoolKey].photos;
      currentSchoolPhotoIdx = (currentSchoolPhotoIdx - 1 + photos.length) % photos.length;
      renderSchoolPhoto();
    });
  }
  if (schoolNextBtn) {
    schoolNextBtn.addEventListener('click', () => {
      const photos = schoolGalleryData[currentSchoolKey].photos;
      currentSchoolPhotoIdx = (currentSchoolPhotoIdx + 1) % photos.length;
      renderSchoolPhoto();
    });
  }

  schoolModal?.addEventListener('click', (e) => {
    if (e.target === schoolModal) closeSchoolGallery();
  });

  // ── 16. GLOBAL KEYBOARD NAVIGATION FOR MODALS ──
  window.addEventListener('keydown', (e) => {
    // If Lightbox is active
    if (lightboxModal?.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(currentPosterIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(currentPosterIndex + 1);
    }
    // If School Gallery is active
    if (schoolModal?.classList.contains('active')) {
      if (e.key === 'Escape') closeSchoolGallery();
      const photos = schoolGalleryData[currentSchoolKey].photos;
      if (e.key === 'ArrowLeft') {
        currentSchoolPhotoIdx = (currentSchoolPhotoIdx - 1 + photos.length) % photos.length;
        renderSchoolPhoto();
      }
      if (e.key === 'ArrowRight') {
        currentSchoolPhotoIdx = (currentSchoolPhotoIdx + 1) % photos.length;
        renderSchoolPhoto();
      }
    }
  });

  // ── 17. TOUCH SWIPE GESTURES FOR LIGHTBOX ──
  let touchStartX = 0;
  let touchEndX = 0;

  lightboxModal?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightboxModal?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        openLightbox(currentPosterIndex - 1);
      } else {
        openLightbox(currentPosterIndex + 1);
      }
    }
  }, { passive: true });

});
