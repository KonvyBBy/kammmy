/**
 * Terrain generation — biomes, heightmap, caves, ores, and surface features
 */

const CHUNK_SIZE   = 16;
const CHUNK_HEIGHT = 128;
const SEA_LEVEL    = 58;

/** Offset applied to humidity noise sampling to decorrelate it from temperature */
const HUMIDITY_NOISE_OFFSET = 500;

class TerrainGenerator {
  constructor(seed) {
    this.seed     = seed;
    this.heightN  = new SimplexNoise(seed);
    this.detailN  = new SimplexNoise(seed + 1);
    this.ridgeN   = new SimplexNoise(seed + 2);
    this.caveN1   = new SimplexNoise(seed + 3);
    this.caveN2   = new SimplexNoise(seed + 4);
    this.tempN    = new SimplexNoise(seed + 5);
    this.humidN   = new SimplexNoise(seed + 6);
    this.oreN     = new SimplexNoise(seed + 7);
    this.treeN    = new SimplexNoise(seed + 8);
    this.featN    = new SimplexNoise(seed + 9);
  }

  /* ── Biome ──────────────────────────────────────────────────────────────── */

  getBiome(wx, wz) {
    const temp  = (this.tempN.noise2D(wx * 0.0015, wz * 0.0015) * 0.5 + 0.5);
    const humid = (this.humidN.noise2D(wx * 0.0015 + HUMIDITY_NOISE_OFFSET, wz * 0.0015 + HUMIDITY_NOISE_OFFSET) * 0.5 + 0.5);

    if (temp < 0.28)          return humid < 0.5 ? 'tundra'   : 'snowy_taiga';
    if (temp > 0.72)          return humid < 0.40 ? 'desert'  : 'jungle';
    if (temp > 0.55 && humid > 0.65) return 'swamp';
    if (humid < 0.35)         return 'savanna';
    return humid > 0.55 ? 'forest' : 'plains';
  }

  /* ── Height ─────────────────────────────────────────────────────────────── */

  getHeight(wx, wz) {
    const biome = this.getBiome(wx, wz);
    const base  = this.heightN.fbm2D(wx * 0.004, wz * 0.004, 6, 0.5, 2.0) * 0.5 + 0.5;
    const detail = this.detailN.fbm2D(wx * 0.01, wz * 0.01, 4, 0.5, 2.0) * 0.5 + 0.5;

    let height;
    switch (biome) {
      case 'desert':      height = 52 + base * 12 + detail * 5; break;
      case 'tundra':      height = 58 + base * 10 + detail * 4; break;
      case 'snowy_taiga': height = 60 + base * 20 + detail * 8; break;
      case 'jungle':      height = 60 + base * 18 + detail * 6; break;
      case 'savanna':     height = 58 + base * 14 + detail * 4; break;
      case 'swamp':       height = 52 + base * 8 + detail * 3;  break;
      case 'forest':      height = 60 + base * 22 + detail * 8; break;
      default:            height = 58 + base * 18 + detail * 6; // plains
    }

    // Mountain peaks — blend ridge noise for dramatic mountains
    const ridge = Math.abs(this.ridgeN.noise2D(wx * 0.003, wz * 0.003));
    if (ridge > 0.3) height += (ridge - 0.3) * 120;

    return Math.min(CHUNK_HEIGHT - 5, Math.max(4, Math.floor(height)));
  }

  /* ── Cave ───────────────────────────────────────────────────────────────── */

  isCave(wx, wy, wz) {
    if (wy <= 2 || wy >= SEA_LEVEL - 5) return false;
    const n1 = this.caveN1.noise3D(wx * 0.04, wy * 0.08, wz * 0.04);
    const n2 = this.caveN2.noise3D(wx * 0.04 + 100, wy * 0.08 + 100, wz * 0.04 + 100);
    return n1 * n1 + n2 * n2 < 0.018;
  }

  /* ── Ore ────────────────────────────────────────────────────────────────── */

