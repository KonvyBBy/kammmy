/**
 * Game — main orchestrator, renderer setup, game loop
 */

class Game {
  constructor() {
    this.running  = false;
    this.paused   = false;
    this.debugMode= false;

    this._clock     = null;
    this._fpsSamples= [];
    this._fpsTimer  = 0;

    this._seed = Math.floor(Math.random() * 1000000);
  }

  /* ── Initialise ─────────────────────────────────────────────────────────── */

  async init() {
    this._setLoading('Building texture atlas…', 15);
    await this._sleep(50);

    // Texture atlas
    this._atlasCanvas = generateTextureAtlas();

    this._setLoading('Setting up renderer…', 30);
    await this._sleep(30);

    // Three.js renderer
    this._renderer = new THREE.WebGLRenderer({ antialias: false });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.shadowMap.enabled = false;
    document.body.appendChild(this._renderer.domElement);

    // Scene
    this._scene = new THREE.Scene();

    // Camera
    this._camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 600);

    // Lighting
    this._ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
    this._sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this._sunLight.position.set(100, 200, 50);
    this._scene.add(this._ambientLight, this._sunLight);

    this._setLoading('Generating world…', 50);
    await this._sleep(50);

    // World
    this._world = new World(this._scene, this._atlasCanvas, this._seed);

    // Pre-generate spawn chunks
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        this._world.loadChunk(dx, dz);
      }
    }

    this._setLoading('Building initial terrain…', 70);
    await this._sleep(50);

    // Build meshes for spawn area
    this._world.update(0, 0);
    for (let i = 0; i < 30; i++) {
      this._world.update(0, 0);
      if (i % 5 === 0) {
        this._setLoading('Building initial terrain…', 70 + i);
        await this._sleep(16);
      }
    }

    this._setLoading('Spawning player…', 92);
    await this._sleep(50);

    // Player
    this._player = new Player(this._camera, this._world);

    // Mob manager
    this._mobs = new MobManager(this._scene, this._world);

    // Wire player attack to mob hit detection
    this._player.onAttackMob = (origin, dir) =>
      this._mobs.tryAttack(origin, dir, 5.0, 5);

    // Sky
    this._sky = new Sky(this._scene, this._renderer);

    // Crafting UI
    this._crafting = new CraftingUI(this._player.inventory, this._atlasCanvas);

    // HUD
    this._hud = new HUD(this._player, this._world, this._sky);
    this._hud.setAtlas(this._atlasCanvas);
    this._scene.add(this._hud.getBlockHighlight());

    // Resize handler
    window.addEventListener('resize', () => this._onResize());

    // Pointer lock
    document.addEventListener('click', () => {
      if (this.running && !this.paused) {
        document.body.requestPointerLock();
      }
    });
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.running && !this.paused) {
        this._pause();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.code === 'Escape' && this.running) {
        if (this._crafting.open) { this._crafting.close(); document.body.requestPointerLock(); }
        else if (this.paused) this._resume(); else this._pause();
      }
      if (e.code === 'F3') this.debugMode = !this.debugMode;
      if (e.code === 'KeyE' && this.running) {
        if (this._crafting.open) {
          this._crafting.close();
          document.exitPointerLock();
          document.body.requestPointerLock();
        } else {
          this._crafting.show();
          document.exitPointerLock();
        }
      }
    });

    // UI buttons
    document.getElementById('btn-play').addEventListener('click', () => this.start());
    document.getElementById('btn-resume').addEventListener('click', () => this._resume());
    document.getElementById('btn-menu').addEventListener('click', () => this._backToMenu());
    document.getElementById('btn-respawn').addEventListener('click', () => this._respawn());

    // Death event
    document.addEventListener('player-died', () => this._onDeath());

    this._setLoading('Done!', 100);
    await this._sleep(300);

    // Show menu
    document.getElementById('loading').style.display = 'none';
    document.getElementById('menu').style.display    = 'flex';
  }

  /* ── Start / Pause ──────────────────────────────────────────────────────── */

  start() {
    document.getElementById('menu').style.display  = 'none';
    document.getElementById('hud').style.display   = 'block';
    document.getElementById('pause').style.display = 'none';
    document.getElementById('death').style.display = 'none';
    this.running = true;
    this.paused  = false;
    this._clock  = { last: performance.now() };
    document.body.requestPointerLock();
    this._loop();
  }

  _pause() {
    this.paused = true;
    document.getElementById('pause').style.display = 'flex';
    document.exitPointerLock();
  }

  _resume() {
    this.paused = false;
    document.getElementById('pause').style.display = 'none';
    document.body.requestPointerLock();
    this._clock.last = performance.now();
  }

  _backToMenu() {
    this.running = false;
    this.paused  = false;
    document.getElementById('pause').style.display = 'none';
    document.getElementById('hud').style.display   = 'none';
    document.getElementById('menu').style.display  = 'flex';
    document.exitPointerLock();
  }

  _onDeath() {
    document.getElementById('death').style.display = 'flex';
    document.exitPointerLock();
  }

  _respawn() {
    document.getElementById('death').style.display = 'none';
    document.body.requestPointerLock();
    this._clock.last = performance.now();
  }

  /* ── Main loop ──────────────────────────────────────────────────────────── */

  _loop() {
    requestAnimationFrame(() => this._loop());
    if (!this.running || this.paused) return;

    const now = performance.now();
    let dt = (now - this._clock.last) / 1000;
    this._clock.last = now;
    dt = Math.min(dt, 0.05); // cap at 50ms to avoid spiral of death

    // FPS tracking
    this._fpsSamples.push(1 / dt);
    this._fpsTimer += dt;
    if (this._fpsTimer >= 0.5) {
      const avgFPS = Math.round(this._fpsSamples.reduce((a,b)=>a+b,0) / this._fpsSamples.length);
      this._hud.setFPS(avgFPS);
      this._fpsSamples = [];
      this._fpsTimer = 0;
    }

    // Update systems
    this._player.update(dt);
    this._world.update(this._player.position.x, this._player.position.z);
    this._sky.update(dt, this._camera.position, this._ambientLight, this._sunLight);
    this._mobs.update(dt, this._player, this._sky);
    this._hud.update(this.debugMode, this._mobs);

    // Render
    this._renderer.render(this._scene, this._camera);
  }

  /* ── Helpers ────────────────────────────────────────────────────────────── */

  _onResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _setLoading(text, pct) {
    const bar  = document.getElementById('loading-bar');
    const label = document.getElementById('loading-text');
    if (bar)   bar.style.width = `${pct}%`;
    if (label) label.textContent = text;
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const game = new Game();
  game.init().catch(console.error);
});
