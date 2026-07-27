(() => {
  "use strict";

  /* ===== Loader ===== */
  const loader = document.getElementById("loader");
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("done"), 500);
  });

  /* ===== Wako-style tower clock ===== */
  (() => {
    const ticksGroup = document.getElementById("clockTicks");
    const numeralsGroup = document.getElementById("clockNumerals");
    if (!ticksGroup || !numeralsGroup) return;

    const SVG_NS = "http://www.w3.org/2000/svg";
    const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

    for (let i = 0; i < 60; i++) {
      const angle = i * 6;
      const major = i % 5 === 0;
      const rInner = major ? 71 : 79;
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", "100");
      line.setAttribute("y1", String(100 - 87));
      line.setAttribute("x2", "100");
      line.setAttribute("y2", String(100 - rInner));
      line.setAttribute("class", "clock-tick" + (major ? " major" : ""));
      line.setAttribute("transform", `rotate(${angle} 100 100)`);
      ticksGroup.appendChild(line);
    }

    ROMAN.forEach((numeral, i) => {
      const angle = ((i * 30) - 90) * (Math.PI / 180);
      const x = 100 + Math.cos(angle) * 62;
      const y = 100 + Math.sin(angle) * 62;
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", String(x));
      text.setAttribute("y", String(y));
      text.setAttribute("class", "clock-numeral");
      text.textContent = numeral;
      numeralsGroup.appendChild(text);
    });

    const hourHand = document.getElementById("clockHour");
    const minuteHand = document.getElementById("clockMinute");
    const secondHand = document.getElementById("clockSecond");

    function tick() {
      const now = new Date();
      const h = now.getHours() % 12;
      const m = now.getMinutes();
      const s = now.getSeconds();
      hourHand.style.transform = `rotate(${h * 30 + m * 0.5}deg)`;
      minuteHand.style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
      secondHand.style.transform = `rotate(${s * 6}deg)`;
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ===== Cursor dot ===== */
  const cursorDot = document.getElementById("cursorDot");
  let cx = 0, cy = 0, dx = 0, dy = 0;
  if (cursorDot) {
    window.addEventListener("mousemove", (e) => {
      cx = e.clientX; cy = e.clientY;
      cursorDot.classList.add("active");
    });
    (function loop() {
      dx += (cx - dx) * 0.18;
      dy += (cy - dy) * 0.18;
      cursorDot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a, button, .tool-card").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorDot.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursorDot.classList.remove("hover"));
    });
  }

  /* ===== Progress bar + header scroll state ===== */
  const progressBar = document.getElementById("progressBar");
  const header = document.getElementById("header");
  function onScroll() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + "%";
    header.classList.toggle("scrolled", scrolled > 40);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ===== Mobile nav ===== */
  const burger = document.getElementById("burger");
  const mobileNav = document.getElementById("mobileNav");
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    mobileNav.classList.toggle("open");
  });
  mobileNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("open");
      mobileNav.classList.remove("open");
    })
  );

  /* ===== Scroll reveal ===== */
  const revealEls = document.querySelectorAll(".reveal, .reveal-line");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));

  /* ===== Stat counters ===== */
  const statEls = document.querySelectorAll(".stat-num[data-count]");
  const statIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const start = performance.now();
        const duration = 1400;
        function tick(now) {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        statIo.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  statEls.forEach((el) => statIo.observe(el));

  /* ===== Canvas: soft watercolor pigment drifting ===== */
  const canvas = document.getElementById("ginzaCanvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let vw, vh;

  function resize() {
    vw = canvas.width = window.innerWidth;
    vh = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function makeParticle() {
    return {
      x: Math.random() * vw,
      y: vh + Math.random() * 200,
      r: 18 + Math.random() * 46,
      speed: 0.06 + Math.random() * 0.16,
      drift: (Math.random() - 0.5) * 0.15,
      alpha: 0.04 + Math.random() * 0.07,
      hue: (() => {
        const r = Math.random();
        if (r > 0.66) return "198,123,118";
        if (r > 0.33) return "127,168,150";
        return "201,146,74";
      })(),
    };
  }
  const COUNT = Math.min(22, Math.floor((window.innerWidth * window.innerHeight) / 90000));
  for (let i = 0; i < COUNT; i++) {
    const p = makeParticle();
    p.y = Math.random() * vh;
    particles.push(p);
  }

  let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsBlur = "filter" in ctx;
  if (supportsBlur) ctx.filter = "blur(18px)";

  function draw() {
    ctx.clearRect(0, 0, vw, vh);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (!reduceMotion) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) {
          Object.assign(p, makeParticle());
          p.y = vh + 10;
        }
      }
    });
    requestAnimationFrame(draw);
  }
  draw();

  /* ===== Generic modal wiring ===== */
  document.querySelectorAll("[data-modal]").forEach((card) => {
    card.addEventListener("click", () => {
      const overlay = document.getElementById("modal-" + card.dataset.modal);
      if (overlay) overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.querySelector("[data-close]").addEventListener("click", () => closeModal(overlay));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
  function closeModal(overlay) {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.open").forEach(closeModal);
    }
  });

  /* ===== Copy buttons ===== */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    const target = document.querySelector(btn.dataset.copy);
    if (!target) return;
    navigator.clipboard
      .writeText(target.value || target.textContent)
      .then(() => {
        const original = btn.textContent;
        btn.textContent = "コピーしました";
        setTimeout(() => (btn.textContent = original), 1600);
      })
      .catch(() => {});
  });
})();
