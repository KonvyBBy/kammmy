/**
 * HUD — crosshair, hotbar, health bar, debug overlay, break progress, block highlight
 */

class HUD {
  constructor(player, world, sky) {
    this.player = player;
    this.world  = world;
    this.sky    = sky;

    this._atlasCanvas = null;  // set externally after atlas is built
    this._blockHighlight = null; // Three.js line mesh
    this._buildBlockHighlight();

    this._buildHotbarSlots();
    this._buildHealth();
  }

  /* ── Hotbar ─────────────────────────────────────────────────────────────── */

  _buildHotbarSlots() {
    const hotbar = document.getElementById('hotbar');
    hotbar.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot';
      slot.id = `slot-${i}`;
      const num = document.createElement('span');
      num.className = 'slot-num';
      num.textContent = i + 1;
      slot.appendChild(num);
      const canvas = document.createElement('canvas');
      canvas.width = 36; canvas.height = 36;
      slot.appendChild(canvas);
      hotbar.appendChild(slot);
    }
  }

  _buildHealth() {
    const health = document.getElementById('health');
    health.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const h = document.createElement('div');
      h.className = 'heart';
      h.id = `heart-${i}`;
      h.textContent = '❤';
      health.appendChild(h);
    }
  }

  /* ── Block selection highlight ──────────────────────────────────────────── */

  _buildBlockHighlight() {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1, transparent: true, opacity: 0.6 });
    this._blockHighlight = new THREE.LineSegments(geo, mat);
    this._blockHighlight.visible = false;
    // Will be added to scene externally
  }

  getBlockHighlight() { return this._blockHighlight; }

  /* ── Update ─────────────────────────────────────────────────────────────── */

  update(debugMode, mobManager) {
    this._updateHotbar();
    this._updateHealth();
    this._updateBreakOverlay();
    this._updateBlockHighlight();
    if (mobManager) this._updateMobInfo(mobManager);
    if (debugMode) this._updateDebug();
    document.getElementById('debug').style.display = debugMode ? 'block' : 'none';
  }

  _updateHotbar() {
    for (let i = 0; i < 9; i++) {
      const slot  = document.getElementById(`slot-${i}`);
      if (!slot) continue;
      const isSelected = i === this.player.hotbarSel;
      slot.className = 'hotbar-slot' + (isSelected ? ' selected' : '');

      const canvas = slot.querySelector('canvas');
      if (!canvas || !this._atlasCanvas) continue;

      const invSlot = this.player.inventory.slots[i];
      const id = invSlot ? invSlot.id : 0;

      if (!id || !BLOCK_FACES[id]) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 36, 36);
      } else {
        const tileIdx = BLOCK_FACES[id][2]; // top face
        const ctx = canvas.getContext('2d');
        const uv  = getTileUV(tileIdx);
        ctx.clearRect(0, 0, 36, 36);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          this._atlasCanvas,
          uv.u * ATLAS_SIZE, uv.v * ATLAS_SIZE, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE,
          0, 0, 36, 36
        );
      }

      // Show count badge
      let countEl = slot.querySelector('.item-count');
      if (!countEl) {
        countEl = document.createElement('span');
        countEl.className = 'item-count';
        slot.appendChild(countEl);
      }
      const cnt = invSlot && !invSlot.empty ? invSlot.count : 0;
      countEl.textContent = cnt > 1 ? cnt : '';
    }
  }

  _updateMobInfo(mobManager) {
    let el = document.getElementById('mob-info');
    if (!el) return;
    const infos = mobManager.getNearbyInfo(this.player.position, 20);
    if (infos.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = infos.map(m => {
      const healthRatio = m.hp / m.maxHp;
      const pct = (healthRatio * 100).toFixed(0);
      const barColor = healthRatio > 0.5 ? '#4CAF50' : healthRatio > 0.25 ? '#FFA500' : '#F44336';
      return `<div class="mob-row">
        <span class="mob-name">${m.name}</span>
        <div class="mob-hp-bar"><div class="mob-hp-fill" style="width:${pct}%;background:${barColor}"></div></div>
        <span class="mob-hp-text">${m.hp}/${m.maxHp}</span>
      </div>`;
    }).join('');
  }

  _updateHealth() {
    const hp = this.player.health;
    for (let i = 0; i < 10; i++) {
      const h = document.getElementById(`heart-${i}`);
      if (!h) continue;
      const threshold = (i + 1) * 2;
      if (hp >= threshold) {
        h.style.color = '#e00';
      } else if (hp >= threshold - 1) {
        h.style.color = '#a00';  // half heart
      } else {
        h.style.color = '#444';
      }
    }
  }

  _updateBreakOverlay() {
    const overlay  = document.getElementById('break-overlay');
    const progress = document.getElementById('break-progress');
    const bp = this.player.getBreakProgress();
    if (bp > 0) {
      overlay.style.display  = 'block';
      progress.style.width   = `${bp * 100}%`;
    } else {
      overlay.style.display  = 'none';
    }
  }

  _updateBlockHighlight() {
    const hit = this.player.getLookTarget();
    if (hit) {
      const {x, y, z} = hit.blockPos;
      this._blockHighlight.position.set(x + 0.5, y + 0.5, z + 0.5);
      this._blockHighlight.visible = true;
    } else {
      this._blockHighlight.visible = false;
    }
  }

  _updateDebug() {
    const p   = this.player.position;
    const vel = this.player.velocity;
    const sel = this.player.hotbar[this.player.hotbarSel];
    const selName = sel ? Object.keys(BlockType).find(k => BlockType[k] === sel) : 'AIR';
    const dbg = document.getElementById('debug');
    dbg.innerHTML = [
      `<b>VoxelCraft Debug</b>`,
      `XYZ: ${p.x.toFixed(2)} / ${p.y.toFixed(2)} / ${p.z.toFixed(2)}`,
      `Vel: ${vel.x.toFixed(2)} / ${vel.y.toFixed(2)} / ${vel.z.toFixed(2)}`,
      `Chunk: ${Math.floor(p.x/CHUNK_SIZE)}, ${Math.floor(p.z/CHUNK_SIZE)}`,
      `Flying: ${this.player.flying} | Ground: ${this.player.onGround} | Water: ${this.player.inWater}`,
      `Selected: ${selName} (${sel})`,
      `Time: ${this.sky.getTimeString()} (${(this.sky.time*100).toFixed(1)}%)`,
      `Health: ${this.player.health}/${this.player.maxHealth}`,
      `FPS: ${this._lastFPS || '—'}`,
    ].join('<br>');
  }

  setFPS(fps) { this._lastFPS = fps; }
  setAtlas(canvas) { this._atlasCanvas = canvas; }
}
