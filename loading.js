/* ═══════════════════════════════════════════════
   LOADING SCREEN – Hydrogen (1) → Neon (10)
   ═══════════════════════════════════════════════ */

const ELEMENTS = [
  { z: 1,  symbol: "H",  name: "Hydrogen",  mass: "1.008"   },
  { z: 2,  symbol: "He", name: "Helium",    mass: "4.003"   },
  { z: 3,  symbol: "Li", name: "Lithium",   mass: "6.941"   },
  { z: 4,  symbol: "Be", name: "Beryllium", mass: "9.012"   },
  { z: 5,  symbol: "B",  name: "Boron",     mass: "10.81"   },
  { z: 6,  symbol: "C",  name: "Carbon",    mass: "12.01"   },
  { z: 7,  symbol: "N",  name: "Nitrogen",  mass: "14.01"   },
  { z: 8,  symbol: "O",  name: "Oxygen",    mass: "16.00"   },
  { z: 9,  symbol: "F",  name: "Fluorine",  mass: "19.00"   },
  { z: 10, symbol: "Ne", name: "Neon",      mass: "20.18"   },
];

(function initLoadingScreen() {
  const screen   = document.getElementById("loading-screen");
  const numEl    = document.getElementById("element-number");
  const symEl    = document.getElementById("element-symbol");
  const nameEl   = document.getElementById("element-name");
  const massEl   = document.getElementById("element-mass");
  const card     = document.getElementById("element-card");
  const barFill  = document.getElementById("loading-bar-fill");
  const curEl    = document.getElementById("loading-current");

  if (!screen) return;

  // Hide game UI during loading
  const topbar   = document.getElementById("topbar");
  const main     = document.getElementById("main");
  const bottombar = document.getElementById("bottombar");
  if (topbar) topbar.style.opacity = "0";
  if (main) main.style.opacity = "0";
  if (bottombar) bottombar.style.opacity = "0";

  let step = 0;
  let visualProgress = 0;
  const DELAY_SCALE = 0.5;
  const STEP_DELAY = 420 * DELAY_SCALE;     // base ms per element step
  const FINAL_HOLD = 900 * DELAY_SCALE;    // ms to hold on Neon before transition
  const FADE_DURATION = 800;  // ms for fade-out

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function nextProgressPercent(i) {
    const total = ELEMENTS.length;
    const base = ((i + 1) / total) * 100;
    if (i === total - 1) return 100;

    const phase = i / Math.max(1, total - 1); // 0..1 across loading
    const jitter = (Math.random() * 2 - 1) * (3.6 - phase * 1.6);
    const minBound = visualProgress + 2.5;
    const maxBound = Math.min(98, ((i + 1.35) / total) * 100);
    return clamp(base + jitter, minBound, maxBound);
  }

  function nextStepDelay(i) {
    const total = ELEMENTS.length;
    const phase = i / Math.max(1, total - 1); // 0..1 across loading
    const centerBoost = 1 - Math.pow(2 * phase - 1, 2); // faster near middle
    const curve = 0.82 + centerBoost * 0.55;
    const jitter = 0.82 + Math.random() * 0.42;
    return Math.round(STEP_DELAY * curve * jitter);
  }

  function showStep(i) {
    const el = ELEMENTS[i];
    numEl.textContent = el.z;
    symEl.textContent = el.symbol;
    nameEl.textContent = el.name;
    massEl.textContent = el.mass + " u";
    curEl.textContent = el.z;
    const progress = nextProgressPercent(i);
    visualProgress = progress;
    const transitionMs = Math.round((250 + Math.random() * 240) * DELAY_SCALE);
    const easing = i === ELEMENTS.length - 1
      ? "cubic-bezier(0.22, 1, 0.36, 1)"
      : "cubic-bezier(0.2, 0.95, 0.3, 1)";
    barFill.style.transition = "width " + transitionMs + "ms " + easing;
    barFill.style.width = progress + "%";

    // Pulse effect
    card.classList.remove("pulse", "neon-flash");
    void card.offsetWidth; // reflow
    if (i === ELEMENTS.length - 1) {
      card.classList.add("neon-flash");
    } else {
      card.classList.add("pulse");
    }
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    screen.classList.add("fade-out");
    if (topbar)    { topbar.style.transition = "opacity 0.5s ease"; topbar.style.opacity = "1"; }
    if (main)      { main.style.transition = "opacity 0.5s ease"; main.style.opacity = "1"; }
    if (bottombar) { bottombar.style.transition = "opacity 0.5s ease"; bottombar.style.opacity = "1"; }
    // Autoplay BGM after loading (user interaction unlocks audio policy)
    if (typeof audio !== "undefined" && audio.startBGM) audio.startBGM();
    setTimeout(() => { screen.remove(); }, FADE_DURATION + 100);
  }

  let dismissed = false;

  function advance() {
    if (dismissed) return;
    if (step < ELEMENTS.length) {
      const currentStep = step;
      showStep(currentStep);
      step++;
      const delay = step === ELEMENTS.length ? FINAL_HOLD : nextStepDelay(currentStep);
      setTimeout(advance, delay);
    } else {
      dismiss();
    }
  }

  // Skip on 3 rapid spacebar presses
  let spaceCount = 0;
  let spaceTimer = null;
  document.addEventListener("keydown", function onSkip(e) {
    if (dismissed) { document.removeEventListener("keydown", onSkip); return; }
    if (e.code !== "Space") return;
    e.preventDefault();
    spaceCount++;
    clearTimeout(spaceTimer);
    spaceTimer = setTimeout(() => { spaceCount = 0; }, 800);
    if (spaceCount >= 3) {
      document.removeEventListener("keydown", onSkip);
      dismiss();
    }
  });

  // Click anywhere on loading screen also counts as interaction (helps autoplay)
  screen.addEventListener("click", () => {});

  // Start after a brief initial pause
  setTimeout(advance, Math.round((250 + Math.random() * 220) * DELAY_SCALE));
})();
