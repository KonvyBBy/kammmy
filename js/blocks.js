/**
 * Block type definitions, properties, and procedural texture atlas generation
 */

const BlockType = {
  AIR:           0,
  GRASS:         1,
  DIRT:          2,
  STONE:         3,
  COBBLESTONE:   4,
  SAND:          5,
  GRAVEL:        6,
  OAK_LOG:       7,
  OAK_PLANKS:    8,
  OAK_LEAVES:    9,
  GLASS:         10,
  WATER:         11,
  LAVA:          12,
  SNOW_BLOCK:    13,
  ICE:           14,
  BEDROCK:       15,
  COAL_ORE:      16,
  IRON_ORE:      17,
  GOLD_ORE:      18,
  DIAMOND_ORE:   19,
  BRICK:         20,
  OBSIDIAN:      21,
  GLOWSTONE:     22,
  SANDSTONE:     23,
  SPRUCE_LOG:    24,
  SPRUCE_LEAVES: 25,
  SPRUCE_PLANKS: 26,
  CACTUS:        27,
  MOSSY_COBBLE:  28,
  CRAFTING_TABLE:29,
  BOOKSHELF:     30,
  TNT:           31,
  WOOL_WHITE:    32,
  WOOL_RED:      33,
  WOOL_BLUE:     34,
  WOOL_GREEN:    35,
  PUMPKIN:       36,
  EMERALD_ORE:   37,
  REDSTONE_ORE:  38,
  NETHERRACK:    39,
  SOUL_SAND:     40,
};

const BLOCK_COUNT = Object.keys(BlockType).length;

/* ─── Block Face Tile Indices ─────────────────────────────────────────────── */
// Faces: [+X, -X, +Y(top), -Y(bottom), +Z, -Z]  (all sides default same tile)
const TILE = {
  GRASS_TOP:      0,
  GRASS_SIDE:     1,
  DIRT:           2,
  STONE:          3,
  COBBLE:         4,
  SAND:           5,
  GRAVEL:         6,
  OAK_LOG_TOP:    7,
  OAK_LOG_SIDE:   8,
  OAK_PLANKS:     9,
  OAK_LEAVES:     10,
  GLASS:          11,
  WATER:          12,
  LAVA:           13,
  SNOW:           14,
  ICE:            15,
  BEDROCK:        16,
  COAL_ORE:       17,
  IRON_ORE:       18,
  GOLD_ORE:       19,
  DIAMOND_ORE:    20,
  BRICK:          21,
  OBSIDIAN:       22,
  GLOWSTONE:      23,
  SANDSTONE_TOP:  24,
  SANDSTONE_SIDE: 25,
  SPRUCE_LOG_SIDE:26,
  SPRUCE_LEAVES:  27,
  CACTUS_SIDE:    28,
  CACTUS_TOP:     29,
  MOSSY_COBBLE:   30,
  CRAFTING_TOP:   31,
  CRAFTING_SIDE:  32,
  BOOKSHELF:      33,
  TNT_TOP:        34,
  TNT_SIDE:       35,
  WOOL_WHITE:     36,
  WOOL_RED:       37,
  WOOL_BLUE:      38,
  WOOL_GREEN:     39,
  PUMPKIN_SIDE:   40,
  PUMPKIN_FACE:   41,
  PUMPKIN_TOP:    42,
  EMERALD_ORE:    43,
  REDSTONE_ORE:   44,
  NETHERRACK:     45,
  SOUL_SAND:      46,
  SPRUCE_PLANKS:  47,
};

/**
 * Block face tile assignments: [right, left, top, bottom, front, back]
 * All faces same unless specified.
 */
