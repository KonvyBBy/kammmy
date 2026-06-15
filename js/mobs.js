/**
 * Mob system — passive animals and hostile mobs
 */

const MOB_TYPE = {
  COW:      0,
  PIG:      1,
  CHICKEN:  2,
  SHEEP:    3,
  ZOMBIE:   4,
  CREEPER:  5,
  SKELETON: 6,
  SPIDER:   7,
};

const MOB_DEFS = {
  [MOB_TYPE.COW]: {
    name:'Cow', hostile:false, hp:10, speed:2.2,
    bodyColor:0x5C3A1E, legColor:0x3D2712, headColor:0x5C3A1E,
    bodyH:0.9, bodyW:0.9, bodyD:0.6, quad:true,
    xp:3, drops:[],
  },
  [MOB_TYPE.PIG]: {
    name:'Pig', hostile:false, hp:10, speed:2.5,
    bodyColor:0xF4A7B9, legColor:0xE8809A, headColor:0xF4A7B9,
    bodyH:0.75, bodyW:0.8, bodyD:0.5, quad:true,
    xp:1, drops:[],
  },
  [MOB_TYPE.CHICKEN]: {
    name:'Chicken', hostile:false, hp:4, speed:3.0,
    bodyColor:0xFFFFFF, legColor:0xFFA500, headColor:0xFFFFFF,
    bodyH:0.5, bodyW:0.4, bodyD:0.3, quad:true,
    xp:1, drops:[],
  },
  [MOB_TYPE.SHEEP]: {
    name:'Sheep', hostile:false, hp:8, speed:2.5,
    bodyColor:0xD0D0D0, legColor:0x999999, headColor:0xEEEEEE,
    bodyH:0.9, bodyW:0.9, bodyD:0.6, quad:true,
    wool:true, xp:1, drops:[{id: BlockType.WOOL_WHITE, count:1}],
  },
  [MOB_TYPE.ZOMBIE]: {
    name:'Zombie', hostile:true, hp:20, speed:2.0,
    bodyColor:0x4B9E6F, legColor:0x2D5C80, headColor:0x85C185,
    humanoid:true, nightOnly:true, attack:2, attackRate:1.0,
    xp:5, drops:[],
  },
  [MOB_TYPE.CREEPER]: {
    name:'Creeper', hostile:true, hp:20, speed:2.8,
    bodyColor:0x3AAA3A, legColor:0x2D8A2D, headColor:0x3AAA3A,
    creeperBody:true, attack:10, explodeRange:3.5, explodeTime:1.5,
    xp:5, drops:[],
  },
  [MOB_TYPE.SKELETON]: {
    name:'Skeleton', hostile:true, hp:20, speed:2.0,
    bodyColor:0xCCCCCC, legColor:0xAAAAAA, headColor:0xCCCCCC,
    humanoid:true, nightOnly:true, ranged:true, attack:2, attackRate:2.0,
    xp:5, drops:[],
  },
  [MOB_TYPE.SPIDER]: {
    name:'Spider', hostile:true, hp:16, speed:4.0,
    bodyColor:0x222222, legColor:0x333333, headColor:0x222222,
    spider:true, nightOnly:true, attack:2, attackRate:1.5,
    xp:5, drops:[],
  },
};

/* ── Mesh builder ───────────────────────────────────────────────────────── */

function _mobMat(color) {
  return new THREE.MeshLambertMaterial({ color });
}
function _mobBox(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), _mobMat(color));
}

