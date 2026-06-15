/**
 * Chunk — stores block data and builds Three.js geometry
 */

const FACE_NORMALS = [
  [ 1, 0, 0],  // +X right
  [-1, 0, 0],  // -X left
  [ 0, 1, 0],  // +Y top
  [ 0,-1, 0],  // -Y bottom
  [ 0, 0, 1],  // +Z front
  [ 0, 0,-1],  // -Z back
];

// Each face: 4 vertices in local offset from block origin
const FACE_VERTS = [
  // +X
  [[1,0,0],[1,1,0],[1,1,1],[1,0,1]],
  // -X
  [[0,0,1],[0,1,1],[0,1,0],[0,0,0]],
  // +Y
  [[0,1,0],[0,1,1],[1,1,1],[1,1,0]],
  // -Y
  [[0,0,1],[0,0,0],[1,0,0],[1,0,1]],
  // +Z
  [[1,0,1],[1,1,1],[0,1,1],[0,0,1]],
  // -Z
  [[0,0,0],[0,1,0],[1,1,0],[1,0,0]],
];

// UV corners for a face quad (counter-clockwise)
const FACE_UVS = [
  [0,0],[0,1],[1,1],[1,0],
];

// Neighbours to check for ambient occlusion for each face axis
const AO_DIRS = [
  // +X face: check in YZ plane at x+1
  [[[0,1,0],[0,0,1],[0,1,1]],[[0,-1,0],[0,0,1],[0,-1,1]],[[0,-1,0],[0,0,-1],[0,-1,-1]],[[0,1,0],[0,0,-1],[0,1,-1]]],
  // -X face
  [[[0,1,0],[0,0,-1],[0,1,-1]],[[0,-1,0],[0,0,-1],[0,-1,-1]],[[0,-1,0],[0,0,1],[0,-1,1]],[[0,1,0],[0,0,1],[0,1,1]]],
  // +Y face: check in XZ plane at y+1
  [[[-1,0,0],[0,0,-1],[-1,0,-1]],[[1,0,0],[0,0,-1],[1,0,-1]],[[1,0,0],[0,0,1],[1,0,1]],[[-1,0,0],[0,0,1],[-1,0,1]]],
  // -Y face
  [[[-1,0,0],[0,0,1],[-1,0,1]],[[1,0,0],[0,0,1],[1,0,1]],[[1,0,0],[0,0,-1],[1,0,-1]],[[-1,0,0],[0,0,-1],[-1,0,-1]]],
  // +Z face
  [[[1,0,0],[0,1,0],[1,1,0]],[[-1,0,0],[0,1,0],[-1,1,0]],[[-1,0,0],[0,-1,0],[-1,-1,0]],[[1,0,0],[0,-1,0],[1,-1,0]]],
  // -Z face
  [[[-1,0,0],[0,1,0],[-1,1,0]],[[1,0,0],[0,1,0],[1,1,0]],[[1,0,0],[0,-1,0],[1,-1,0]],[[-1,0,0],[0,-1,0],[-1,-1,0]]],
];

