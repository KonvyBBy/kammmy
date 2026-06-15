/**
 * Crafting system — recipe definitions and 3×3 crafting UI
 */

/* ── Recipe definitions ─────────────────────────────────────────────────── */

/**
 * A shaped recipe is a 3×3 grid (rows top→bottom, cols left→right).
 * Use 0 for empty. The pattern is matched anywhere in the 3×3 grid.
 * A shapeless recipe is an unordered set of ingredients.
 */
const RECIPES = (() => {
  const B = BlockType;

  // Helper: make a shaped recipe
  const shaped = (grid, out, outCount = 1, name = '') => ({
    type: 'shaped', grid, out, outCount, name,
  });
  // Helper: make a shapeless recipe
  const shapeless = (items, out, outCount = 1, name = '') => ({
    type: 'shapeless', items, out, outCount, name,
  });

  return [
    /* ── Wood & basics ─────────────────────────────────────────── */
    shapeless([B.OAK_LOG],    B.OAK_PLANKS,  4, 'Oak Planks'),
    shapeless([B.SPRUCE_LOG], B.SPRUCE_PLANKS, 4, 'Spruce Planks'),

    shaped([
      [B.OAK_PLANKS, B.OAK_PLANKS, 0],
      [B.OAK_PLANKS, B.OAK_PLANKS, 0],
      [0, 0, 0],
    ], B.CRAFTING_TABLE, 1, 'Crafting Table'),

    shaped([
      [B.SAND, B.SAND, 0],
      [B.SAND, B.SAND, 0],
      [0, 0, 0],
    ], B.SANDSTONE, 4, 'Sandstone'),

    shaped([
      [B.OAK_PLANKS, B.OAK_PLANKS, B.OAK_PLANKS],
      [B.OAK_PLANKS, 0,            B.OAK_PLANKS],
      [B.OAK_PLANKS, B.OAK_PLANKS, B.OAK_PLANKS],
    ], B.MOSSY_COBBLE, 8, 'Chest (Mossy)'),

    /* ── Stone ─────────────────────────────────────────────────── */
    shaped([
      [B.COBBLESTONE, B.COBBLESTONE, B.COBBLESTONE],
      [B.COBBLESTONE, 0,             B.COBBLESTONE],
      [B.COBBLESTONE, B.COBBLESTONE, B.COBBLESTONE],
    ], B.STONE, 8, 'Stone Bricks'),

    /* ── Blocks ─────────────────────────────────────────────────── */
    shaped([
      [B.OAK_PLANKS, B.OAK_PLANKS, B.OAK_PLANKS],
      [B.OAK_PLANKS, B.OAK_PLANKS, B.OAK_PLANKS],
      [0, 0, 0],
    ], B.BOOKSHELF, 1, 'Bookshelf'),

    shaped([
      [B.SAND,   B.GRAVEL, B.SAND],
      [B.GRAVEL, B.SAND,   B.GRAVEL],
      [B.SAND,   B.GRAVEL, B.SAND],
    ], B.TNT, 1, 'TNT'),

    shapeless([B.WOOL_WHITE, B.GRAVEL], B.WOOL_BLUE,  1, 'Blue Wool'),
    shapeless([B.WOOL_WHITE, B.SAND],   B.WOOL_RED,   1, 'Red Wool'),
    shapeless([B.WOOL_WHITE, B.OAK_LEAVES], B.WOOL_GREEN, 1, 'Green Wool'),

    /* ── Pumpkin ─────────────────────────────────────────────────── */
    shaped([
      [B.OAK_PLANKS, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ], B.PUMPKIN, 1, 'Pumpkin Block'),

    /* ── Glass ─────────────────────────────────────────────────── */
    shaped([
      [B.SAND, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ], B.GLASS, 1, 'Glass'),

    /* ── Ice ─────────────────────────────────────────────────────── */
    shaped([
      [B.SNOW_BLOCK, B.SNOW_BLOCK, 0],
      [B.SNOW_BLOCK, B.SNOW_BLOCK, 0],
      [0, 0, 0],
    ], B.ICE, 2, 'Ice'),

    /* ── Obsidian ──────────────────────────────────────────────── */
    shaped([
      [B.COBBLESTONE, B.COBBLESTONE, B.COBBLESTONE],
      [B.COBBLESTONE, B.DIAMOND_ORE, B.COBBLESTONE],
      [B.COBBLESTONE, B.COBBLESTONE, B.COBBLESTONE],
    ], B.OBSIDIAN, 1, 'Obsidian'),

    /* ── Glowstone ─────────────────────────────────────────────── */
    shaped([
      [B.GOLD_ORE, B.GOLD_ORE, 0],
      [B.GOLD_ORE, B.GOLD_ORE, 0],
      [0, 0, 0],
    ], B.GLOWSTONE, 4, 'Glowstone'),
  ];
})();

/* ── Pattern matching helpers ───────────────────────────────────────────── */

/**
 * Given a 3×3 flat array (9 values, 0=air), try to match it against
 * a shaped recipe and return the recipe, or null.
 */
function matchShaped(grid, recipe) {
  // Build bounding box of grid pattern
  function bounds(g) {
    let minR = 3, maxR = -1, minC = 3, maxC = -1;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (g[r][c]) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
    }
    return { minR, maxR, minC, maxC };
  }

  // Convert flat grid to 2D
  const g = [[grid[0],grid[1],grid[2]],[grid[3],grid[4],grid[5]],[grid[6],grid[7],grid[8]]];
  const r = recipe.grid;

  const gb = bounds(g);
  const rb = bounds(r);

  if (gb.minR > gb.maxR && rb.minR > rb.maxR) return true; // both empty

  const gH = gb.maxR - gb.minR + 1;
  const gW = gb.maxC - gb.minC + 1;
  const rH = rb.maxR - rb.minR + 1;
  const rW = rb.maxC - rb.minC + 1;
  if (gH !== rH || gW !== rW) return false;

  for (let dr = 0; dr < rH; dr++) {
    for (let dc = 0; dc < rW; dc++) {
      if ((g[gb.minR + dr][gb.minC + dc] || 0) !== (r[rb.minR + dr][rb.minC + dc] || 0)) return false;
    }
  }
  return true;
}

/**
 * Given a flat 9-element grid array and the current RECIPES list,
 * return the matching recipe or null.
 */
function findRecipe(grid) {
  for (const recipe of RECIPES) {
    if (recipe.type === 'shaped') {
      if (matchShaped(grid, recipe)) return recipe;
    } else {
      // Shapeless: collect non-zero items in grid
      const have  = grid.filter(x => x).sort();
      const need  = recipe.items.slice().sort();
      if (have.length === need.length && have.every((v, i) => v === need[i])) return recipe;
    }
  }
  return null;
}

/* ── CraftingUI ─────────────────────────────────────────────────────────── */

class CraftingUI {
  constructor(inventory, atlasCanvas) {
    this.inventory   = inventory;
    this.atlas       = atlasCanvas;
    this.open        = false;
    this._grid       = Array(9).fill(0);   // 3×3 crafting grid (block IDs)
    this._gridCounts = Array(9).fill(0);   // counts placed in grid
    this._result     = null;               // {id, count} or null
    this._selected   = null;              // {id, count} picked up by mouse

    this._el = document.getElementById('crafting-overlay');
    this._bindUI();
  }

  toggle() {
    this.open ? this.close() : this.show();
  }

  show() {
    this.open = true;
    this._el.style.display = 'flex';
    this._render();
  }

  close() {
    // Return grid items to inventory
    this._returnGridItems();
    if (this._selected) {
      this.inventory.add(this._selected.id, this._selected.count);
      this._selected = null;
    }
    this.open = false;
    this._el.style.display = 'none';
  }

  _returnGridItems() {
    for (let i = 0; i < 9; i++) {
      if (this._grid[i]) {
        this.inventory.add(this._grid[i], this._gridCounts[i]);
        this._grid[i] = 0;
        this._gridCounts[i] = 0;
      }
    }
    this._result = null;
  }

  _bindUI() {
    // Crafting grid slots
    for (let i = 0; i < 9; i++) {
      const el = document.getElementById(`craft-slot-${i}`);
      if (!el) continue;
      el.addEventListener('click', () => this._clickGrid(i));
      el.addEventListener('contextmenu', e => { e.preventDefault(); this._rightClickGrid(i); });
    }

    // Output slot
    const out = document.getElementById('craft-output');
    if (out) out.addEventListener('click', () => this._clickOutput());

    // Inventory slots
    for (let i = 0; i < 36; i++) {
      const el = document.getElementById(`inv-slot-${i}`);
      if (!el) continue;
      el.addEventListener('click',       () => this._clickInv(i));
      el.addEventListener('contextmenu', e  => { e.preventDefault(); this._rightClickInv(i); });
    }

    // Close button / background click
    document.getElementById('crafting-close')?.addEventListener('click', () => this.close());
  }

  /* ── Interactions ──────────────────────────────────────────────────── */

  _clickGrid(i) {
    if (this._selected) {
      // Place one item into grid
      if (!this._grid[i]) {
        this._grid[i] = this._selected.id;
        this._gridCounts[i] = 1;
        this._selected.count--;
        if (this._selected.count <= 0) this._selected = null;
      } else if (this._grid[i] === this._selected.id && this._gridCounts[i] < 64) {
        this._gridCounts[i]++;
        this._selected.count--;
        if (this._selected.count <= 0) this._selected = null;
      } else {
        // Swap
        const old = { id: this._grid[i], count: this._gridCounts[i] };
        this._grid[i] = this._selected.id;
        this._gridCounts[i] = this._selected.count;
        this._selected = old;
      }
    } else if (this._grid[i]) {
      // Pick up
      this._selected = { id: this._grid[i], count: this._gridCounts[i] };
      this._grid[i] = 0;
      this._gridCounts[i] = 0;
    }
    this._updateResult();
    this._render();
  }

  _rightClickGrid(i) {
    if (this._selected && !this._grid[i]) {
      // Place one
      this._grid[i] = this._selected.id;
      this._gridCounts[i] = 1;
      this._selected.count--;
      if (this._selected.count <= 0) this._selected = null;
    } else if (!this._selected && this._grid[i]) {
      // Pick up half
      const half = Math.ceil(this._gridCounts[i] / 2);
      this._selected = { id: this._grid[i], count: half };
      this._gridCounts[i] -= half;
      if (this._gridCounts[i] <= 0) { this._grid[i] = 0; this._gridCounts[i] = 0; }
    }
    this._updateResult();
    this._render();
  }

  _clickOutput() {
    if (!this._result) return;
    const { id, count } = this._result;

    // Consume ingredients
    for (let i = 0; i < 9; i++) {
      if (this._grid[i]) {
        this._gridCounts[i]--;
        if (this._gridCounts[i] <= 0) { this._grid[i] = 0; this._gridCounts[i] = 0; }
      }
    }

    // Give to player
    if (this._selected && this._selected.id === id && this._selected.count + count <= 64) {
      this._selected.count += count;
    } else if (!this._selected) {
      this._selected = { id, count };
    } else {
      // Put existing selected back in inventory, grab output
      this.inventory.add(this._selected.id, this._selected.count);
      this._selected = { id, count };
    }

    this._updateResult();
    this._render();
  }

  _clickInv(i) {
    const slot = this.inventory.slots[i];
    if (this._selected) {
      if (slot.empty) {
        // Place all
        slot.id    = this._selected.id;
        slot.count = this._selected.count;
        this._selected = null;
      } else if (slot.id === this._selected.id && slot.count < 64) {
        const space = 64 - slot.count;
        const take  = Math.min(space, this._selected.count);
        slot.count += take;
        this._selected.count -= take;
        if (this._selected.count <= 0) this._selected = null;
      } else {
        // Swap
        const old = slot.clone();
        slot.id    = this._selected.id;
        slot.count = this._selected.count;
        this._selected = { id: old.id, count: old.count };
      }
    } else if (!slot.empty) {
      this._selected = { id: slot.id, count: slot.count };
      slot.id = 0; slot.count = 0;
    }
    this._render();
  }

  _rightClickInv(i) {
    const slot = this.inventory.slots[i];
    if (this._selected) {
      if (slot.empty || slot.id === this._selected.id) {
        if (slot.empty) { slot.id = this._selected.id; slot.count = 0; }
        if (slot.count < 64) { slot.count++; this._selected.count--; }
        if (this._selected.count <= 0) this._selected = null;
      }
    } else if (!slot.empty) {
      const half = Math.ceil(slot.count / 2);
      this._selected = { id: slot.id, count: half };
      slot.count -= half;
      if (slot.count <= 0) { slot.id = 0; slot.count = 0; }
    }
    this._render();
  }

  /* ── Recipe matching ──────────────────────────────────────────────── */

  _updateResult() {
    const recipe = findRecipe(this._grid);
    if (recipe) {
      this._result = { id: recipe.out, count: recipe.outCount, name: recipe.name };
    } else {
      this._result = null;
    }
  }

  /* ── Rendering ──────────────────────────────────────────────────────── */

  _render() {
    // Crafting grid
    for (let i = 0; i < 9; i++) {
      const el     = document.getElementById(`craft-slot-${i}`);
      if (!el) continue;
      const canvas = el.querySelector('canvas');
      const label  = el.querySelector('.slot-count');
      const id     = this._grid[i];
      const cnt    = this._gridCounts[i];
      this._drawBlockIcon(canvas, id);
      if (label) label.textContent = (id && cnt > 1) ? cnt : '';
    }

    // Output
    const outEl = document.getElementById('craft-output');
    if (outEl) {
      const canvas = outEl.querySelector('canvas');
      const label  = outEl.querySelector('.slot-count');
      this._drawBlockIcon(canvas, this._result ? this._result.id : 0);
      if (label) label.textContent = (this._result && this._result.count > 1) ? this._result.count : '';
      outEl.title = this._result ? this._result.name : '';
    }

    // Inventory slots
    for (let i = 0; i < 36; i++) {
      const el = document.getElementById(`inv-slot-${i}`);
      if (!el) continue;
      const slot   = this.inventory.slots[i];
      const canvas = el.querySelector('canvas');
      const label  = el.querySelector('.slot-count');
      this._drawBlockIcon(canvas, slot.id);
      if (label) label.textContent = (!slot.empty && slot.count > 1) ? slot.count : '';
      el.classList.toggle('inv-selected', i < 9); // highlight hotbar
    }

    // Cursor / selected item
    const cursorEl = document.getElementById('craft-cursor');
    if (cursorEl) {
      if (this._selected) {
        const canvas = cursorEl.querySelector('canvas');
        const label  = cursorEl.querySelector('.slot-count');
        this._drawBlockIcon(canvas, this._selected.id);
        if (label) label.textContent = this._selected.count > 1 ? this._selected.count : '';
        cursorEl.style.display = 'flex';
      } else {
        cursorEl.style.display = 'none';
      }
    }
  }

  _drawBlockIcon(canvas, id) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 36, 36);
    if (!id || !this.atlas || !BLOCK_FACES[id]) return;
    const tileIdx = BLOCK_FACES[id][2] !== undefined ? BLOCK_FACES[id][2] : BLOCK_FACES[id][0];
    const uv  = getTileUV(tileIdx);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.atlas, uv.u * ATLAS_SIZE, uv.v * ATLAS_SIZE, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE, 0, 0, 36, 36);
  }

  setAtlas(canvas) {
    this.atlas = canvas;
  }
}