  getOre(wx, wy, wz) {
    if (wy <= 1) return BlockType.BEDROCK;
    const n = this.oreN;
    if (wy <= 10) {
      if (n.noise3D(wx * 0.15, wy * 0.15, wz * 0.15) > 0.64) return BlockType.DIAMOND_ORE;
    }
    if (wy <= 20) {
      if (n.noise3D(wx * 0.13, wy * 0.13 + 50, wz * 0.13) > 0.62) return BlockType.EMERALD_ORE;
    }
    if (wy <= 32) {
      if (n.noise3D(wx * 0.12, wy * 0.12 + 100, wz * 0.12) > 0.60) return BlockType.GOLD_ORE;
    }
    if (wy <= 64) {
      if (n.noise3D(wx * 0.11, wy * 0.11 + 200, wz * 0.11) > 0.56) return BlockType.IRON_ORE;
      if (n.noise3D(wx * 0.10, wy * 0.10 + 300, wz * 0.10) > 0.52) return BlockType.REDSTONE_ORE;
      if (n.noise3D(wx * 0.09, wy * 0.09 + 400, wz * 0.09) > 0.50) return BlockType.COAL_ORE;
    }
    return BlockType.STONE;
  }

  /* ── Chunk data ─────────────────────────────────────────────────────────── */

  generateChunkData(cx, cz) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const wx0 = cx * CHUNK_SIZE;
    const wz0 = cz * CHUNK_SIZE;