class Chunk {
  constructor(cx, cz, blocks) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = blocks;  // Uint8Array CHUNK_SIZE*CHUNK_HEIGHT*CHUNK_SIZE
    this.mesh       = null;
    this.waterMesh  = null;
    this.transpMesh = null;
    this.dirty = true;
  }

  getBlock(lx, ly, lz) {
    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE)
      return BlockType.AIR;
    return this.blocks[_idx(lx, ly, lz)];
  }

  setBlock(lx, ly, lz, id) {
    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return;
    this.blocks[_idx(lx, ly, lz)] = id;
    this.dirty = true;
  }

  /** Build (or rebuild) the Three.js meshes for this chunk */
  buildMesh(material, waterMaterial, transpMaterial, world) {
    // Dispose old
    if (this.mesh)       { this.mesh.geometry.dispose();       this.mesh.parent?.remove(this.mesh); }
    if (this.waterMesh)  { this.waterMesh.geometry.dispose();  this.waterMesh.parent?.remove(this.waterMesh); }
    if (this.transpMesh) { this.transpMesh.geometry.dispose(); this.transpMesh.parent?.remove(this.transpMesh); }

    const pos=[], nrm=[], uvs=[], col=[], idx=[];
    const posW=[], nrmW=[], uvsW=[], colW=[], idxW=[];
    const posT=[], nrmT=[], uvsT=[], colT=[], idxT=[];

    const wx0 = this.cx * CHUNK_SIZE;
    const wz0 = this.cz * CHUNK_SIZE;

    for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const id = this.getBlock(lx, ly, lz);
          if (id === BlockType.AIR) continue;

          const props = BLOCK_PROPS[id];
          const faces = BLOCK_FACES[id];
          if (!faces) continue;

          const isWater = props.liquid && id === BlockType.WATER;
          const isTrans = props.transparent && !isWater;

          const arrP = isWater ? posW : (isTrans ? posT : pos);
          const arrN = isWater ? nrmW : (isTrans ? nrmT : nrm);
          const arrU = isWater ? uvsW : (isTrans ? uvsT : uvs);
          const arrC = isWater ? colW : (isTrans ? colT : col);
          const arrI = isWater ? idxW : (isTrans ? idxT : idx);

          for (let f = 0; f < 6; f++) {
            const norm = FACE_NORMALS[f];
            const nx = lx + norm[0];
            const ny = ly + norm[1];
            const nz = lz + norm[2];

            // Get neighbour block (could be in adjacent chunk via world)
            const neighbour = this._getWorldBlock(nx, ny, nz, world);
            const nProps = BLOCK_PROPS[neighbour] || BLOCK_PROPS[0];

            // Show face if neighbour is transparent (but don't show same liquid face)
            if (!nProps.transparent && nProps.solid) continue;
            if (isWater && neighbour === BlockType.WATER) continue;

            const tileIdx = faces[f];
            const uv = getTileUV(tileIdx);
            const baseVtx = arrP.length / 3;

            // Compute AO for the 4 corners
            const aoVals = this._computeFaceAO(lx, ly, lz, f, world);

            for (let v = 0; v < 4; v++) {
              const vert = FACE_VERTS[f][v];
              arrP.push(wx0 + lx + vert[0], ly + vert[1], wz0 + lz + vert[2]);
              arrN.push(norm[0], norm[1], norm[2]);
              // UV within tile
              const fu = FACE_UVS[v][0], fv = FACE_UVS[v][1];
              arrU.push(uv.u + fu * uv.size, uv.v + fv * uv.size);
              const ao = aoVals[v];
              arrC.push(ao, ao, ao);
            }

            // Flip quad for better AO look (anti-aliasing the diagonal)
            if (aoVals[0] + aoVals[3] > aoVals[1] + aoVals[2]) {
              arrI.push(baseVtx,baseVtx+1,baseVtx+2, baseVtx,baseVtx+2,baseVtx+3);
            } else {
              arrI.push(baseVtx+1,baseVtx+2,baseVtx+3, baseVtx,baseVtx+1,baseVtx+3);
            }
          }
        }
      }
    }

    this.mesh       = this._makeThreeMesh(pos, nrm, uvs, col, idx, material);
    this.waterMesh  = this._makeThreeMesh(posW, nrmW, uvsW, colW, idxW, waterMaterial);
    this.transpMesh = this._makeThreeMesh(posT, nrmT, uvsT, colT, idxT, transpMaterial);
    this.dirty = false;
  }

  _makeThreeMesh(pos, nrm, uvs, col, idx, mat) {
    if (idx.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeBoundingBox();
    return new THREE.Mesh(geo, mat);
  }

  _getWorldBlock(lx, ly, lz, world) {
    if (ly < 0) return BlockType.BEDROCK;
    if (ly >= CHUNK_HEIGHT) return BlockType.AIR;
    if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
      return this.getBlock(lx, ly, lz);
    }
    // Neighbour chunk
    if (!world) return BlockType.AIR;
    const wx = this.cx * CHUNK_SIZE + lx;
    const wz = this.cz * CHUNK_SIZE + lz;
    return world.getBlock(wx, ly, wz);
  }

  _computeFaceAO(lx, ly, lz, faceIdx, world) {
    const aoDirs = AO_DIRS[faceIdx];
    const result = [];
    for (let v = 0; v < 4; v++) {
      const [d1, d2, d3] = aoDirs[v];
      const s1 = this._isSolid(lx + d1[0], ly + d1[1], lz + d1[2], world);
      const s2 = this._isSolid(lx + d2[0], ly + d2[1], lz + d2[2], world);
      const s3 = this._isSolid(lx + d3[0], ly + d3[1], lz + d3[2], world);
      const occ = s1 && s2 ? 0 : 3 - (s1 + s2 + s3);
      result.push(0.55 + (occ / 3) * 0.45);
    }
    return result;
  }

  _isSolid(lx, ly, lz, world) {
    const b = this._getWorldBlock(lx, ly, lz, world);
    return (BLOCK_PROPS[b] && BLOCK_PROPS[b].solid) ? 1 : 0;
  }
}
