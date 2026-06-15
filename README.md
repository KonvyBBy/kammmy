# VoxelCraft — Minecraft Clone

A feature-rich, browser-based Minecraft-inspired voxel game built with **Three.js**.

## 🎮 Play

Open `index.html` in a local HTTP server (required for loading JS modules):

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# Then open http://localhost:8080
```

> **Note:** You cannot open `index.html` directly from the file system (`file://`) because browsers block cross-origin script loading. Use any local HTTP server.

---

## 🕹️ Controls

| Key / Action | Function |
|---|---|
| `W A S D` | Move |
| `SPACE` | Jump / Fly up |
| `SHIFT` | Sneak / Fly down |
| `CTRL` | Sprint |
| `F` | Toggle fly mode |
| `Mouse` | Look around |
| `Left Click` | Break block |
| `Right Click` | Place block |
| `1 – 9` | Select hotbar slot |
| `Scroll Wheel` | Cycle hotbar |
| `F3` | Toggle debug overlay |
| `ESC` | Pause / Resume |

---

## ✨ Features

### World & Terrain
- **Infinite procedural world** using multi-octave Simplex noise
- **8 biomes**: Plains, Forest, Desert, Tundra, Snowy Taiga, Jungle, Savanna, Swamp
- **Mountain ridges** — dramatic peaks using ridge-folded noise
- **Caves** — 3D Simplex noise carving through the underground
- **Sea level** with water-filled oceans and lakes
- **Ore generation** — Coal, Iron, Gold, Redstone, Emerald, Diamond at appropriate depths
- **Trees** — Oak trees in forests/plains, Spruce in snowy biomes, Cacti in deserts
- **Chunk system** — 16×16×128 chunks, dynamically loaded/unloaded around the player

### Blocks (40+ types)
Grass, Dirt, Stone, Cobblestone, Sand, Gravel, Oak Log, Oak Planks, Oak Leaves, Glass,
Water, Lava, Snow Block, Ice, Bedrock, Coal Ore, Iron Ore, Gold Ore, Diamond Ore, Emerald
Ore, Redstone Ore, Brick, Obsidian, Glowstone, Sandstone, Spruce Log, Spruce Leaves,
Spruce Planks, Cactus, Mossy Cobblestone, Crafting Table, Bookshelf, TNT, White/Red/Blue/
Green Wool, Pumpkin, Netherrack, Soul Sand

### Rendering
- **Procedural texture atlas** — all textures generated at runtime on `<canvas>`, pixel-art style
- **Ambient occlusion** per vertex — gives depth to block edges
- **Face culling** — only visible faces are rendered
- **Separate meshes** for opaque, transparent (leaves/glass/ice), and water blocks
- **Fog** — distance fog blending with sky color

### Sky & Lighting
- **10-minute day/night cycle** (adjustable)
- **Procedural sky dome** with vertex-colored gradient sky
- **Sun and moon** orbiting the world
- **2000 star field** (visible at night)
- **Dynamic ambient and directional lighting** keyed to time of day
- **Sunrise and sunset colors** — warm oranges and purples

### Player
- **AABB collision detection** against all solid blocks
- **Gravity, jumping, swimming** physics
- **Sprint mode** — 60% faster horizontal movement
- **Fly mode** (press `F`) — creative-style noclip flight
- **Fall damage** — taking damage from large drops
- **Health bar** — 10 hearts displayed in HUD
- **Block breaking** — progress bar, respects block hardness
- **Block placing** with placement validation (won't place inside player)
- **Raycast targeting** — highlights the block you're looking at

### HUD
- **Crosshair**
- **Hotbar** with 9 slots, showing block preview icons
- **Health display** (10 heart icons)
- **Block break progress bar**
- **Block highlight outline** on targeted block
- **F3 debug screen** — XYZ, chunk, velocity, FPS, time, selected block

---

## 🏗️ Architecture

```
index.html         HTML shell + CSS
js/
  noise.js         SimplexNoise (2D & 3D) + FBM
  blocks.js        Block IDs, properties, texture atlas generation
  terrain.js       TerrainGenerator — biomes, heightmap, caves, ores, trees
  chunk.js         Chunk class — block storage + Three.js mesh building + AO
  world.js         World — chunk management, block access, raycasting
  player.js        Player — FPS controller, physics, block interaction
  sky.js           Sky — day/night cycle, sun/moon/stars, dynamic lighting
  hud.js           HUD — hotbar, health, debug, crosshair, block highlight
  game.js          Game — renderer setup, main loop, UI state machine
```

---

## 🔧 Technical Notes

- **No build step** — pure vanilla JavaScript loaded as classic `<script>` tags
- **Three.js r160** loaded from CDN (jsdelivr)
- Texture atlas: **256×256 px**, 16×16 tiles, NearestFilter (pixel-perfect)
- Chunk mesh: `THREE.BufferGeometry` with `position`, `normal`, `uv`, `color` (AO) attributes
- Transparent/water blocks rendered in separate draw passes
- Target: **60 FPS** on a mid-range GPU with 7-chunk render distance
