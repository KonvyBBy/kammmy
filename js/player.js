/**
 * Player — first-person controller with physics, collision, block interaction
 */

const PLAYER_HEIGHT  = 1.8;
const PLAYER_WIDTH   = 0.6;
const EYE_HEIGHT     = 1.62;
const GRAVITY        = -28;
const JUMP_FORCE     = 8.5;
const WALK_SPEED     = 5.0;
const SPRINT_SPEED   = 8.0;
const SNEAK_SPEED    = 2.2;
const FLY_SPEED      = 12;
const FLY_FAST       = 24;
const SWIM_SPEED     = 3.5;
const BREAK_DISTANCE = 5.0;
const MAX_HEALTH     = 20;
const FALL_DAMAGE_THRESHOLD = 4; // blocks/s

class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world  = world;

    // Position is feet center
    this.position = new THREE.Vector3(0, 80, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.yaw   = 0;  // radians
    this.pitch = 0;

    this.onGround   = false;
    this.inWater    = false;
    this.flying     = false;
    this.sprinting  = false;
    this.sneaking   = false;

    this.health     = MAX_HEALTH;
    this.maxHealth  = MAX_HEALTH;
    this.invincible = 0; // invincibility frames

    this.hotbar    = DEFAULT_HOTBAR.slice();
    this.hotbarSel = 0;

    // Block breaking
    this.breaking     = null; // {x,y,z}
    this.breakProgress= 0;
    this.breakTime    = 0;

    // Input state
    this.keys = {};
    this.mouse = { left: false, right: false };

    // Spawn offset — updated when world is ready
    this._spawnSet = false;

    this._bindInput();
  }

  /* ── Input ──────────────────────────────────────────────────────────────── */

  _bindInput() {
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyF') this._toggleFly();
      if (e.code === 'Space' && this.onGround && !this.flying) {
        this.velocity.y = JUMP_FORCE;
        this.onGround = false;
      }
      if (e.code === 'Space' && this.flying) this.velocity.y = FLY_SPEED;
      if (e.code === 'ShiftLeft' && this.flying) this.velocity.y = -FLY_SPEED;
      // Hotbar 1-9
      for (let i = 1; i <= 9; i++) {
        if (e.code === `Digit${i}`) this.hotbarSel = i - 1;
      }
    });
    document.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (e.code === 'Space' && this.flying) { if (this.velocity.y > 0) this.velocity.y = 0; }
      if (e.code === 'ShiftLeft' && this.flying) { if (this.velocity.y < 0) this.velocity.y = 0; }
    });

    // Mouse look (requires pointer lock)
    document.addEventListener('mousemove', e => {
      if (!document.pointerLockElement) return;
      const sens = 0.0022;
      this.yaw   -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.pitch));
    });

    // Mouse wheel for hotbar
    document.addEventListener('wheel', e => {
      this.hotbarSel = ((this.hotbarSel + (e.deltaY > 0 ? 1 : -1)) + 9) % 9;
    });

    // Block interact
    document.addEventListener('mousedown', e => {
      if (!document.pointerLockElement) return;
      if (e.button === 0) this.mouse.left  = true;
      if (e.button === 2) { this.mouse.right = true; this._tryPlace(); }
    });
    document.addEventListener('mouseup', e => {
      if (e.button === 0) { this.mouse.left = false; this.breakProgress = 0; this.breaking = null; }
      if (e.button === 2) this.mouse.right = false;
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
  }

  _toggleFly() {
    this.flying = !this.flying;
    if (this.flying) this.velocity.set(0, 0, 0);
  }

  /* ── Update ─────────────────────────────────────────────────────────────── */

  update(dt) {
    if (!this._spawnSet) this._trySetSpawn();

    this._move(dt);
    this._updateCamera();
    this._handleBreaking(dt);

    if (this.invincible > 0) this.invincible -= dt;
  }

  _trySetSpawn() {
    const spawnY = this.world.getSpawnY(0, 0);
    if (spawnY > 0) {
      this.position.set(0.5, spawnY, 0.5);
      this._spawnSet = true;
    }
  }

  _move(dt) {
    const speed = this.flying
      ? (this.keys['ShiftLeft'] ? FLY_FAST : FLY_SPEED)
      : this.sneaking ? SNEAK_SPEED
      : this.inWater  ? SWIM_SPEED
      : (this.sprinting = this.keys['ControlLeft'] || this.keys['KeyW'] && this.keys['ControlLeft'])
        ? SPRINT_SPEED : WALK_SPEED;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right   = new THREE.Vector3( Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const move = new THREE.Vector3();
    if (this.keys['KeyW']) move.addScaledVector(forward,  1);
    if (this.keys['KeyS']) move.addScaledVector(forward, -1);
    if (this.keys['KeyA']) move.addScaledVector(right,   -1);
    if (this.keys['KeyD']) move.addScaledVector(right,    1);
    if (move.lengthSq() > 0) move.normalize();

    if (this.flying) {
      this.velocity.x = move.x * speed;
      this.velocity.z = move.z * speed;
      if (!this.keys['Space'] && !this.keys['ShiftLeft']) this.velocity.y *= 0.9;
      if (this.keys['Space'])     this.velocity.y =  FLY_SPEED;
      if (this.keys['ShiftLeft']) this.velocity.y = -FLY_SPEED;
    } else {
      // Horizontal
      const accel = this.onGround ? 12 : 3;
      this.velocity.x += (move.x * speed - this.velocity.x) * accel * dt;
      this.velocity.z += (move.z * speed - this.velocity.z) * accel * dt;

      // Gravity / buoyancy
      if (this.inWater) {
        this.velocity.y += GRAVITY * 0.25 * dt;
        if (this.keys['Space']) this.velocity.y += 8 * dt;
        this.velocity.y = Math.max(-3, Math.min(3, this.velocity.y));
      } else {
        this.velocity.y += GRAVITY * dt;
        this.velocity.y = Math.max(-50, this.velocity.y);
      }
    }

    // Integrate and collide
    this._integrateCollide(dt);

    // Check in-water
    const eyeBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + EYE_HEIGHT),
      Math.floor(this.position.z)
    );
    const feetBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + 0.1),
      Math.floor(this.position.z)
    );
    this.inWater = feetBlock === BlockType.WATER;

    // Fall damage
    if (this.onGround && this.velocity.y > -0.1) {
      const fallSpeed = -this._prevVelY;
      if (fallSpeed > FALL_DAMAGE_THRESHOLD * 2 + 2) {
        const dmg = Math.floor((fallSpeed - FALL_DAMAGE_THRESHOLD * 2) * 0.5);
        if (dmg > 0) this.damage(dmg);
      }
    }
    this._prevVelY = this.velocity.y;
  }

  _integrateCollide(dt) {
    const hw = PLAYER_WIDTH / 2;
    const pos = this.position;
    const vel = this.velocity;

    // X axis
    pos.x += vel.x * dt;
    if (this._checkCollisionAABB(pos)) { pos.x -= vel.x * dt; vel.x = 0; }

    // Y axis
    const oldY = pos.y;
    pos.y += vel.y * dt;
    if (this._checkCollisionAABB(pos)) {
      pos.y -= vel.y * dt;
      if (vel.y < 0) this.onGround = true;
      vel.y = 0;
    } else {
      this.onGround = false;
    }

    // Z axis
    pos.z += vel.z * dt;
    if (this._checkCollisionAABB(pos)) { pos.z -= vel.z * dt; vel.z = 0; }
  }

  _checkCollisionAABB(pos) {
    const hw = PLAYER_WIDTH / 2;
    const minX = Math.floor(pos.x - hw), maxX = Math.floor(pos.x + hw);
    const minY = Math.floor(pos.y),       maxY = Math.floor(pos.y + PLAYER_HEIGHT);
    const minZ = Math.floor(pos.z - hw), maxZ = Math.floor(pos.z + hw);

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          const id = this.world.getBlock(bx, by, bz);
          if (id === BlockType.AIR || id === BlockType.WATER) continue;
          const props = BLOCK_PROPS[id];
          if (!props || !props.solid) continue;
          // AABB overlap check
          if (pos.x + hw > bx && pos.x - hw < bx + 1 &&
              pos.y + PLAYER_HEIGHT > by && pos.y < by + 1 &&
              pos.z + hw > bz && pos.z - hw < bz + 1) {
            return true;
          }
        }
      }
    }
    return false;
  }

  _updateCamera() {
    this.camera.position.set(
      this.position.x,
      this.position.y + EYE_HEIGHT,
      this.position.z
    );
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /* ── Block interaction ──────────────────────────────────────────────────── */

  _getLookTarget() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return this.world.raycast(this.camera.position, dir, BREAK_DISTANCE);
  }

  _handleBreaking(dt) {
    if (!this.mouse.left) {
      this.breakProgress = 0;
      this.breaking = null;
      return;
    }
    const hit = this._getLookTarget();
    if (!hit) { this.breakProgress = 0; this.breaking = null; return; }

    const {x, y, z} = hit.blockPos;

    // Reset if target changed
    if (!this.breaking || this.breaking.x !== x || this.breaking.y !== y || this.breaking.z !== z) {
      this.breaking = {x, y, z};
      this.breakProgress = 0;
    }

    const id = this.world.getBlock(x, y, z);
    if (id === BlockType.AIR) return;
    const hardness = (BLOCK_PROPS[id] && BLOCK_PROPS[id].hardness != null)
      ? BLOCK_PROPS[id].hardness : 1;

    if (hardness === Infinity) return; // bedrock — can't break

    this.breakProgress += dt / Math.max(0.1, hardness * 0.5);
    if (this.breakProgress >= 1) {
      this.world.setBlock(x, y, z, BlockType.AIR);
      this.breakProgress = 0;
      this.breaking = null;
    }
  }

  _tryPlace() {
    const hit = this._getLookTarget();
    if (!hit || !hit.face) return;
    const {x, y, z} = hit.blockPos;
    const f = hit.face;
    const px = x + f[0], py = y + f[1], pz = z + f[2];

    // Don't place inside player
    const hw = PLAYER_WIDTH / 2;
    if (px + 1 > this.position.x - hw && px < this.position.x + hw &&
        py + 1 > this.position.y       && py < this.position.y + PLAYER_HEIGHT &&
        pz + 1 > this.position.z - hw && pz < this.position.z + hw) return;

    const sel = this.hotbar[this.hotbarSel];
    if (sel && sel !== BlockType.AIR) {
      this.world.setBlock(px, py, pz, sel);
    }
  }

  /* ── Health ─────────────────────────────────────────────────────────────── */

  damage(amount) {
    if (this.invincible > 0) return;
    this.health = Math.max(0, this.health - amount);
    this.invincible = 0.5;
    if (this.health <= 0) this._onDeath();
  }

  _onDeath() {
    this.health = MAX_HEALTH;
    this.position.set(0.5, this.world.getSpawnY(0, 0) || 80, 0.5);
    this.velocity.set(0, 0, 0);
    document.dispatchEvent(new Event('player-died'));
  }

  /* ── Getters ────────────────────────────────────────────────────────────── */

  getLookTarget()  { return this._getLookTarget(); }
  getBreakProgress() { return this.breakProgress; }
}