const BLOCK_FACES = {
  [BlockType.GRASS]:         [TILE.GRASS_SIDE, TILE.GRASS_SIDE, TILE.GRASS_TOP,   TILE.DIRT,         TILE.GRASS_SIDE, TILE.GRASS_SIDE],
  [BlockType.DIRT]:          Array(6).fill(TILE.DIRT),
  [BlockType.STONE]:         Array(6).fill(TILE.STONE),
  [BlockType.COBBLESTONE]:   Array(6).fill(TILE.COBBLE),
  [BlockType.SAND]:          Array(6).fill(TILE.SAND),
  [BlockType.GRAVEL]:        Array(6).fill(TILE.GRAVEL),
  [BlockType.OAK_LOG]:       [TILE.OAK_LOG_SIDE, TILE.OAK_LOG_SIDE, TILE.OAK_LOG_TOP, TILE.OAK_LOG_TOP, TILE.OAK_LOG_SIDE, TILE.OAK_LOG_SIDE],
  [BlockType.OAK_PLANKS]:    Array(6).fill(TILE.OAK_PLANKS),
  [BlockType.OAK_LEAVES]:    Array(6).fill(TILE.OAK_LEAVES),
  [BlockType.GLASS]:         Array(6).fill(TILE.GLASS),
  [BlockType.WATER]:         Array(6).fill(TILE.WATER),
  [BlockType.LAVA]:          Array(6).fill(TILE.LAVA),
  [BlockType.SNOW_BLOCK]:    Array(6).fill(TILE.SNOW),
  [BlockType.ICE]:           Array(6).fill(TILE.ICE),
  [BlockType.BEDROCK]:       Array(6).fill(TILE.BEDROCK),
  [BlockType.COAL_ORE]:      Array(6).fill(TILE.COAL_ORE),
  [BlockType.IRON_ORE]:      Array(6).fill(TILE.IRON_ORE),
  [BlockType.GOLD_ORE]:      Array(6).fill(TILE.GOLD_ORE),
  [BlockType.DIAMOND_ORE]:   Array(6).fill(TILE.DIAMOND_ORE),
  [BlockType.BRICK]:         Array(6).fill(TILE.BRICK),
  [BlockType.OBSIDIAN]:      Array(6).fill(TILE.OBSIDIAN),
  [BlockType.GLOWSTONE]:     Array(6).fill(TILE.GLOWSTONE),
  [BlockType.SANDSTONE]:     [TILE.SANDSTONE_SIDE, TILE.SANDSTONE_SIDE, TILE.SANDSTONE_TOP, TILE.SAND, TILE.SANDSTONE_SIDE, TILE.SANDSTONE_SIDE],
  [BlockType.SPRUCE_LOG]:    [TILE.SPRUCE_LOG_SIDE, TILE.SPRUCE_LOG_SIDE, TILE.OAK_LOG_TOP, TILE.OAK_LOG_TOP, TILE.SPRUCE_LOG_SIDE, TILE.SPRUCE_LOG_SIDE],
  [BlockType.SPRUCE_LEAVES]: Array(6).fill(TILE.SPRUCE_LEAVES),
  [BlockType.SPRUCE_PLANKS]: Array(6).fill(TILE.SPRUCE_PLANKS),
  [BlockType.CACTUS]:        [TILE.CACTUS_SIDE, TILE.CACTUS_SIDE, TILE.CACTUS_TOP, TILE.CACTUS_TOP, TILE.CACTUS_SIDE, TILE.CACTUS_SIDE],
  [BlockType.MOSSY_COBBLE]:  Array(6).fill(TILE.MOSSY_COBBLE),
  [BlockType.CRAFTING_TABLE]:[TILE.CRAFTING_SIDE, TILE.CRAFTING_SIDE, TILE.CRAFTING_TOP, TILE.OAK_PLANKS, TILE.CRAFTING_SIDE, TILE.CRAFTING_SIDE],
  [BlockType.BOOKSHELF]:     [TILE.BOOKSHELF, TILE.BOOKSHELF, TILE.OAK_PLANKS, TILE.OAK_PLANKS, TILE.BOOKSHELF, TILE.BOOKSHELF],
  [BlockType.TNT]:           [TILE.TNT_SIDE, TILE.TNT_SIDE, TILE.TNT_TOP, TILE.TNT_TOP, TILE.TNT_SIDE, TILE.TNT_SIDE],
  [BlockType.WOOL_WHITE]:    Array(6).fill(TILE.WOOL_WHITE),
  [BlockType.WOOL_RED]:      Array(6).fill(TILE.WOOL_RED),
  [BlockType.WOOL_BLUE]:     Array(6).fill(TILE.WOOL_BLUE),
  [BlockType.WOOL_GREEN]:    Array(6).fill(TILE.WOOL_GREEN),
  [BlockType.PUMPKIN]:       [TILE.PUMPKIN_SIDE, TILE.PUMPKIN_SIDE, TILE.PUMPKIN_TOP, TILE.PUMPKIN_TOP, TILE.PUMPKIN_FACE, TILE.PUMPKIN_SIDE],
  [BlockType.EMERALD_ORE]:   Array(6).fill(TILE.EMERALD_ORE),
  [BlockType.REDSTONE_ORE]:  Array(6).fill(TILE.REDSTONE_ORE),
  [BlockType.NETHERRACK]:    Array(6).fill(TILE.NETHERRACK),
  [BlockType.SOUL_SAND]:     Array(6).fill(TILE.SOUL_SAND),
};
// Normalize all face arrays to length 6
for (const id in BLOCK_FACES) {
  const f = BLOCK_FACES[id];
  while (f.length < 6) f.push(f[0]);
}

