/**
 * World — manages chunks, materials, and global block access
 */

const RENDER_DISTANCE = 7;   // chunk radius (chunks from center in each axis direction)
const BUILD_DISTANCE  = RENDER_DISTANCE + 1;

class World {
  constructor(scene, atlasCanvas, seed) {
    this.scene  = scene;
    this.seed   = seed;
    this.chunks = new Map();  // key: "cx,cz"
    this.terrain = new TerrainGenerator(seed);

    this._buildMaterials(atlasCanvas);
    this._buildQueue = [];
    this._meshQueue  = [];
  }

  /* ── Materials ─────────────────────────────────────────────────────────── */

  _buildMaterials(atlasCanvas) {
    const atlasTex = new THREE.CanvasTexture(atlasCanvas);
    atlasTex.magFilter = THREE.NearestFilter;
    atlasTex.minFilter = THREE.NearestMipmapLinearFilter;
    atlasTex.generateMipmaps = true;

    this.solidMat = new THREE.MeshLambertMaterial({
      map: atlasTex,
      vertexColors: true,
    });

    this.waterMat = new THREE.MeshLambertMaterial({
      map: atlasTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });

    this.transpMat = new THREE.MeshLambertMaterial({
      map: atlasTex,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.4,
    });
  }

  /* ── Chunk lookup ───────────────────────────────────────────────────────── */

  _key(cx, cz) { return `${cx},${cz}`; }

  getChunk(cx, cz) { return this.chunks.get(this._key(cx, cz)) || null; }

  loadChunk(cx, cz) {
    const key = this._key(cx, cz);
    if (this.chunks.has(key)) return;

    const blocks = this.terrain.generateChunkData(cx, cz);
    const chunk  = new Chunk(cx, cz, blocks);
    this.chunks.set(key, chunk);
    this._meshQueue.push(chunk);
  }

  /* ── Tick — load/unload chunks around player ────────────────────────────── */

  update(playerX, playerZ) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);

    // Load missing chunks
    for (let dz = -BUILD_DISTANCE; dz <= BUILD_DISTANCE; dz++) {
      for (let dx = -BUILD_DISTANCE; dx <= BUILD_DISTANCE; dx++) {
        if (dx*dx + dz*dz > BUILD_DISTANCE*BUILD_DISTANCE) continue;
        this.loadChunk(pcx + dx, pcz + dz);
      }
    }

    // Rebuild dirty / newly queued meshes (limit per frame for smoothness)
    let built = 0;
    while (this._meshQueue.length > 0 && built < 2) {
      const chunk = this._meshQueue.shift();
      this._buildChunkMesh(chunk);
      built++;
    }
    // Also rebuild any chunk flagged dirty
    if (built < 2) {
      for (const chunk of this.chunks.values()) {
        if (chunk.dirty && !this._meshQueue.includes(chunk)) {
          this._buildChunkMesh(chunk);
          built++;
          if (built >= 2) break;
        }
      }
    }

    // Unload far chunks
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.cx - pcx, dz = chunk.cz - pcz;
      if (Math.abs(dx) > BUILD_DISTANCE + 2 || Math.abs(dz) > BUILD_DISTANCE + 2) {
        this._unloadChunk(chunk, key);
      }
    }
  }

  _buildChunkMesh(chunk) {
    chunk.buildMesh(this.solidMat, this.waterMat, this.transpMat, this);
    if (chunk.mesh)       this.scene.add(chunk.mesh);
    if (chunk.waterMesh)  this.scene.add(chunk.waterMesh);
    if (chunk.transpMesh) this.scene.add(chunk.transpMesh);
  }

  _unloadChunk(chunk, key) {
    if (chunk.mesh)       { chunk.mesh.geometry.dispose();       this.scene.remove(chunk.mesh); }
    if (chunk.waterMesh)  { chunk.waterMesh.geometry.dispose();  this.scene.remove(chunk.waterMesh); }
    if (chunk.transpMesh) { chunk.transpMesh.geometry.dispose(); this.scene.remove(chunk.transpMesh); }
    this.chunks.delete(key);
  }

  /* ── Block access ───────────────────────────────────────────────────────── */

  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return BlockType.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BlockType.AIR;
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    return chunk.getBlock(lx, wy, lz);
  }

  setBlock(wx, wy, wz, id) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return;
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    chunk.setBlock(lx, wy, lz, id);

    // Mark adjacent chunks dirty for edge blocks
    if (lx === 0)              this._markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this._markDirty(cx + 1, cz);
    if (lz === 0)              this._markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this._markDirty(cx, cz + 1);
  }

  _markDirty(cx, cz) {
    const chunk = this.getChunk(cx, cz);
    if (chunk) chunk.dirty = true;
  }

  /** Raycast world blocks — returns {blockPos, faceNormal} or null */
  raycast(origin, direction, maxDist = 5) {
    // DDA voxel traversal
    const pos  = [origin.x, origin.y, origin.z];
    const dir  = [direction.x, direction.y, direction.z];
    const step = [dir[0] < 0 ? -1 : 1, dir[1] < 0 ? -1 : 1, dir[2] < 0 ? -1 : 1];
    const tDelta = [Math.abs(1 / dir[0]), Math.abs(1 / dir[1]), Math.abs(1 / dir[2])];
    const cur  = [Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2])];
    const tMax = [
      (step[0] > 0 ? cur[0]+1-pos[0] : pos[0]-cur[0]) * tDelta[0],
      (step[1] > 0 ? cur[1]+1-pos[1] : pos[1]-cur[1]) * tDelta[1],
      (step[2] > 0 ? cur[2]+1-pos[2] : pos[2]-cur[2]) * tDelta[2],
    ];

    let lastFace = null;
    let t = 0;

    while (t < maxDist) {
      const b = this.getBlock(cur[0], cur[1], cur[2]);
      if (b !== BlockType.AIR && BLOCK_PROPS[b] && BLOCK_PROPS[b].solid) {
        return {
          blockPos: { x: cur[0], y: cur[1], z: cur[2] },
          face: lastFace,
        };
      }

      // Advance to next voxel
      let axis;
      if (tMax[0] < tMax[1] && tMax[0] < tMax[2]) axis = 0;
      else if (tMax[1] < tMax[2]) axis = 1;
      else axis = 2;

      lastFace = [0, 0, 0];
      lastFace[axis] = -step[axis];
      t = tMax[axis];
      cur[axis] += step[axis];
      tMax[axis] += tDelta[axis];
    }
    return null;
  }

  /** Find the spawn Y for a given X,Z */
  getSpawnY(wx, wz) {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const b = this.getBlock(wx, y, wz);
      if (b !== BlockType.AIR && b !== BlockType.WATER && BLOCK_PROPS[b] && BLOCK_PROPS[b].solid) {
        return y + 2;
      }
    }
    return SEA_LEVEL + 5;
  }
}