function buildMobMesh(type) {
  const def = MOB_DEFS[type];
  const g = new THREE.Group();

  if (def.humanoid) {
    // Torso
    const torso = _mobBox(0.5, 0.75, 0.3, def.bodyColor);
    torso.position.y = 0.95;
    g.add(torso);
    // Head
    const head = _mobBox(0.5, 0.5, 0.5, def.headColor);
    head.position.y = 1.62;
    g.add(head);
    // Arms
    const armL = _mobBox(0.25, 0.7, 0.25, def.bodyColor);
    armL.position.set(-0.38, 0.95, 0);
    g.add(armL);
    const armR = _mobBox(0.25, 0.7, 0.25, def.bodyColor);
    armR.position.set( 0.38, 0.95, 0);
    g.add(armR);
    // Legs
    const legL = _mobBox(0.25, 0.75, 0.25, def.legColor);
    legL.position.set(-0.13, 0.38, 0);
    g.add(legL);
    const legR = _mobBox(0.25, 0.75, 0.25, def.legColor);
    legR.position.set( 0.13, 0.38, 0);
    g.add(legR);
    // Skeleton has slightly different look
    if (type === MOB_TYPE.SKELETON) {
      [torso, armL, armR, legL, legR].forEach(m => {
        m.material = _mobMat(0xBBBBBB);
      });
    }

  } else if (def.creeperBody) {
    // Body
    const body = _mobBox(0.5, 0.7, 0.5, def.bodyColor);
    body.position.y = 0.85;
    g.add(body);
    // Head
    const head = _mobBox(0.55, 0.55, 0.55, def.headColor);
    head.position.y = 1.53;
    g.add(head);
    // Creeper face (dark squares for eyes/mouth)
    const faceMat = new THREE.MeshBasicMaterial({ color: 0x001a00 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.01), faceMat);
    eyeL.position.set(-0.13, 1.58, 0.28);
    const eyeR = eyeL.clone(); eyeR.position.set(0.13, 1.58, 0.28);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.01), faceMat);
    mouth.position.set(0, 1.38, 0.28);
    g.add(eyeL, eyeR, mouth);
    // 4 legs
    const offsets = [[-0.15,-0.15],[0.15,-0.15],[-0.15,0.15],[0.15,0.15]];
    offsets.forEach(([ox,oz]) => {
      const leg = _mobBox(0.2, 0.45, 0.2, def.legColor);
      leg.position.set(ox, 0.22, oz);
      g.add(leg);
    });

  } else if (def.spider) {
    // Body (two segments)
    const abdomen = _mobBox(0.6, 0.5, 0.7, def.bodyColor);
    abdomen.position.set(0, 0.4, -0.2);
    g.add(abdomen);
    const thorax = _mobBox(0.5, 0.45, 0.5, def.headColor);
    thorax.position.set(0, 0.4, 0.3);
    g.add(thorax);
    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    [[-0.1,0.65,0.56],[0.1,0.65,0.56],[-0.18,0.6,0.54],[0.18,0.6,0.54]].forEach(([x,y,z]) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.01), eyeMat);
      eye.position.set(x, y, z);
      g.add(eye);
    });
    // 8 legs (4 per side)
    const legMat = _mobMat(def.legColor);
    for (let i = 0; i < 4; i++) {
      const legGeo = new THREE.BoxGeometry(0.06, 0.06, 0.5);
      const legL = new THREE.Mesh(legGeo, legMat);
      legL.position.set(-0.5, 0.35 - i * 0.05, 0.15 - i * 0.1);
      legL.rotation.z = Math.PI / 5;
      g.add(legL);
      const legR = legL.clone();
      legR.position.x = 0.5;
      legR.rotation.z = -Math.PI / 5;
      g.add(legR);
    }

  } else if (def.quad) {
    // 4-legged animal
    const { bodyH: bh, bodyW: bw, bodyD: bd } = def;
    const body = _mobBox(bw, bh * 0.55, bd, def.bodyColor);
    body.position.y = bh * 0.65;
    g.add(body);

    // Head
    const hSz = bw * 0.6;
    const head = _mobBox(hSz, hSz * 0.9, hSz, def.headColor);
    head.position.set(0, bh * 0.88, bd * 0.58);
    g.add(head);

    // Sheep has wool layer
    if (def.wool) {
      const wool = _mobBox(bw + 0.2, bh * 0.55 + 0.15, bd + 0.15, 0xEEEEEE);
      wool.position.y = bh * 0.65;
      g.add(wool);
    }

    // 4 legs
    const legH = bh * 0.42;
    const legW = bw * 0.18;
    const ox = bw * 0.28, oz = bd * 0.32;
    [[ox,oz],[ox,-oz],[-ox,oz],[-ox,-oz]].forEach(([lx,lz]) => {
      const leg = _mobBox(legW, legH, legW, def.legColor);
      leg.position.set(lx, legH / 2, lz);
      g.add(leg);
    });
  }

  return g;
}

