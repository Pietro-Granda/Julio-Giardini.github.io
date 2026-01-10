(() => {
  // ------------------------------
  // Helpers
  // ------------------------------
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  function rafThrottle(fn) {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  }

  // ------------------------------
  // Mobile nav (existing behavior)
  // ------------------------------
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when clicking a link (mobile)
    navMenu.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("nav-link")) return;

      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  }

  // ------------------------------
  // Smooth scroll (button with data-scroll="#id")
  // ------------------------------
  document.addEventListener("click", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    const selector = el.getAttribute("data-scroll");
    if (!selector) return;

    const target = document.querySelector(selector);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ------------------------------
  // Premium: header on scroll (shrink + shadow)
  // ------------------------------
  const header = document.querySelector(".header");
  const onScrollHeader = rafThrottle(() => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  });
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  // ------------------------------
  // Premium: hero parallax
  // ------------------------------
  const heroBg = document.querySelector(".hero-bg");
  const onScrollParallax = rafThrottle(() => {
    if (!heroBg || prefersReducedMotion) return;
    const y = Math.min(40, window.scrollY * 0.08);
    heroBg.style.transform = `translate3d(0, ${y}px, 0) scale(1.06)`;
  });
  window.addEventListener("scroll", onScrollParallax, { passive: true });
  onScrollParallax();

  // ------------------------------
  // Premium: cursor glow (updates CSS vars)
  // ------------------------------
  const onMouseMove = rafThrottle((e) => {
    if (prefersReducedMotion) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty("--mx", `${x.toFixed(2)}%`);
    document.documentElement.style.setProperty("--my", `${y.toFixed(2)}%`);
  });
  window.addEventListener("mousemove", onMouseMove, { passive: true });

  // ------------------------------
  // Premium: reveal on scroll (no HTML changes)
  // ------------------------------
  const revealTargets = [
    ".section-head",
    ".card",
    ".service-card",
    ".gallery-item",
    ".info-card",
    ".cta-box",
    ".hero-content",
    ".media-card",
  ]
    .flatMap((sel) => Array.from(document.querySelectorAll(sel)));

  // Add reveal classes once
  for (const el of revealTargets) {
    el.classList.add("reveal");
    // add a slightly different motion for bigger blocks
    if (el.classList.contains("hero-content") || el.classList.contains("cta-box") || el.classList.contains("media-card")) {
      el.classList.add("reveal-pop");
    }
  }

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("reveal-in");
          io.unobserve(entry.target);
        }
      },
      { root: null, threshold: 0.12 }
    );

    for (const el of revealTargets) io.observe(el);
  } else {
    // Fallback: show everything
    for (const el of revealTargets) el.classList.add("reveal-in");
  }

  // ------------------------------
  // Premium: active nav link highlighting
  // ------------------------------
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sectionIds = navLinks
    .map((a) => {
      const href = a.getAttribute("href") || "";
      return href.startsWith("#") ? href.slice(1) : "";
    })
    .filter(Boolean);

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((el) => el instanceof HTMLElement);

  function setActive(id) {
    for (const a of navLinks) {
      const href = a.getAttribute("href") || "";
      a.classList.toggle("active", href === `#${id}`);
    }
  }

  if ("IntersectionObserver" in window && sections.length) {
    const sectionIO = new IntersectionObserver(
      (entries) => {
        // pick the most visible entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible) return;
        setActive(visible.target.id);
      },
      { root: null, threshold: [0.22, 0.35, 0.5] }
    );

    for (const s of sections) sectionIO.observe(s);
  }

  // ------------------------------
  // Gallery modal (existing behavior)
  // ------------------------------
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("modalImg");
  const modalClose = document.getElementById("modalClose");
  const gallery = document.getElementById("gallery");

  const isDialogSupported = modal instanceof HTMLDialogElement;

  function openModal(src) {
    if (!isDialogSupported || !(modalImg instanceof HTMLImageElement)) return;
    modalImg.src = src;
    modal.showModal();
  }

  function closeModal() {
    if (!isDialogSupported) return;
    modal.close();
  }

  if (gallery) {
    gallery.addEventListener("click", (e) => {
      const btn = e.target instanceof Element ? e.target.closest(".gallery-item") : null;
      if (!(btn instanceof HTMLButtonElement)) return;

      const src = btn.getAttribute("data-img");
      if (!src) return;

      openModal(src);
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (isDialogSupported) {
    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const clickedInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!clickedInside) closeModal();
    });

    modal.addEventListener("close", () => {
      if (modalImg instanceof HTMLImageElement) modalImg.src = "";
    });
  }

  // Close modal on ESC even for non-dialog fallback (safety)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isDialogSupported && modal?.open) closeModal();
  });

  // ------------------------------
  // Premium: inject floating "Call" CTA on mobile + back-to-top
  // ------------------------------
  function getPhoneHref() {
    // Try to read existing tel link from the page
    const tel = document.querySelector('a[href^="tel:"]');
    const href = tel?.getAttribute("href");
    return href && href.startsWith("tel:") ? href : "tel:+393807618120";
  }

  // Floating CTA (mobile)
  const floating = document.createElement("a");
  floating.className = "floating-cta";
  floating.href = getPhoneHref();
  floating.setAttribute("aria-label", "Chiama ora");
  floating.innerHTML = "📞 Chiama ora";
  document.body.appendChild(floating);

  // Back to top
  const backTop = document.createElement("button");
  backTop.className = "backtop";
  backTop.type = "button";
  backTop.setAttribute("aria-label", "Torna su");
  backTop.textContent = "↑";
  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
  document.body.appendChild(backTop);

  const onBackTop = rafThrottle(() => {
    backTop.classList.toggle("show", window.scrollY > 480);
  });
  window.addEventListener("scroll", onBackTop, { passive: true });
  onBackTop();

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get('name') || '';
        const email = formData.get('email') || '';
        const message = formData.get('message') || '';

        const subject =
            htmlLang === 'en'
                ? `Message from portfolio – ${name}`
                : `Messaggio dal portfolio – ${name}`;

        const bodyLines =
            htmlLang === 'en'
                ? [`Name: ${name}`, `Email: ${email}`, '', message]
                : [`Nome: ${name}`, `Email: ${email}`, '', message];

        const mailto =
            `mailto:boscaratopietro@gmail.com` +
            `?subject=${encodeURIComponent(subject)}` +
            `&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        window.location.href = mailto;

        if (contactFeedback) {
            contactFeedback.textContent =
                htmlLang === 'en'
                    ? 'Thank you! Your email app should open now. If it does not, you can write me directly at boscaratopietro@gmail.com 😊'
                    : 'Grazie! Il tuo programma di posta dovrebbe aprirsi ora. Se non si apre, puoi scrivermi direttamente a boscaratopietro@gmail.com 😊';
        }

        contactForm.reset();
    });
}

})();