    // Pre-compute surface heights and biomes for this chunk column
    const surfaceY = new Int32Array(CHUNK_SIZE * CHUNK_SIZE);
    const biomes   = new Array(CHUNK_SIZE * CHUNK_SIZE);

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = wx0 + lx;
        const wz = wz0 + lz;
        surfaceY[lz * CHUNK_SIZE + lx] = this.getHeight(wx, wz);
        biomes  [lz * CHUNK_SIZE + lx] = this.getBiome(wx, wz);
      }
    }

    // Fill blocks
    for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const wx   = wx0 + lx;
          const wz   = wz0 + lz;
          const surf = surfaceY[lz * CHUNK_SIZE + lx];
          const biome= biomes  [lz * CHUNK_SIZE + lx];
          let id = BlockType.AIR;

          if (ly === 0) {
            id = BlockType.BEDROCK;
          } else if (ly < surf - 4) {
            // Deep underground — ores or stone
            if (this.isCave(wx, ly, wz)) {
              id = ly < SEA_LEVEL - 5 ? BlockType.LAVA : BlockType.AIR;
            } else {
              id = this.getOre(wx, ly, wz);
            }
          } else if (ly < surf) {
            // Sub-surface dirt/sand
            id = (biome === 'desert' || biome === 'savanna') ? BlockType.SAND : BlockType.DIRT;
          } else if (ly === surf) {
            // Surface block
            id = this._surfaceBlock(biome, ly);
          } else if (ly <= SEA_LEVEL) {
            // Below sea level — fill with water
            id = BlockType.WATER;
          }
          // else AIR

          blocks[_idx(lx, ly, lz)] = id;
        }
      }
    }

    // Place features (trees, cacti)
    this._placeFeatures(blocks, cx, cz, wx0, wz0, surfaceY, biomes);

    return blocks;
  }

  _surfaceBlock(biome, y) {
    switch (biome) {
      case 'desert':      return BlockType.SAND;
      case 'savanna':     return y > SEA_LEVEL ? BlockType.GRASS : BlockType.SAND;
      case 'tundra':      return y >= SEA_LEVEL ? BlockType.SNOW_BLOCK : BlockType.ICE;
      case 'snowy_taiga': return y >= SEA_LEVEL ? BlockType.SNOW_BLOCK : BlockType.DIRT;
      case 'swamp':       return BlockType.DIRT;
      default:            return BlockType.GRASS;
    }
  }

  _placeFeatures(blocks, cx, cz, wx0, wz0, surfaceY, biomes) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = wx0 + lx;
        const wz = wz0 + lz;
        const surf = surfaceY[lz * CHUNK_SIZE + lx];
        const biome = biomes[lz * CHUNK_SIZE + lx];

        if (surf < SEA_LEVEL || surf >= CHUNK_HEIGHT - 10) continue;

        const treeRand = (this.treeN.noise2D(wx * 0.3, wz * 0.3) + 1) / 2;
        const featRand = (this.featN.noise2D(wx * 0.25 + 300, wz * 0.25 + 300) + 1) / 2;

        switch (biome) {
          case 'forest':
            if (treeRand > 0.60) this._placeOakTree(blocks, lx, surf + 1, lz);
            break;
          case 'snowy_taiga':
            if (treeRand > 0.65) this._placeSpruceTree(blocks, lx, surf + 1, lz);
            break;
          case 'jungle':
            if (treeRand > 0.55) this._placeOakTree(blocks, lx, surf + 1, lz, 8);
            break;
          case 'desert':
            if (treeRand > 0.88) this._placeCactus(blocks, lx, surf + 1, lz);
            break;
          case 'plains':
            if (treeRand > 0.75) this._placeOakTree(blocks, lx, surf + 1, lz);
            break;
          case 'savanna':
            if (treeRand > 0.82) this._placeOakTree(blocks, lx, surf + 1, lz, 6);
            break;
        }
      }
    }
  }

  _placeOakTree(blocks, lx, ly, lz, trunkH = 5) {
    if (lx < 2 || lx > 13 || lz < 2 || lz > 13) return;
    if (ly + trunkH + 3 >= CHUNK_HEIGHT) return;

    // Trunk
    for (let h = 0; h < trunkH; h++) {
      const y = ly + h;
      if (y < CHUNK_HEIGHT) blocks[_idx(lx, y, lz)] = BlockType.OAK_LOG;
    }

    // Leaves canopy
    const leafY = ly + trunkH;
    for (let dy = -1; dy <= 2; dy++) {
      const r = dy <= 0 ? 2 : 1;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && dy >= 0) continue;
          const nx = lx + dx, nz = lz + dz, ny = leafY + dy;
          if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT) {
            if (blocks[_idx(nx, ny, nz)] === BlockType.AIR) {
              blocks[_idx(nx, ny, nz)] = BlockType.OAK_LEAVES;
            }
          }
        }
      }
    }
  }

  _placeSpruceTree(blocks, lx, ly, lz) {
    if (lx < 2 || lx > 13 || lz < 2 || lz > 13) return;
    const trunkH = 7;
    if (ly + trunkH + 2 >= CHUNK_HEIGHT) return;

    for (let h = 0; h < trunkH; h++) {
      if (ly + h < CHUNK_HEIGHT) blocks[_idx(lx, ly + h, lz)] = BlockType.SPRUCE_LOG;
    }

    // Conical leaves
    for (let tier = 0; tier <= 4; tier++) {
      const r = 2 - Math.floor(tier / 2);
      const base = ly + trunkH - 1 - tier;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) + Math.abs(dz) > r + 1) continue;
          const nx = lx + dx, nz = lz + dz;
          if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE && base >= 0 && base < CHUNK_HEIGHT) {
            if (blocks[_idx(nx, base, nz)] === BlockType.AIR) {
              blocks[_idx(nx, base, nz)] = BlockType.SPRUCE_LEAVES;
            }
          }
        }
      }
    }
    // Top
    const top = ly + trunkH;
    if (top < CHUNK_HEIGHT) blocks[_idx(lx, top, lz)] = BlockType.SPRUCE_LEAVES;
  }

  _placeCactus(blocks, lx, ly, lz) {
    // Use noise-based height so cactus is deterministic per world seed
    const heightNoise = (this.featN.noise2D(lx * 1.7 + 200, lz * 1.7 + 200) + 1) / 2;
    const h = 2 + Math.floor(heightNoise * 3);
    for (let i = 0; i < h; i++) {
      if (ly + i < CHUNK_HEIGHT) blocks[_idx(lx, ly + i, lz)] = BlockType.CACTUS;
    }
  }
}

/** Linear index into flat block array */
function _idx(lx, ly, lz) {
  return (ly * CHUNK_SIZE + lz) * CHUNK_SIZE + lx;
}
