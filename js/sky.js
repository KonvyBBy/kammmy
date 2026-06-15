/**
 * Sky — procedural sky dome, sun, moon, stars, day/night cycle
 */

const DAY_DURATION = 600; // seconds for full 24h cycle

class Sky {
  constructor(scene, renderer) {
    this.scene    = scene;
    this.renderer = renderer;
    this.time     = 0.25; // start at morning (0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk)

    this._buildSkyDome();
    this._buildSun();
    this._buildMoon();
    this._buildStars();
    this._buildFog();
  }

  /* ── Construction ───────────────────────────────────────────────────────── */

  _buildSkyDome() {
    // Large sphere inverted (rendered from inside)
    const geo  = new THREE.SphereGeometry(400, 32, 16);
    const mat  = new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true });
    this._skyMat = mat;

    // We'll update vertex colors each tick based on time
    // Pre-fill with colors
    const verts = geo.attributes.position.count;
    const colors = new Float32Array(verts * 3);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.skyMesh = new THREE.Mesh(geo, mat);
    this.skyMesh.renderOrder = -1;
    this.scene.add(this.skyMesh);
  }

  _buildSun() {
    const geo = new THREE.SphereGeometry(18, 12, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfffbe8 });
    this.sunMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.sunMesh);

    // Sun glow corona
    const coronaGeo = new THREE.SphereGeometry(22, 12, 8);
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xffee99, transparent: true, opacity: 0.25 });
    this.sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunMesh.add(this.sunCorona);
  }

  _buildMoon() {
    const geo = new THREE.SphereGeometry(12, 12, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xd0d8e8 });
    this.moonMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.moonMesh);
  }

  _buildStars() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 390;
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.cos(phi);
      positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  _buildFog() {
    this.scene.fog = new THREE.Fog(0x87ceeb, 60, RENDER_DISTANCE * CHUNK_SIZE * 1.1);
  }

  /* ── Update ─────────────────────────────────────────────────────────────── */

  update(dt, playerPos, ambientLight, sunLight) {
    this.time = (this.time + dt / DAY_DURATION) % 1;
    const t = this.time;

    // Angle: 0=midnight, 0.5=noon
    const sunAngle = (t - 0.25) * Math.PI * 2;

    // Move sky dome with player (infinite sky)
    this.skyMesh.position.copy(playerPos);
    this.stars.position.copy(playerPos);

    // Sun/moon positions (orbit around X axis)
    const R = 350;
    this.sunMesh.position.set(
      playerPos.x,
      playerPos.y + R * Math.sin(sunAngle),
      playerPos.z + R * Math.cos(sunAngle)
    );
    this.moonMesh.position.set(
      playerPos.x,
      playerPos.y - R * Math.sin(sunAngle),
      playerPos.z - R * Math.cos(sunAngle)
    );

    // Sky colors based on time of day
    const { sky, horizon, ambient, sun, fog: fogColor } = this._getColors(t);

    // Update sky dome vertex colors (top vs. horizon)
    this._updateSkyColors(sky, horizon);

    // Lighting
    if (ambientLight) ambientLight.color.setRGB(ambient.r, ambient.g, ambient.b);
    if (sunLight) {
      sunLight.color.setRGB(sun.r, sun.g, sun.b);
      sunLight.intensity = sun.i;
      sunLight.position.set(
        Math.sin(sunAngle) * 100,
        Math.cos(sunAngle) * 100,
        50
      );
    }

    // Renderer background color
    this.renderer.setClearColor(new THREE.Color(fogColor.r, fogColor.g, fogColor.b));

    // Fog
    if (this.scene.fog) {
      this.scene.fog.color.setRGB(fogColor.r, fogColor.g, fogColor.b);
    }

    // Stars visible at night
    const nightFactor = Math.max(0, -Math.sin(sunAngle));
    this.stars.material.opacity = Math.min(1, nightFactor * 3);
    this.stars.material.transparent = true;

    // Moon brightness
    this.moonMesh.material.color.setRGB(
      0.82 + 0.18 * nightFactor,
      0.85 + 0.15 * nightFactor,
      0.92 + 0.08 * nightFactor
    );
  }

  _updateSkyColors(skyColor, horizonColor) {
    const pos    = this.skyMesh.geometry.attributes.position;
    const colors = this.skyMesh.geometry.attributes.color;
    const count  = pos.count;

    for (let i = 0; i < count; i++) {
      const y      = pos.getY(i);
      const maxR   = 400;
      const blend  = Math.max(0, Math.min(1, (y / maxR + 0.3) / 0.6));
      colors.setXYZ(
        i,
        horizonColor.r + (skyColor.r - horizonColor.r) * blend,
        horizonColor.g + (skyColor.g - horizonColor.g) * blend,
        horizonColor.b + (skyColor.b - horizonColor.b) * blend
      );
    }
    colors.needsUpdate = true;
  }

  _getColors(t) {
    // Key times: 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
    const keyframes = [
      // t=0.00  midnight
      { sky:{r:0.01,g:0.02,b:0.08}, horizon:{r:0.02,g:0.03,b:0.12},
        ambient:{r:0.08,g:0.08,b:0.18}, sun:{r:0.0,g:0.0,b:0.0,i:0},
        fog:{r:0.01,g:0.02,b:0.07} },
      // t=0.20  pre-dawn
      { sky:{r:0.04,g:0.04,b:0.12}, horizon:{r:0.12,g:0.06,b:0.15},
        ambient:{r:0.15,g:0.12,b:0.25}, sun:{r:0.3,g:0.1,b:0.0,i:0.2},
        fog:{r:0.05,g:0.03,b:0.10} },
      // t=0.25  dawn/sunrise
      { sky:{r:0.30,g:0.38,b:0.75}, horizon:{r:0.95,g:0.52,b:0.20},
        ambient:{r:0.65,g:0.52,b:0.40}, sun:{r:1.0,g:0.72,b:0.4,i:0.7},
        fog:{r:0.80,g:0.50,b:0.30} },
      // t=0.35  morning
      { sky:{r:0.42,g:0.65,b:0.90}, horizon:{r:0.75,g:0.82,b:0.92},
        ambient:{r:0.70,g:0.72,b:0.74}, sun:{r:1.0,g:0.95,b:0.8,i:1.0},
        fog:{r:0.65,g:0.78,b:0.90} },
      // t=0.50  noon
      { sky:{r:0.34,g:0.62,b:0.95}, horizon:{r:0.68,g:0.82,b:0.97},
        ambient:{r:0.78,g:0.78,b:0.78}, sun:{r:1.0,g:1.0,b:0.95,i:1.2},
        fog:{r:0.60,g:0.76,b:0.95} },
      // t=0.65  afternoon
      { sky:{r:0.38,g:0.60,b:0.90}, horizon:{r:0.72,g:0.80,b:0.92},
        ambient:{r:0.72,g:0.70,b:0.68}, sun:{r:1.0,g:0.96,b:0.82,i:1.0},
        fog:{r:0.62,g:0.75,b:0.90} },
      // t=0.75  dusk/sunset
      { sky:{r:0.28,g:0.35,b:0.72}, horizon:{r:0.92,g:0.48,b:0.18},
        ambient:{r:0.60,g:0.45,b:0.35}, sun:{r:1.0,g:0.68,b:0.35,i:0.7},
        fog:{r:0.78,g:0.45,b:0.25} },
      // t=0.85  twilight
      { sky:{r:0.04,g:0.04,b:0.14}, horizon:{r:0.12,g:0.06,b:0.16},
        ambient:{r:0.14,g:0.12,b:0.22}, sun:{r:0.3,g:0.1,b:0.0,i:0.15},
        fog:{r:0.05,g:0.03,b:0.10} },
      // t=1.00 → same as 0.00
      { sky:{r:0.01,g:0.02,b:0.08}, horizon:{r:0.02,g:0.03,b:0.12},
        ambient:{r:0.08,g:0.08,b:0.18}, sun:{r:0.0,g:0.0,b:0.0,i:0},
        fog:{r:0.01,g:0.02,b:0.07} },
    ];

    const times = [0, 0.20, 0.25, 0.35, 0.50, 0.65, 0.75, 0.85, 1.00];

    // Find surrounding keyframes
    let lo = 0;
    for (let i = 0; i < times.length - 1; i++) {
      if (t >= times[i] && t <= times[i+1]) { lo = i; break; }
    }
    const hi  = Math.min(lo + 1, keyframes.length - 1);
    const tlo = times[lo], thi = times[hi];
    const f   = thi === tlo ? 0 : (t - tlo) / (thi - tlo);
    const a   = keyframes[lo], b = keyframes[hi];

    const lerp = (a, b) => ({
      r: a.r + (b.r - a.r) * f,
      g: a.g + (b.g - a.g) * f,
      b: a.b + (b.b - a.b) * f,
      i: (a.i || 0) + ((b.i || 0) - (a.i || 0)) * f,
    });

    return {
      sky:     lerp(a.sky,     b.sky),
      horizon: lerp(a.horizon, b.horizon),
      ambient: lerp(a.ambient, b.ambient),
      sun:     lerp(a.sun,     b.sun),
      fog:     lerp(a.fog,     b.fog),
    };
  }

  /** Returns [0..1] day brightness */
  getDaylight() {
    const sunAngle = (this.time - 0.25) * Math.PI * 2;
    return Math.max(0, Math.sin(sunAngle));
  }

  getTimeString() {
    // Convert fraction to HH:MM
    const mins  = Math.floor(this.time * 24 * 60);
    const hours = Math.floor(mins / 60) % 24;
    const m     = mins % 60;
    return `${String(hours).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
}