/* ── Mob class ──────────────────────────────────────────────────────────── */

class Mob {
  constructor(type, x, y, z, scene, world) {
    this.type    = type;
    this.def     = MOB_DEFS[type];
    this.pos     = new THREE.Vector3(x, y, z);
    this.vel     = new THREE.Vector3();
    this.world   = world;
    this.hp      = this.def.hp;
    this.dead    = false;
    this.onGround= false;
    this._legAnim= 0;
    this._flashTimer = 0;

    this._ai = {
      wanderTimer:  1 + Math.random() * 3,
      wanderDir:    Math.random() * Math.PI * 2,
      alertTimer:   0,
      attackTimer:  0,
      explodeTimer: 0,
      fledTimer:    0,
    };

    this._mesh = buildMobMesh(type);
    scene.add(this._mesh);
  }

  /* ── Update ──────────────────────────────────────────────────────────── */

  update(dt, player, daylight) {
    if (this.dead) return;

    const def = this.def;
    const ai  = this._ai;

    /* Flash red when hit */
    if (this._flashTimer > 0) {
      this._flashTimer -= dt;
      if (this._flashTimer <= 0) this._restoreColors();
    }

    /* Gravity */
    if (!this.onGround) {
      this.vel.y -= 22 * dt;
      this.vel.y  = Math.max(-40, this.vel.y);
    }

    /* AI */
    const dx   = player.position.x - this.pos.x;
    const dz   = player.position.z - this.pos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const isNight = daylight < 0.15;

    if (def.hostile) {
      this._hostileAI(dt, player, dist, dx, dz, isNight);
    } else {
      this._passiveAI(dt, player, dist, dx, dz);
    }

    /* Daytime burn for night-only mobs */
    if (def.nightOnly && daylight > 0.5 && isNight === false) {
      this.hp -= dt * 1.5;
    }

    /* Integrate + collide */
    this._integrate(dt);

    /* Leg animation */
    const hspd = Math.sqrt(this.vel.x*this.vel.x + this.vel.z*this.vel.z);
    this._legAnim += dt * hspd * 5;
    this._animLegs();

    /* Sync mesh */
    this._mesh.position.copy(this.pos);
    if (hspd > 0.1) {
      this._mesh.rotation.y = Math.atan2(-this.vel.x, -this.vel.z);
    }

    if (this.pos.y < -30) this.dead = true;
    if (this.hp <= 0)     this.dead = true;
  }