/** Block physical/render properties */
const BLOCK_PROPS = (() => {
  const p = {};
  for (let i = 0; i <= BlockType.SOUL_SAND; i++) {
    p[i] = { solid: true, transparent: false, liquid: false, luminance: 0, hardness: 1 };
  }
  p[BlockType.AIR]       = { solid: false, transparent: true,  liquid: false, luminance: 0, hardness: 0 };
  p[BlockType.WATER]     = { solid: false, transparent: true,  liquid: true,  luminance: 0, hardness: 0 };
  p[BlockType.LAVA]      = { solid: false, transparent: false, liquid: true,  luminance: 15, hardness: 0 };
  p[BlockType.OAK_LEAVES]     = { solid: true, transparent: true,  liquid: false, luminance: 0, hardness: 0.2 };
  p[BlockType.SPRUCE_LEAVES]  = { solid: true, transparent: true,  liquid: false, luminance: 0, hardness: 0.2 };
  p[BlockType.GLASS]     = { solid: true, transparent: true,  liquid: false, luminance: 0, hardness: 0.3 };
  p[BlockType.ICE]       = { solid: true, transparent: true,  liquid: false, luminance: 0, hardness: 0.5 };
  p[BlockType.GLOWSTONE] = { solid: true, transparent: false, liquid: false, luminance: 15, hardness: 0.3 };
  p[BlockType.BEDROCK]   = { solid: true, transparent: false, liquid: false, luminance: 0, hardness: Infinity };
  p[BlockType.OBSIDIAN]  = { solid: true, transparent: false, liquid: false, luminance: 0, hardness: 50 };
  p[BlockType.CACTUS]    = { solid: true, transparent: false, liquid: false, luminance: 0, hardness: 0.4 };
  return p;
})();

/* ─── Texture Atlas Generation ────────────────────────────────────────────── */

const ATLAS_TILE_SIZE = 16;   // pixels per tile
const ATLAS_TILES_ROW = 16;   // tiles per row/column
const ATLAS_SIZE = ATLAS_TILE_SIZE * ATLAS_TILES_ROW; // 256x256

function generateTextureAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d');

  const S = ATLAS_TILE_SIZE;
  const T = ATLAS_TILES_ROW;

  /** Helper: get tile top-left pixel coords */
  function tileXY(idx) {
    return { tx: (idx % T) * S, ty: Math.floor(idx / T) * S };
  }

  /** Draw a uniform color with noise variation */
  function drawNoise(idx, r,g,b, variation=20) {
    const {tx,ty} = tileXY(idx);
    for (let px=0; px<S; px++) for (let py=0; py<S; py++) {
      const v = (Math.random()-0.5)*variation;
      ctx.fillStyle = `rgb(${r+v|0},${g+v|0},${b+v|0})`;
      ctx.fillRect(tx+px, ty+py, 1, 1);
    }
  }

  function drawPixel(idx, px, py, r,g,b,a=255) {
    const {tx,ty} = tileXY(idx);
    ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
    ctx.fillRect(tx+px, ty+py, 1, 1);
  }

  function fill(idx, r,g,b) {
    const {tx,ty} = tileXY(idx);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(tx, ty, S, S);
  }

  /* ── GRASS_TOP (0) ── lush green with lighter dots */
  fill(TILE.GRASS_TOP, 80, 140, 30);
  for (let i=0;i<30;i++) {
    const px=Math.random()*S|0, py=Math.random()*S|0;
    const v=(Math.random()-0.5)*25;
    drawPixel(TILE.GRASS_TOP, px,py, 80+v,140+v,30+v);
  }

  /* ── GRASS_SIDE (1) ── */
  {
    const {tx,ty} = tileXY(TILE.GRASS_SIDE);
    // Dirt bottom
    for (let py=4;py<S;py++) for (let px=0;px<S;px++) {
      const v=(Math.random()-0.5)*18;
      ctx.fillStyle=`rgb(${134+v|0},${96+v|0},${67+v|0})`;ctx.fillRect(tx+px,ty+py,1,1);
    }
    // Green top band
    for (let py=0;py<4;py++) for (let px=0;px<S;px++) {
      const v=(Math.random()-0.5)*20;
      ctx.fillStyle=`rgb(${80+v|0},${140+v|0},${30+v|0})`;ctx.fillRect(tx+px,ty+py,1,1);
    }
  }

  /* ── DIRT (2) ── */
  drawNoise(TILE.DIRT, 134, 96, 67, 20);

  /* ── STONE (3) ── */
  drawNoise(TILE.STONE, 128, 128, 128, 25);
  for (let i=0;i<8;i++) {
    const px=Math.random()*14|0, py=Math.random()*14|0;
    drawPixel(TILE.STONE,px,py,80,80,80);
    drawPixel(TILE.STONE,px+1,py,80,80,80);
  }

  /* ── COBBLESTONE (4) ── */
  drawNoise(TILE.COBBLE, 105, 105, 105, 30);
  for (let cy=0;cy<4;cy++) for (let cx=0;cx<4;cx++) {
    const px=(cx*4+(cy%2)*2)|0, py=cy*4;
    for(let d=0;d<4;d++){
      drawPixel(TILE.COBBLE,px+d,py,70,70,70);
      drawPixel(TILE.COBBLE,px,py+d,70,70,70);
    }
  }

  /* ── SAND (5) ── */
  drawNoise(TILE.SAND, 210, 190, 130, 15);

  /* ── GRAVEL (6) ── */
  drawNoise(TILE.GRAVEL, 150, 150, 148, 30);
  for (let i=0;i<20;i++){
    const px=Math.random()*S|0, py=Math.random()*S|0;
    drawPixel(TILE.GRAVEL,px,py,180,180,180);
  }

  /* ── OAK_LOG_TOP (7) ── rings */
  fill(TILE.OAK_LOG_TOP, 188, 152, 98);
  for(let r=6;r>0;r-=2){
    const {tx,ty}=tileXY(TILE.OAK_LOG_TOP);
    ctx.strokeStyle=`rgba(120,80,40,0.5)`;ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(tx+8,ty+8,r,0,Math.PI*2);ctx.stroke();
  }

  /* ── OAK_LOG_SIDE (8) ── vertical grain */
  {
    fill(TILE.OAK_LOG_SIDE, 162, 130, 78);
    const {tx,ty}=tileXY(TILE.OAK_LOG_SIDE);
    for(let px=0;px<S;px+=3){
      ctx.fillStyle='rgba(100,70,40,0.4)';ctx.fillRect(tx+px,ty,1,S);
    }
  }

  /* ── OAK_PLANKS (9) ── */
  fill(TILE.OAK_PLANKS, 185, 148, 90);
  for(let py=0;py<S;py+=4) drawPixel(TILE.OAK_PLANKS,0,py,140,100,60);
  for(let i=0;i<2;i++){
    drawPixel(TILE.OAK_PLANKS,0,i*8,140,100,60);
    drawPixel(TILE.OAK_PLANKS,8,i*8+4,140,100,60);
  }

  /* ── OAK_LEAVES (10) ── dithered green */
  {
    const {tx,ty}=tileXY(TILE.OAK_LEAVES);
    ctx.clearRect(tx,ty,S,S);
    for(let py=0;py<S;py++) for(let px=0;px<S;px++){
      if(Math.random()<0.85){
        const v=(Math.random()-0.5)*30;
        ctx.fillStyle=`rgba(${50+v|0},${120+v|0},${30+v|0},1)`;
        ctx.fillRect(tx+px,ty+py,1,1);
      }
    }
  }

  /* ── GLASS (11) ── */
  {
    const {tx,ty}=tileXY(TILE.GLASS);
    ctx.clearRect(tx,ty,S,S);
    ctx.fillStyle='rgba(180,210,240,0.25)';ctx.fillRect(tx,ty,S,S);
    ctx.strokeStyle='rgba(150,190,220,0.7)';ctx.lineWidth=1;
    ctx.strokeRect(tx+0.5,ty+0.5,S-1,S-1);
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+S,ty+S);ctx.stroke();
  }

  /* ── WATER (12) ── */
  {
    const {tx,ty}=tileXY(TILE.WATER);
    ctx.clearRect(tx,ty,S,S);
    for(let py=0;py<S;py++) for(let px=0;px<S;px++){
      const n=(Math.sin(px*0.7+py*0.4)*0.5+0.5)*30;
      ctx.fillStyle=`rgba(${20+n|0},${80+n|0},${200+n|0},0.75)`;
      ctx.fillRect(tx+px,ty+py,1,1);
    }
  }

  /* ── LAVA (13) ── */
  for(let py=0;py<S;py++) for(let px=0;px<S;px++){
    const n=(Math.sin(px*0.5)*Math.cos(py*0.5)+1)*0.5;
    drawPixel(TILE.LAVA, px,py, 220+n*30|0, 80+n*60|0, 0);
  }

  /* ── SNOW (14) ── */
  drawNoise(TILE.SNOW, 240, 245, 255, 8);

  /* ── ICE (15) ── */
  {
    const {tx,ty}=tileXY(TILE.ICE);
    ctx.clearRect(tx,ty,S,S);
    ctx.fillStyle='rgba(160,200,240,0.6)';ctx.fillRect(tx,ty,S,S);
    for(let i=0;i<5;i++){
      ctx.strokeStyle='rgba(180,220,255,0.5)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(tx+Math.random()*S,ty);ctx.lineTo(tx+Math.random()*S,ty+S);ctx.stroke();
    }
  }

  /* ── BEDROCK (16) ── */
  drawNoise(TILE.BEDROCK, 40, 40, 40, 20);
  for(let i=0;i<15;i++) drawPixel(TILE.BEDROCK,Math.random()*S|0,Math.random()*S|0,60,60,60);

  /* ── ORE helper ── */
  function drawOre(tileIdx, stoneR,stoneG,stoneB, oreR,oreG,oreB) {
    drawNoise(tileIdx, stoneR,stoneG,stoneB, 20);
    // Ore veins
    for(let i=0;i<6;i++){
      const px=2+Math.random()*12|0, py=2+Math.random()*12|0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        if(Math.random()<0.7) drawPixel(tileIdx,px+dx,py+dy, oreR,oreG,oreB);
      }
    }
  }
  drawOre(TILE.COAL_ORE,    128,128,128, 20,20,20);
  drawOre(TILE.IRON_ORE,    128,128,128, 200,150,110);
  drawOre(TILE.GOLD_ORE,    128,128,128, 250,220,30);
  drawOre(TILE.DIAMOND_ORE, 128,128,128, 30,220,230);
  drawOre(TILE.EMERALD_ORE, 128,128,128, 30,200,80);
  drawOre(TILE.REDSTONE_ORE,128,128,128, 200,20,20);

  /* ── BRICK (21) ── */
  fill(TILE.BRICK, 175, 80, 65);
  {const {tx,ty}=tileXY(TILE.BRICK);
  ctx.fillStyle='#999';
  for(let py=0;py<S;py+=4){ctx.fillRect(tx,ty+py,S,1);}
  for(let py=0;py<S;py+=8){ctx.fillRect(tx+8,ty+py+1,1,3);}
  for(let py=4;py<S;py+=8){ctx.fillRect(tx+0,ty+py+1,1,3);ctx.fillRect(tx+S-1,ty+py+1,1,3);}
  }

  /* ── OBSIDIAN (22) ── */
  drawNoise(TILE.OBSIDIAN, 20, 15, 30, 10);
  for(let i=0;i<8;i++) drawPixel(TILE.OBSIDIAN,Math.random()*S|0,Math.random()*S|0,60,40,80);

  /* ── GLOWSTONE (23) ── */
  for(let py=0;py<S;py++) for(let px=0;px<S;px++){
    const v=(Math.random()-0.5)*15;
    drawPixel(TILE.GLOWSTONE, px,py, 240+v|0, 190+v|0, 80+v|0);
  }

  /* ── SANDSTONE_TOP (24) ── */
  drawNoise(TILE.SANDSTONE_TOP, 215,195,135, 10);

  /* ── SANDSTONE_SIDE (25) ── wavy lines */
  fill(TILE.SANDSTONE_SIDE, 210,190,130);
  for(let py=3;py<S;py+=5){
    const {tx,ty}=tileXY(TILE.SANDSTONE_SIDE);
    ctx.fillStyle='rgba(170,150,90,0.5)';ctx.fillRect(tx,ty+py,S,1);
  }

  /* ── SPRUCE_LOG_SIDE (26) ── dark */
  fill(TILE.SPRUCE_LOG_SIDE, 90, 70, 45);
  {const {tx,ty}=tileXY(TILE.SPRUCE_LOG_SIDE);
  for(let px=0;px<S;px+=3){ctx.fillStyle='rgba(60,40,20,0.4)';ctx.fillRect(tx+px,ty,1,S);}
  }

  /* ── SPRUCE_LEAVES (27) ── darker green */
  {
    const {tx,ty}=tileXY(TILE.SPRUCE_LEAVES);
    ctx.clearRect(tx,ty,S,S);
    for(let py=0;py<S;py++) for(let px=0;px<S;px++){
      if(Math.random()<0.82){
        const v=(Math.random()-0.5)*20;
        ctx.fillStyle=`rgba(${30+v|0},${90+v|0},${40+v|0},1)`;
        ctx.fillRect(tx+px,ty+py,1,1);
      }
    }
  }

  /* ── CACTUS_SIDE (28) ── */
  fill(TILE.CACTUS_SIDE, 60, 140, 40);
  for(let py=0;py<S;py+=3) drawPixel(TILE.CACTUS_SIDE,0,py,40,110,20);

  /* ── CACTUS_TOP (29) ── */
  fill(TILE.CACTUS_TOP, 60, 150, 40);

  /* ── MOSSY_COBBLE (30) ── */
  drawNoise(TILE.MOSSY_COBBLE, 100,115,90, 25);

  /* ── CRAFTING_TOP (31) ── */
  fill(TILE.CRAFTING_TOP, 185,148,90);
  {const {tx,ty}=tileXY(TILE.CRAFTING_TOP);
  ctx.fillStyle='#8B6914';
  ctx.fillRect(tx+2,ty+2,12,12);
  ctx.fillStyle='#4a3000';
  ctx.fillRect(tx+4,ty+4,3,3);
  ctx.fillRect(tx+9,ty+4,3,3);
  ctx.fillRect(tx+4,ty+9,3,3);
  ctx.fillRect(tx+9,ty+9,3,3);
  }

  /* ── CRAFTING_SIDE (32) ── */
  fill(TILE.CRAFTING_SIDE, 185,148,90);
  {const {tx,ty}=tileXY(TILE.CRAFTING_SIDE);
  ctx.fillStyle='#8B6914';
  ctx.fillRect(tx+2,ty+6,12,4);
  }

  /* ── BOOKSHELF (33) ── */
  fill(TILE.BOOKSHELF, 162,130,78);
  {const {tx,ty}=tileXY(TILE.BOOKSHELF);
  const colors=['#a33','#33a','#3a3','#aa3','#a3a'];
  let ci=0;
  for(let bx=1;bx<S-1;bx+=3){
    ctx.fillStyle=colors[ci%colors.length];ci++;
    ctx.fillRect(tx+bx,ty+2,2,12);
  }
  }

  /* ── TNT_TOP (34) ── */
  fill(TILE.TNT_TOP, 180,50,50);
  {const {tx,ty}=tileXY(TILE.TNT_TOP);
  ctx.fillStyle='#eee';ctx.fillRect(tx+4,ty+4,8,8);
  ctx.fillStyle='#c00';ctx.fillRect(tx+5,ty+5,6,6);
  }

  /* ── TNT_SIDE (35) ── */
  fill(TILE.TNT_SIDE, 170,50,50);
  {const {tx,ty}=tileXY(TILE.TNT_SIDE);
  ctx.fillStyle='#eee';ctx.fillRect(tx+3,ty+4,10,8);
  ctx.fillStyle='#333';
  ctx.font='5px sans-serif';ctx.fillText('TNT',tx+4,ty+10);
  }

  /* ── WOOLS ── */
  drawNoise(TILE.WOOL_WHITE, 220,220,220, 10);
  drawNoise(TILE.WOOL_RED,   190,40,40, 15);
  drawNoise(TILE.WOOL_BLUE,  40,50,190, 15);
  drawNoise(TILE.WOOL_GREEN, 50,140,50, 15);

  /* ── PUMPKIN ── */
  drawNoise(TILE.PUMPKIN_SIDE, 215,130,25, 20);
  for(let py=0;py<S;py+=2) drawPixel(TILE.PUMPKIN_SIDE,0,py,180,100,15);
  fill(TILE.PUMPKIN_TOP, 145,100,20);
  drawNoise(TILE.PUMPKIN_FACE, 215,130,25, 20);
  // Pumpkin face
  {const {tx,ty}=tileXY(TILE.PUMPKIN_FACE);
  ctx.fillStyle='#2a1a00';
  ctx.fillRect(tx+3,ty+5,2,2);
  ctx.fillRect(tx+11,ty+5,2,2);
  for(let px=4;px<13;px++) ctx.fillRect(tx+px,ty+10,1,2);
  ctx.fillRect(tx+5,ty+9,1,1);ctx.fillRect(tx+8,ty+9,1,1);ctx.fillRect(tx+11,ty+9,1,1);
  }

  /* ── NETHERRACK (45) ── */
  drawNoise(TILE.NETHERRACK, 100,35,35, 25);

  /* ── SOUL_SAND (46) ── */
  drawNoise(TILE.SOUL_SAND, 70,58,45, 15);
  {const {tx,ty}=tileXY(TILE.SOUL_SAND);
  ctx.fillStyle='rgba(20,10,5,0.5)';
  ctx.fillRect(tx+3,ty+3,3,3);ctx.fillRect(tx+10,ty+7,3,3);ctx.fillRect(tx+5,ty+11,3,3);
  }

  /* ── SPRUCE_PLANKS (47) ── */
  fill(TILE.SPRUCE_PLANKS, 115,85,55);
  for(let py=0;py<S;py+=4) drawPixel(TILE.SPRUCE_PLANKS,0,py,80,55,30);

  return canvas;
}

/** Get UV coords for a tile index (returns {u, v, size}) */
function getTileUV(tileIdx) {
  const size = 1 / ATLAS_TILES_ROW;
  // Three.js CanvasTexture uses flipY=true by default, which means v=0 is the
  // canvas bottom.  Tiles are drawn at the canvas top, so we must flip the row
  // index: row 0 → v = 1 - size, row 1 → v = 1 - 2*size, etc.
  const row = Math.floor(tileIdx / ATLAS_TILES_ROW);
  return {
    u: (tileIdx % ATLAS_TILES_ROW) * size,
    v: 1 - (row + 1) * size,
    size,
  };
}

/** Default hotbar block selection */
const DEFAULT_HOTBAR = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.COBBLESTONE,
  BlockType.OAK_PLANKS,
  BlockType.OAK_LOG,
  BlockType.OAK_LEAVES,
  BlockType.GLASS,
  BlockType.SAND,
];
