// ============================================================
// LEVEL 3 — Introduce mass (gravity well)
// ============================================================
// Rod: Yellow | Trail: Orange
// Open center with scattered pillars. Mass can redirect trajectory.
// Cat spawns top-center, rod at bottom-center.

defineLevel("lvl3", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                           /
    /                           /
    /     AA        AA          /
    /     AA        AA          /
    /                           /
    /          AA               /
    /          AA       AA      /
    /                   AA      /
    /   AA                      /
    /   AA       AA             /
    /            AA          AA /
    /                        AA /
    /      AA                   /
    /      AA       AA          /
    /               AA          /
    /                           /
    /                           /
    ///////////////////////////////
  `);

  wallsFromAscii(level, map, {
    origin: LEVEL_GRID.origin,
    cell: LEVEL_GRID.cell,
    legend: legendWith()
  });
});
