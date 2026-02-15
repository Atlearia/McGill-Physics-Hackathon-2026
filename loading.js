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
  const STEP_DELAY = 420;     // ms per element step
  const FINAL_HOLD = 900;    // ms to hold on Neon before transition
  const FADE_DURATION = 800;  // ms for fade-out

  function showStep(i) {
    const el = ELEMENTS[i];
    numEl.textContent = el.z;
    symEl.textContent = el.symbol;
    nameEl.textContent = el.name;
    massEl.textContent = el.mass + " u";
    curEl.textContent = el.z;
    barFill.style.width = (el.z * 10) + "%";

    // Pulse effect
    card.classList.remove("pulse", "neon-flash");
    void card.offsetWidth; // reflow
    if (i === ELEMENTS.length - 1) {
      card.classList.add("neon-flash");
    } else {
      card.classList.add("pulse");
    }
  }

  function advance() {
    if (step < ELEMENTS.length) {
      showStep(step);
      step++;
      const delay = step === ELEMENTS.length ? FINAL_HOLD : STEP_DELAY;
      setTimeout(advance, delay);
    } else {
      // Transition out
      screen.classList.add("fade-out");

      // Fade in the game UI
      if (topbar)    { topbar.style.transition = "opacity 0.5s ease"; topbar.style.opacity = "1"; }
      if (main)      { main.style.transition = "opacity 0.5s ease"; main.style.opacity = "1"; }
      if (bottombar) { bottombar.style.transition = "opacity 0.5s ease"; bottombar.style.opacity = "1"; }

      setTimeout(() => {
        screen.remove();
      }, FADE_DURATION + 100);
    }
  }

  // Start after a brief initial pause
  setTimeout(advance, 350);
})();