  _hostileAI(dt, player, dist, dx, dz, isNight) {
    const def = this.def;
    const ai  = this._ai;
    const canAggro = !def.nightOnly || isNight || dist < 8;

    if (canAggro && dist < 24) ai.alertTimer = 3.0;
    if (ai.alertTimer > 0) ai.alertTimer -= dt;

    if (ai.alertTimer > 0) {
      if (this.type === MOB_TYPE.CREEPER) {
        if (dist < def.explodeRange) {
          ai.explodeTimer += dt;
          // Throb: scale up slightly as fuse burns
          const s = 1 + (ai.explodeTimer / def.explodeTime) * 0.15;
          this._mesh.scale.set(s, s, s);
          if (ai.explodeTimer >= def.explodeTime) {
            this._explode(player);
          }
        } else {
          ai.explodeTimer = Math.max(0, ai.explodeTimer - dt * 2);
          this._mesh.scale.set(1, 1, 1);
          this._moveToward(dx, dz, dt);
        }
      } else if (def.ranged) {
        // Skeleton: keep distance and shoot
        if (dist > 8 && dist < 20) {
          this.vel.x *= 0.85;
          this.vel.z *= 0.85;
        } else if (dist > 20) {
          this._moveToward(dx, dz, dt);
        } else {
          this._moveAway(dx, dz, dt);
        }
        ai.attackTimer -= dt;
        if (ai.attackTimer <= 0 && dist < 18) {
          player.damage(def.attack);
          ai.attackTimer = def.attackRate;
        }
      } else {
        // Melee
        this._moveToward(dx, dz, dt);
        ai.attackTimer -= dt;
        if (ai.attackTimer <= 0 && dist < 2.0) {
          player.damage(def.attack);
          ai.attackTimer = def.attackRate;
        }
      }
    } else {
      // Wander slowly
      this._wander(dt, 0.3);
    }
  }

  _passiveAI(dt, player, dist, dx, dz) {
    const ai = this._ai;

    // Flee when player is very close or hitting
    if (dist < 5 && player.mouse && player.mouse.left) {
      ai.fledTimer = 4.0;
    }
    if (ai.fledTimer > 0) {
      ai.fledTimer -= dt;
      this._moveAway(dx, dz, dt);
      return;
    }

    this._wander(dt, 0.4);
  }

  _wander(dt, speedFactor) {
    const ai  = this._ai;
    const def = this.def;
    ai.wanderTimer -= dt;
    if (ai.wanderTimer <= 0) {
      ai.wanderTimer = 2 + Math.random() * 4;
      if (Math.random() < 0.35) {
        ai.wanderDir = -1; // stand still
      } else {
        ai.wanderDir = Math.random() * Math.PI * 2;
      }
    }
    if (ai.wanderDir >= 0) {
      const s = def.speed * speedFactor;
      const tvx = Math.sin(ai.wanderDir) * s;
      const tvz = Math.cos(ai.wanderDir) * s;
      this.vel.x += (tvx - this.vel.x) * 5 * dt;
      this.vel.z += (tvz - this.vel.z) * 5 * dt;
    } else {
      this.vel.x *= Math.pow(0.1, dt);
      this.vel.z *= Math.pow(0.1, dt);
    }
  }

  _moveToward(dx, dz, dt) {
    const len = Math.sqrt(dx*dx + dz*dz) || 1;
    const s   = this.def.speed;
    this.vel.x += (dx/len * s - this.vel.x) * 10 * dt;
    this.vel.z += (dz/len * s - this.vel.z) * 10 * dt;
    // Jump over obstacles
    if (this.onGround && Math.random() < dt * 3) {
      const bx = Math.round(this.pos.x + dx/len);
      const bz = Math.round(this.pos.z + dz/len);
      const by = Math.floor(this.pos.y);
      if (this.world.getBlock(bx, by + 1, bz) !== BlockType.AIR) {
        this.vel.y = 6;
        this.onGround = false;
      }
    }
  }

  _moveAway(dx, dz, dt) {
    const len = Math.sqrt(dx*dx + dz*dz) || 1;
    const s   = this.def.speed * 1.3;
    this.vel.x += (-dx/len * s - this.vel.x) * 10 * dt;
    this.vel.z += (-dz/len * s - this.vel.z) * 10 * dt;
  }

