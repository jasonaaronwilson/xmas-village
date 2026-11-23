  // =========================================================================
  // 1. CONSTANTS & MAP CONFIGURATION (60x60 spacious design area)
  // =========================================================================
  const GRID_SIZE = 60;
  const TILE_W = 80;
  const TILE_H = 40;
  const ELEV_STEP = 16;
  const SPRITE_SS = 2; // 2x supersampled vector sprites for razor-sharp anti-aliasing
  const STORAGE_AUTOSAVE = 'xmas_village_autosave_v2';
  const STORAGE_SLOTS = 'xmas_village_slots_v1';

  const PALETTES = {
    red:    { wall: '#f6ede2', wallShade: '#dcc8b2', roof: '#a31d1d', roofShade: '#761414', trim: '#6b3a1e', shutter: '#166534', name: 'Festive Red' },
    green:  { wall: '#f1f5f9', wallShade: '#cbd5e1', roof: '#166534', roofShade: '#0f4725', trim: '#5c3d28', shutter: '#991b1b', name: 'Pine Green' },
    blue:   { wall: '#f8fafc', wallShade: '#cbd5e1', roof: '#1e3a8a', roofShade: '#15255a', trim: '#475569', shutter: '#1d4ed8', name: 'Winter Blue' },
    timber: { wall: '#b87e4b', wallShade: '#8c5a30', roof: '#475569', roofShade: '#334155', trim: '#52321b', shutter: '#78350f', name: 'Warm Timber' },
    ginger: { wall: '#a8673e', wallShade: '#7c4726', roof: '#7c2d12', roofShade: '#541c09', trim: '#fef3c7', shutter: '#dc2626', name: 'Gingerbread' },
  };

  const LIGHT_STYLES = [
    { id: 'none', name: 'None' },
    { id: 'warm', name: 'Warm White' },
    { id: 'multi', name: 'Multicolor' },
    { id: 'candy', name: 'Candy Cane' },
    { id: 'icicle', name: 'Icicle Blue' },
  ];

  const LIGHT_MODES = [
    { id: 'twinkle', name: 'Twinkle' },
    { id: 'steady', name: 'Steady' },
    { id: 'chase', name: 'Chase' },
  ];

  const HORSE_COLORS = [
    { id: 'white', name: 'Snow White', body: '#f8fafc', shade: '#cbd5e1', mane: '#94a3b8' },
    { id: 'chestnut', name: 'Chestnut', body: '#9a4412', shade: '#78350f', mane: '#451a03' },
    { id: 'black', name: 'Midnight', body: '#334155', shade: '#1e293b', mane: '#0f172a' },
  ];

  const CATALOG = [
    { id: 'grass',      cat: 'terrain',   name: 'Lush Meadow',      type: 'terrain', desc: 'Green grass meadow before the snow falls.' },
    { id: 'shrub',      cat: 'terrain',   name: 'Grassy Shrubs',    type: 'terrain', desc: 'Meadow with cozy wild bushes & tufts.' },
    { id: 'snow',       cat: 'terrain',   name: 'Snowy Meadow',     type: 'terrain', desc: 'Soft drifting winter snowfield.' },
    { id: 'road',       cat: 'terrain',   name: 'Cobble Street',    type: 'terrain', desc: 'Rounded cobblestone street with snow curbs.' },
    { id: 'path',       cat: 'terrain',   name: 'Footpath',         type: 'terrain', desc: 'Winding stone-dusted walkway.' },
    { id: 'ice',        cat: 'terrain',   name: 'Frozen Lake',      type: 'terrain', desc: 'Seamless glacial winter ice.' },
    { id: 'ice_cracked',cat: 'terrain',   name: 'Skating & Cracks', type: 'terrain', desc: 'Ice with natural frost cracks & skate marks.' },
    { id: 'water',      cat: 'terrain',   name: 'Winter Water',     type: 'terrain', desc: 'Deep dark unfrozen lake water.' },
    { id: 'pier',       cat: 'terrain',   name: 'Wooden Pier',      type: 'terrain', desc: 'Cozy timber dock extending over water.' },
    { id: 'plaza',      cat: 'terrain',   name: 'Timber Plaza',     type: 'terrain', desc: 'Warm wooden town square decking.' },
    { id: 'elev_up',    cat: 'terrain',   name: 'Raise Hill',       type: 'elev', delta: 1, desc: 'Raise terrain elevation by 1 level.' },
    { id: 'elev_down',  cat: 'terrain',   name: 'Lower Ground',     type: 'elev', delta: -1, desc: 'Lower terrain elevation by 1 level.' },

    { id: 'cottage',    cat: 'buildings', name: 'Cozy Cottage',     type: 'object', size: 1, hasColor: true, hasLights: true, hasFireplace: true, hasFlip: true, desc: 'Storybook cottage with wreath, shutters & chimney.' },
    { id: 'bakery',     cat: 'buildings', name: 'Cocoa Bakery',     type: 'object', size: 1, hasColor: true, hasLights: true, hasFireplace: true, hasFlip: true, desc: 'Warm bakery with scalloped awning & glowing display.' },
    { id: 'workshop',   cat: 'buildings', name: 'Toy Workshop',     type: 'object', size: 1, hasColor: true, hasLights: true, hasFireplace: true, hasFlip: true, desc: 'Whimsical workshop with hanging sign & eaves.' },
    { id: 'cabin',      cat: 'buildings', name: 'Log Cabin',        type: 'object', size: 1, hasColor: true, hasLights: true, hasFireplace: true, hasFlip: true, desc: 'Rustic timber cabin with stone chimney.' },
    { id: 'chapel',     cat: 'buildings', name: 'Steeple Chapel',   type: 'object', size: 1, hasColor: true, hasLights: true, hasFireplace: false, hasFlip: true, desc: 'Quaint chapel with stained glass & bell spire.' },
    { id: 'townhall',   cat: 'buildings', name: 'Grand Town Hall',  type: 'object', size: 2, hasColor: true, hasLights: true, hasFireplace: true, hasFlip: false, desc: '2x2 centerpiece hall with illuminated clock tower.' },

    { id: 'pine',       cat: 'decor',     name: 'Pine Tree',        type: 'object', size: 1, hasLights: true, desc: 'Lush snow-laden evergreen.' },
    { id: 'grandtree',  cat: 'decor',     name: 'Village Tree',     type: 'object', size: 1, hasLights: true, desc: 'Grand decorated tree with glowing star.' },
    { id: 'lamppost',   cat: 'decor',     name: 'Lamppost',         type: 'object', size: 1, desc: 'Ornate wrought-iron lantern with warm halo.' },
    { id: 'snowman',    cat: 'decor',     name: 'Snowman',          type: 'object', size: 1, hasFlip: true, desc: 'Jolly snowman with knit scarf & top hat.' },
    { id: 'stall',      cat: 'decor',     name: 'Market Stall',     type: 'object', size: 1, hasColor: true, hasLights: true, hasFlip: true, desc: 'Festive booth with scalloped canopy & treats.' },
    { id: 'bench',      cat: 'decor',     name: 'Park Bench',       type: 'object', size: 1, hasFlip: true, desc: 'Snow-dusted timber & iron bench.' },
    { id: 'bonfire',    cat: 'decor',     name: 'Hearth Brazier',   type: 'object', size: 1, desc: 'Stone-ringed fire pit with dancing flames.' },

    { id: 'sleigh',     cat: 'living',    name: "Santa's Sleigh",   type: 'object', size: 1, hasLights: true, hasFlip: true, desc: 'Curved crimson sleigh packed with gifts.' },
    { id: 'horse',      cat: 'living',    name: 'Winter Horse',     type: 'object', size: 1, hasHorseColor: true, hasFlip: true, desc: 'Gentle horse with festive saddle blanket.' },
    { id: 'carolers',   cat: 'living',    name: 'Carolers',         type: 'object', size: 1, desc: 'Trio of bundled-up singers with songbooks.' },
    { id: 'skater',     cat: 'living',    name: 'Ice Skater',       type: 'object', size: 1, hasFlip: true, desc: 'Villager gliding in winter coat & scarf.' },
    { id: 'reindeer',   cat: 'living',    name: 'Reindeer',         type: 'object', size: 1, hasFlip: true, desc: 'Whimsical reindeer with red jingle collar.' },
  ];

  const CATALOG_MAP = Object.fromEntries(CATALOG.map(c => [c.id, c]));

  // =========================================================================
  // 2. GAME STATE
  // =========================================================================
  const state = {
    terrain: [],
    corners: [],
    objects: [],
    selectedTool: 'place',
    selectedCat: 'buildings',
    selectedItem: 'cottage',
    config: {
      color: 'red',
      lights: 'warm',
      lightMode: 'twinkle',
      fireplace: true,
      flip: false,
      horseColor: 'white',
    },
    inspectedObjId: null,
    camera: { x: 0, y: 0, zoom: 1 },
    hoverTile: null,
    snowMode: false,
    snowLevel: 1,
    snowAccum: 0,
    snowGrid: [],
    wind: { speed: 12, gust: 0 },
    greeting: {
      title: "Season's Greetings!",
      message: 'Welcome to our cozy Christmas village. Watch the snow fall and enjoy the warm holiday lights!',
      signature: '— With warm wishes',
    },
    undoStack: [],
    redoStack: [],
    nextObjId: 1,
    audioEnabled: false,
  };

  function initEmptyMap() {
    state.terrain = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => (Math.random() < 0.18 ? 'shrub' : 'grass'))
    );
    state.corners = Array.from({ length: GRID_SIZE + 1 }, () =>
      Array.from({ length: GRID_SIZE + 1 }, () => 0)
    );
    state.snowGrid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => 0)
    );
    state.objects = [];
    state.inspectedObjId = null;
    state.snowAccum = 0;
  }

  function generateInitialTerrain(preset = 'victorian', elevScale = 1) {
    initEmptyMap();
    const scale = elevScale === 0 ? 0.25 : (elevScale === 1 ? 1.0 : 1.65);
    const mid = GRID_SIZE / 2;
    const seed = Math.random() * 10000;

    // Seeded smooth 2D value noise + fractal Brownian motion for personalized landscapes
    const vNoise = (x, y, s) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const h00 = hash2(ix, iy, s), h10 = hash2(ix + 1, iy, s);
      const h01 = hash2(ix, iy + 1, s), h11 = hash2(ix + 1, iy + 1, s);
      const nx0 = h00 + (h10 - h00) * ux;
      const nx1 = h01 + (h11 - h01) * ux;
      return nx0 + (nx1 - nx0) * uy;
    };
    const fbm = (x, y) => (
      vNoise(x * 0.08, y * 0.08, seed) * 0.58 +
      vNoise(x * 0.17, y * 0.17, seed + 19.3) * 0.28 +
      vNoise(x * 0.34, y * 0.34, seed + 47.7) * 0.14
    );

    const WATER_LEVEL = 1.0;
    const lakeCenter = GRID_SIZE * (0.67 + (Math.random() - 0.5) * 0.06);
    const lakeShiftW = (Math.random() - 0.5) * 0.22;

    for (let cy = 0; cy <= GRID_SIZE; cy++) {
      for (let cx = 0; cx <= GRID_SIZE; cx++) {
        const backDist = (cx + cy) / (GRID_SIZE * 2);
        const n = fbm(cx, cy); // 0..1
        const ridged = 1 - Math.abs(n * 2 - 1); // 0..1 sharp alpine ridges
        let h = 0;

        if (preset === 'victorian') {
          const gentleBack = backDist < 0.22 ? ((0.22 - backDist) / 0.22) * (1.2 + n * 1.4) : 0;
          h = (gentleBack + Math.max(0, n - 0.62) * 1.2) * scale;
        } else if (preset === 'swiss') {
          const backT = backDist < 0.50 ? (0.50 - backDist) / 0.50 : 0;
          const peaks = backT * backT * 5.8 + ridged * backT * 4.5;
          const villageHills = Math.max(0, n - 0.42) * 3.8;
          h = (peaks + villageHills) * scale;
        } else if (preset === 'foothills') {
          const backRise = backDist < 0.38 ? ((0.38 - backDist) / 0.38) * (3.2 + ridged * 2.0) : 0;
          h = (backRise + Math.max(0, n - 0.35) * 3.4) * scale;
        } else if (preset === 'lake') {
          const alongW = (cx - cy) / mid - lakeShiftW;
          const alongD = ((cx + cy) * 0.5 - lakeCenter) / mid;
          const basinDist = Math.sqrt(alongW * alongW * 0.26 + alongD * alongD * 1.25) + (n - 0.5) * 0.32;
          const backRise = backDist < 0.42 ? ((0.42 - backDist) / 0.42) * (4.6 + ridged * 2.8) : 0;
          const landH = 0.7 + backRise * scale + Math.max(0, n - 0.35) * 2.6 * scale;
          // Carve a natural basin below WATER_LEVEL in the foreground
          h = basinDist < 0.56 ? (basinDist / 0.56) * WATER_LEVEL * 0.92 : landH + (basinDist - 0.56) * 1.2;
        }

        state.corners[cy][cx] = Math.max(0, Math.min(12, Math.round(h * 2) / 2));
      }
    }

    // Real water-level pass: water fills everything at or below WATER_LEVEL to one flat plane
    if (preset === 'lake') {
      for (let cy = 0; cy <= GRID_SIZE; cy++) {
        for (let cx = 0; cx <= GRID_SIZE; cx++) {
          if (state.corners[cy][cx] <= WATER_LEVEL) {
            state.corners[cy][cx] = WATER_LEVEL;
          }
        }
      }
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const c0 = state.corners[y][x];
          const c1 = state.corners[y][x + 1];
          const c2 = state.corners[y + 1][x + 1];
          const c3 = state.corners[y + 1][x];
          if (c0 <= WATER_LEVEL && c1 <= WATER_LEVEL && c2 <= WATER_LEVEL && c3 <= WATER_LEVEL) {
            const wNoise = fbm(x + 31.7, y + 17.3);
            if (wNoise > 0.72) state.terrain[y][x] = 'water';
            else if (wNoise > 0.48) state.terrain[y][x] = 'ice_cracked';
            else state.terrain[y][x] = 'ice';
          }
        }
      }
    }
  }