  _explode(player) {
    const dx = player.position.x - this.pos.x;
    const dy = (player.position.y + 0.9) - this.pos.y;
    const dz = player.position.z - this.pos.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist < 6) {
      const dmg = Math.round((1 - dist / 6) * this.def.attack);
      player.damage(dmg);
    }
    // Destroy nearby blocks
    const r = 3;
    for (let bx = -r; bx <= r; bx++) {
      for (let by = -r; by <= r; by++) {
        for (let bz = -r; bz <= r; bz++) {
          if (bx*bx + by*by + bz*bz > r*r + 1) continue;
          const wx = Math.floor(this.pos.x) + bx;
          const wy = Math.floor(this.pos.y) + by;
          const wz = Math.floor(this.pos.z) + bz;
          const id = this.world.getBlock(wx, wy, wz);
          if (id !== BlockType.AIR && id !== BlockType.BEDROCK && id !== BlockType.OBSIDIAN) {
            this.world.setBlock(wx, wy, wz, BlockType.AIR);
          }
        }
      }
    }
    this.dead = true;
  }

  _integrate(dt) {
    const hw = (this.type === MOB_TYPE.SPIDER) ? 0.5 : 0.3;
    const h  = this._height();

    this.pos.x += this.vel.x * dt;
    if (this._collides(hw, h)) { this.pos.x -= this.vel.x * dt; this.vel.x = 0; }

    const prevY = this.pos.y;
    this.pos.y += this.vel.y * dt;
    if (this._collides(hw, h)) {
      this.pos.y = prevY;
      if (this.vel.y < 0) this.onGround = true;
      this.vel.y = 0;
    } else {
      this.onGround = false;
    }

    this.pos.z += this.vel.z * dt;
    if (this._collides(hw, h)) { this.pos.z -= this.vel.z * dt; this.vel.z = 0; }
  }

  _height() {
    if (this.type === MOB_TYPE.ZOMBIE || this.type === MOB_TYPE.SKELETON) return 1.8;
    if (this.type === MOB_TYPE.CREEPER) return 1.7;
    if (this.type === MOB_TYPE.SPIDER)  return 0.9;
    const def = this.def;
    return def.bodyH ? def.bodyH + 0.15 : 1.4;
  }

  _collides(hw, h) {
    const minX = Math.floor(this.pos.x - hw), maxX = Math.floor(this.pos.x + hw);
    const minY = Math.floor(this.pos.y),       maxY = Math.floor(this.pos.y + h);
    const minZ = Math.floor(this.pos.z - hw), maxZ = Math.floor(this.pos.z + hw);
    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          const id = this.world.getBlock(bx, by, bz);
          if (!id || id === BlockType.WATER) continue;
          const p = BLOCK_PROPS[id];
          if (!p || !p.solid) continue;
          if (this.pos.x+hw > bx && this.pos.x-hw < bx+1 &&
              this.pos.y+h  > by && this.pos.y    < by+1 &&
              this.pos.z+hw > bz && this.pos.z-hw < bz+1) return true;
        }
      }
    }
    return false;
  }

  _animLegs() {
    const swing = Math.sin(this._legAnim) * 0.5;
    const g = this._mesh;
    // Humanoid
    const legL = g.children.find((c,i) => i === 4);
    const legR = g.children.find((c,i) => i === 5);
    const armL = g.children.find((c,i) => i === 2);
    const armR = g.children.find((c,i) => i === 3);
    if (legL) legL.rotation.x =  swing;
    if (legR) legR.rotation.x = -swing;
    if (armL) armL.rotation.x = -swing * 0.6;
    if (armR) armR.rotation.x =  swing * 0.6;
  }

  /* ── Damage ──────────────────────────────────────────────────────────── */

  takeDamage(amount) {
    this.hp -= amount;
    if (this._flashTimer <= 0) this._flashRed();
    this._flashTimer = 0.25;
    if (this.hp <= 0) this.dead = true;
    // Passive animals flee when hit
    if (!this.def.hostile) this._ai.fledTimer = 5.0;
    // Alert hostile mobs to attack
    if (this.def.hostile)  this._ai.alertTimer = 10.0;
  }

  _flashRed() {
    this._origColors = [];
    this._mesh.traverse(obj => {
      if (obj.isMesh) {
        this._origColors.push({ obj, hex: obj.material.color.getHex() });
        obj.material = obj.material.clone();
        obj.material.color.setHex(0xFF3333);
      }
    });
  }

  _restoreColors() {
    if (!this._origColors) return;
    this._origColors.forEach(({ obj, hex }) => {
      obj.material = obj.material.clone();
      obj.material.color.setHex(hex);
    });
    this._origColors = null;
  }

  remove(scene) {
    scene.remove(this._mesh);
    this._mesh.traverse(obj => {
      if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); }
    });
  }
}

/* ── MobManager ─────────────────────────────────────────────────────────── */

class MobManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.mobs  = [];
    this._spawnTimer = 5;
    this._MAX_MOBS   = 60;
  }

  update(dt, player, sky) {
    const daylight = sky.getDaylight();

    // Spawn
    this._spawnTimer -= dt;
    if (this._spawnTimer <= 0 && this.mobs.length < this._MAX_MOBS) {
      this._spawnTimer = 4 + Math.random() * 4;
      this._trySpawn(player, daylight);
    }

    // Update + reap dead
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      mob.update(dt, player, daylight);
      if (mob.dead) {
        mob.remove(this.scene);
        this.mobs.splice(i, 1);
      }
    }
  }

  _trySpawn(player, daylight) {
    const px = player.position.x;
    const pz = player.position.z;
    const isNight = daylight < 0.15;

    for (let attempt = 0; attempt < 6; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 18 + Math.random() * 20;
      const sx = Math.floor(px + Math.cos(angle) * dist);
      const sz = Math.floor(pz + Math.sin(angle) * dist);
      const sy = this.world.getSpawnY(sx, sz);
      if (sy <= 0 || sy > CHUNK_HEIGHT - 5) continue;

      const type = this._pickType(isNight);
      this.mobs.push(new Mob(type, sx + 0.5, sy, sz + 0.5, this.scene, this.world));
      return;
    }
  }

  _pickType(isNight) {
    if (isNight) {
      const r = Math.random();
      if (r < 0.30) return MOB_TYPE.ZOMBIE;
      if (r < 0.55) return MOB_TYPE.SKELETON;
      if (r < 0.70) return MOB_TYPE.CREEPER;
      if (r < 0.80) return MOB_TYPE.SPIDER;
    }
    // Day or fallback to passives
    const r = Math.random();
    if (r < 0.35) return MOB_TYPE.COW;
    if (r < 0.60) return MOB_TYPE.SHEEP;
    if (r < 0.78) return MOB_TYPE.PIG;
    if (r < 0.90) return MOB_TYPE.CHICKEN;
    return MOB_TYPE.CREEPER; // creepers spawn any time
  }

  /**
   * Try to attack a mob in the direction the player is looking.
   * Returns true if a mob was hit.
   */
  tryAttack(origin, direction, maxDist, damage) {
    let hitMob = null, hitDist = maxDist;
    const ray = new THREE.Ray(origin, direction.clone().normalize());

    for (const mob of this.mobs) {
      const center = mob.pos.clone().setY(mob.pos.y + mob._height() * 0.5);
      const toCam  = center.clone().sub(origin);
      const t      = toCam.dot(ray.direction);
      if (t < 0 || t > hitDist) continue;
      const closest = origin.clone().addScaledVector(ray.direction, t);
      if (closest.distanceTo(center) < 1.1 && t < hitDist) {
        hitMob  = mob;
        hitDist = t;
      }
    }
    if (hitMob) { hitMob.takeDamage(damage); return true; }
    return false;
  }

  /** Get closest mob within range for HUD display */
  getNearbyInfo(playerPos, range) {
    const infos = [];
    for (const mob of this.mobs) {
      const d = mob.pos.distanceTo(playerPos);
      if (d < range) infos.push({ name: mob.def.name, hp: mob.hp, maxHp: mob.def.hp, dist: d });
    }
    return infos.sort((a, b) => a.dist - b.dist).slice(0, 3);
  }
}
