  // =========================================================================
  // 7. PARTICLES & RENDERING LOOP
  // =========================================================================
  const smokeParticles = [];
  const snowflakes = [];

  function initSnowflakes() {
    snowflakes.length = 0;
    for (let i = 0; i < 520; i++) {
      // Only a few (~16) large near-camera ambiance flakes; most are crisp mid/far snow
      const layer = i < 16 ? 'near' : (i < 220 ? 'mid' : 'far');
      snowflakes.push({
        layer,
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        r: layer === 'near' ? (3.2 + Math.random() * 2.0) : (layer === 'mid' ? (1.4 + Math.random() * 1.1) : (0.8 + Math.random() * 0.7)),
        speed: layer === 'near' ? (46 + Math.random() * 26) : (layer === 'mid' ? (28 + Math.random() * 22) : (16 + Math.random() * 14)),
        windFactor: layer === 'near' ? 1.35 : (layer === 'mid' ? 1.0 : 0.65),
        alpha: layer === 'near' ? 0.42 : (layer === 'mid' ? 0.88 : 0.62),
        swirl: 8 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function spawnSmoke(wx, wy) {
    smokeParticles.push({
      x: wx + (Math.random() - 0.5) * 3,
      y: wy,
      vy: -11 - Math.random() * 6,
      vx: 3.5 + Math.random() * 4,
      life: 0,
      maxLife: 2.3 + Math.random() * 1.2,
      size: 2.6,
    });
  }

  let lastTime = performance.now();
  let animClock = 0;
  let smokeSpawnTimer = 0;

  const stars = Array.from({ length: 110 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    size: 0.8 + Math.random() * 1.1,
  }));

  function renderFrame(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    animClock += dt;
    audio.updateAmbiance(dt);

    // Dynamic gusting wind simulation
    const baseWind = state.snowMode ? (state.snowLevel === 1 ? 14 : (state.snowLevel === 2 ? 48 : 125)) : 8;
    const gustWave = Math.sin(animClock * 0.43) * 0.55 + Math.sin(animClock * 1.17) * 0.3 + Math.cos(animClock * 2.3) * 0.15;
    state.wind.gust = Math.max(0, gustWave);
    state.wind.speed = baseWind * (0.65 + 0.7 * Math.max(-0.2, gustWave));

    if (state.snowMode) {
      const accumRates = { 1: 0.007, 2: 0.020, 3: 0.048 };
      const baseRate = accumRates[state.snowLevel] * dt;
      // Collect heat sources (lit fireplaces, bonfires, lampposts)
      const heatSources = state.objects.filter(o => o.fireplace || o.type === 'bonfire' || o.type === 'lamppost');
      let sumSnow = 0;

      for (let gy = 0; gy < GRID_SIZE; gy++) {
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          const tType = state.terrain[gy][gx];
          const n = state.corners[gy]?.[gx] || 0;
          const s = state.corners[gy + 1]?.[gx + 1] || 0;
          const e = state.corners[gy]?.[gx + 1] || 0;
          const w = state.corners[gy + 1]?.[gx] || 0;
          // Leeward pockets & sheltered slopes catch more drifting snow
          const leeward = Math.max(0.55, Math.min(1.55, 1.0 + (n - s) * 0.18 + (w - e) * 0.12));
          const isLake = (tType === 'ice' || tType === 'ice_cracked' || tType === 'water');
          const typeFactor = tType === 'water' ? 0.1 : (isLake ? 0.38 : (tType === 'road' ? 0.85 : 1.0));
          let maxCap = 1.0;

          // Warmth from hearths & lamps keeps a cozy melted/light-frost ring
          for (const hs of heatSources) {
            const d2 = (gx - hs.x) * (gx - hs.x) + (gy - hs.y) * (gy - hs.y);
            if (d2 <= 3.2) {
              maxCap = Math.min(maxCap, hs.type === 'bonfire' ? 0.25 : 0.45);
              break;
            }
          }

          const cur = state.snowGrid[gy]?.[gx] || 0;
          const next = Math.min(maxCap, cur + baseRate * leeward * typeFactor);
          if (state.snowGrid[gy]) state.snowGrid[gy][gx] = next;
          sumSnow += next;
        }
      }
      state.snowAccum = sumSnow / (GRID_SIZE * GRID_SIZE);
      const pct = Math.round(state.snowAccum * 100);
      document.getElementById('accum-label').textContent = `${pct}%`;
    }

    const snowBucket = Math.min(4, Math.floor(state.snowAccum * 4.99));

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
    skyGrad.addColorStop(0, '#070b14');
    skyGrad.addColorStop(0.6, '#131d33');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Soft twinkling stars
    for (const s of stars) {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(animClock * 1.4 + s.phase));
      ctx.fillStyle = `rgba(241, 245, 249, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(s.x * viewW, s.y * viewH, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon
    const mx = viewW - 96, my = 76;
    const moonGlow = ctx.createRadialGradient(mx, my, 12, mx, my, 52);
    moonGlow.addColorStop(0, 'rgba(254, 243, 199, 0.22)');
    moonGlow.addColorStop(1, 'rgba(254, 243, 199, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath(); ctx.arc(mx, my, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath(); ctx.arc(mx, my, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0d1424';
    ctx.beginPath(); ctx.arc(mx + 6, my - 4, 15, 0, Math.PI * 2); ctx.fill();

    const z = state.camera.zoom;

    // Terrain (true 4-corner sloped isometric quads with angled line segments)
    for (let sum = 0; sum <= (GRID_SIZE - 1) * 2; sum++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const gy = sum - gx;
        if (gy < 0 || gy >= GRID_SIZE) continue;
        const n = state.corners[gy]?.[gx] || 0;
        const e = state.corners[gy]?.[gx + 1] || 0;
        const s = state.corners[gy + 1]?.[gx + 1] || 0;
        const w = state.corners[gy + 1]?.[gx] || 0;

        const pN = cornerScreen(gx, gy);
        const pE = cornerScreen(gx + 1, gy);
        const pS = cornerScreen(gx + 1, gy + 1);
        const pW = cornerScreen(gx, gy + 1);

        if (pE.x < -80 || pW.x > viewW + 80 || pS.y < -80 || pN.y > viewH + 80) continue;

        const tType = state.terrain[gy][gx];
        if (n === e && e === s && s === w) {
          // Flat tile: use crisp cached vector sprite
          const spr = getTerrainSprite(tType, gx, gy, snowBucket);
          ctx.drawImage(spr, pN.x - (TILE_W * z) / 2, pN.y, TILE_W * z, TILE_H * z);
        } else {
          // Sloped tile: draw 4-corner sloped quad with angled edges & directional shading
          const slopeLight = ((w - e) + (n - s)) * 0.5; // positive = sunlit, negative = shaded
          const steep = Math.max(Math.abs(n - s), Math.abs(e - w));
          let fillCol, strokeCol;

          if (tType === 'ice') {
            fillCol = slopeLight >= 0 ? '#7dd3fc' : '#0284c7';
            strokeCol = '#0369a1';
          } else if (tType === 'road') {
            fillCol = slopeLight >= 0 ? '#5b6b82' : '#334155';
            strokeCol = '#273244';
          } else if (tType === 'plaza') {
            fillCol = slopeLight >= 0 ? '#92400e' : '#6c320d';
            strokeCol = '#451a03';
          } else if (tType === 'path') {
            fillCol = slopeLight >= 0 ? '#e2ecf7' : '#9aa8ba';
            strokeCol = '#7e8da1';
          } else if (tType === 'grass' || tType === 'shrub') {
            const avgH = (n + e + s + w) * 0.25;
            if (snowBucket >= 3 || avgH > 4.2) {
              // High alpine peaks or heavy snowfall
              if (steep > 1.4 && slopeLight < -0.4) {
                fillCol = '#94a3b8'; strokeCol = '#64748b';
              } else if (slopeLight > 0.35) {
                fillCol = '#ffffff'; strokeCol = '#cbd5e1';
              } else if (slopeLight < -0.25) {
                fillCol = '#b8cde3'; strokeCol = '#8fa9c4';
              } else {
                fillCol = '#deecfb'; strokeCol = '#b4cde6';
              }
            } else if (avgH > 3.2) {
              // Smooth alpine treeline/frost transition
              if (steep > 1.5 && slopeLight < -0.45) {
                fillCol = '#78889c'; strokeCol = '#5a6a7e';
              } else if (slopeLight > 0.35) {
                fillCol = '#a3bf9d'; strokeCol = '#7a9976';
              } else if (slopeLight < -0.25) {
                fillCol = '#6d8773'; strokeCol = '#526b59';
              } else {
                fillCol = '#8aa88b'; strokeCol = '#68856b';
              }
            } else {
              // Lush green sloped hills (gradually frosted as snowBucket rises)
              if (steep > 1.6 && slopeLight < -0.5) {
                fillCol = '#64748b'; strokeCol = '#475569'; // rocky cliff face
              } else if (slopeLight > 0.35) {
                fillCol = snowBucket >= 1 ? '#8cb878' : '#6ea354';
                strokeCol = '#4d7a38';
              } else if (slopeLight < -0.25) {
                fillCol = snowBucket >= 1 ? '#5e8554' : '#3d662d';
                strokeCol = '#2d4d20';
              } else {
                fillCol = snowBucket >= 1 ? '#729e63' : '#53853f';
                strokeCol = '#3f6a2e';
              }
            }
          } else {
            // Snow slope with alpine rocky shadow on steep shaded faces
            if (steep > 1.4 && slopeLight < -0.4) {
              fillCol = '#94a3b8';
              strokeCol = '#64748b';
            } else if (slopeLight > 0.35) {
              fillCol = '#ffffff';
              strokeCol = '#cbd5e1';
            } else if (slopeLight < -0.25) {
              fillCol = '#b8cde3';
              strokeCol = '#8fa9c4';
            } else {
              fillCol = '#deecfb';
              strokeCol = '#b4cde6';
            }
          }

          ctx.beginPath();
          ctx.moveTo(pN.x, pN.y);
          ctx.lineTo(pE.x, pE.y);
          ctx.lineTo(pS.x, pS.y);
          ctx.lineTo(pW.x, pW.y);
          ctx.closePath();
          ctx.fillStyle = fillCol;
          ctx.fill();
          ctx.strokeStyle = strokeCol;
          ctx.lineWidth = Math.max(0.8, 0.9 * z);
          ctx.stroke();
        }

        // Realistic per-tile snow accumulation & drifts
        const isLake = (tType === 'ice' || tType === 'ice_cracked' || tType === 'water' || tType === 'pier');
        const localSnow = state.snowGrid[gy]?.[gx] ?? state.snowAccum;
        if (localSnow > 0.03 && tType !== 'snow' && tType !== 'water') {
          const snowAlpha = (tType === 'ice' || tType === 'ice_cracked')
            ? Math.min(0.42, localSnow * 0.45)
            : Math.min(0.94, localSnow * 1.05);
          ctx.beginPath();
          ctx.moveTo(pN.x, pN.y);
          ctx.lineTo(pE.x, pE.y);
          ctx.lineTo(pS.x, pS.y);
          ctx.lineTo(pW.x, pW.y);
          ctx.closePath();
          ctx.fillStyle = `rgba(238, 246, 255, ${snowAlpha.toFixed(2)})`;
          ctx.fill();

          if (localSnow > 0.25 && !isLake) {
            const cX = (pN.x + pE.x + pS.x + pW.x) * 0.25;
            const cY = (pN.y + pE.y + pS.y + pW.y) * 0.25;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.65, (localSnow - 0.2) * 0.8).toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(cX, cY, 14 * z * localSnow, 5 * z * localSnow, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (isLake) {
          drawSmoothLakeShore(ctx, gx, gy, pN, pE, pS, pW, z, snowBucket);
        }
      }
    }

    // Hover highlight (conforms to sloped quad)
    if (!state.snowMode && state.hoverTile) {
      const { x, y } = state.hoverTile;
      const catItem = CATALOG_MAP[state.selectedItem];
      const sz = (state.selectedTool === 'place' && catItem && catItem.size) ? catItem.size : 1;
      for (let dx = 0; dx < sz; dx++) {
        for (let dy = 0; dy < sz; dy++) {
          const tx = x + dx, ty = y + dy;
          if (tx < GRID_SIZE && ty < GRID_SIZE) {
            const pN = cornerScreen(tx, ty);
            const pE = cornerScreen(tx + 1, ty);
            const pS = cornerScreen(tx + 1, ty + 1);
            const pW = cornerScreen(tx, ty + 1);
            ctx.beginPath();
            ctx.moveTo(pN.x, pN.y);
            ctx.lineTo(pE.x, pE.y);
            ctx.lineTo(pS.x, pS.y);
            ctx.lineTo(pW.x, pW.y);
            ctx.closePath();
            ctx.strokeStyle = state.selectedTool === 'erase' ? '#ef4444' : '#fbbf24';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = state.selectedTool === 'erase' ? 'rgba(239,68,68,0.22)' : 'rgba(251,191,36,0.22)';
            ctx.fill();
          }
        }
      }
    }

    // Objects
    const sortedObjects = [...state.objects].sort((a, b) => {
      const da = (a.x + (a.size || 1) - 1) + (a.y + (a.size || 1) - 1);
      const db = (b.x + (b.size || 1) - 1) + (b.y + (b.size || 1) - 1);
      return da - db;
    });

    smokeSpawnTimer += dt;
    const shouldSpawnSmoke = smokeSpawnTimer >= 0.35;
    if (shouldSpawnSmoke) smokeSpawnTimer = 0;

    for (const obj of sortedObjects) {
      const s = obj.size || 1;
      const objElev = tileElev(obj.x, obj.y);
      const anchor = gridToScreen(obj.x + s - 1, obj.y + s - 1, objElev);
      const footCenterY = anchor.y + TILE_H * z;
      const spr = getObjectSprite(obj, snowBucket);
      const drawW = (spr.width / SPRITE_SS) * z;
      const drawH = (spr.height / SPRITE_SS) * z;
      const drawX = anchor.x - drawW / 2;
      const drawY = footCenterY - drawH + 10 * z;

      let bobY = 0;
      if (obj.type === 'carolers' || obj.type === 'skater') {
        bobY = Math.sin(animClock * 4 + obj.id) * 1.2 * z;
      }

      if (obj.type === 'lamppost' || obj.type === 'bonfire' || obj.fireplace) {
        const glowR = (obj.type === 'lamppost' ? 46 : (obj.type === 'bonfire' ? 50 : 36)) * z;
        const gyPos = footCenterY - (TILE_H * z) / 2;
        const grad = ctx.createRadialGradient(anchor.x, gyPos, 2, anchor.x, gyPos, glowR);
        const flicker = 0.24 + Math.sin(animClock * 9 + obj.id * 3) * 0.04;
        grad.addColorStop(0, `rgba(253, 224, 71, ${flicker.toFixed(2)})`);
        grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(anchor.x, gyPos, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.drawImage(spr, drawX, drawY + bobY, drawW, drawH);

      // Smooth vector flames for bonfire
      if (obj.type === 'bonfire') {
        const fx = anchor.x, fy = footCenterY - 12 * z;
        const fH = (6 + Math.abs(Math.sin(animClock * 12 + obj.id)) * 5) * z;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(fx - 4 * z, fy);
        ctx.quadraticCurveTo(fx - 2 * z, fy - fH, fx, fy - fH);
        ctx.quadraticCurveTo(fx + 2 * z, fy - fH, fx + 4 * z, fy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(fx - 2 * z, fy);
        ctx.quadraticCurveTo(fx, fy - fH * 0.7, fx + 2 * z, fy);
        ctx.closePath(); ctx.fill();
      }

      if (obj.lights && obj.lights !== 'none') {
        drawChristmasLights(ctx, obj, anchor.x, footCenterY, z);
      }

      if (shouldSpawnSmoke && obj.fireplace && CATALOG_MAP[obj.type]?.hasFireplace) {
        spawnSmoke(anchor.x + (obj.flip ? -7 : 7) * z, footCenterY - 48 * z);
      }

      if (!state.snowMode && state.inspectedObjId === obj.id) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(drawX + 4, drawY + 4, drawW - 8, drawH - 8, 6);
        ctx.stroke();
      }
    }

    // Soft circular smoke puffs (blown by dynamic wind)
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const p = smokeParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) { smokeParticles.splice(i, 1); continue; }
      p.x += (p.vx + state.wind.speed * 0.25) * dt * z * 0.5;
      p.y += p.vy * dt * z * 0.5;
      const alpha = (1 - p.life / p.maxLife) * 0.38;
      const r = (p.size + p.life * 2.2) * z;
      ctx.fillStyle = `rgba(226, 232, 240, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Multi-layer wind-driven snowfall (only a few near-camera ambiance flakes)
    if (state.snowMode) {
      const activeCount = state.snowLevel === 1 ? 150 : (state.snowLevel === 2 ? 320 : 520);
      const speedMult = state.snowLevel === 1 ? 0.7 : (state.snowLevel === 2 ? 1.15 : 1.9);
      for (let i = 0; i < activeCount; i++) {
        const f = snowflakes[i];
        const vy = f.speed * speedMult;
        const vx = state.wind.speed * f.windFactor + Math.sin(animClock * 1.8 + f.phase + f.y * 0.01) * f.swirl;
        f.y += vy * dt;
        f.x += vx * dt;
        if (f.y > viewH + 8) { f.y = -6; f.x = Math.random() * viewW; }
        if (f.x > viewW + 8) f.x = -6;
        if (f.x < -8) f.x = viewW + 6;

        ctx.fillStyle = `rgba(248, 250, 252, ${f.alpha})`;
        if (state.snowLevel === 3 && f.layer !== 'near' && state.wind.speed > 90) {
          // Wind-whipped snow streak in blizzard gusts
          ctx.strokeStyle = `rgba(248, 250, 252, ${(f.alpha * 0.85).toFixed(2)})`;
          ctx.lineWidth = f.r * 0.9;
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(f.x - vx * 0.025, f.y - vy * 0.025);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(renderFrame);
  }

  function drawSmoothLakeShore(ctx, gx, gy, pN, pE, pS, pW, z, snowBucket = 0) {
    const isIce = (x, y) => {
      if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
      const t = state.terrain[y][x];
      return t === 'ice' || t === 'ice_cracked' || t === 'water' || t === 'pier';
    };
    const nLand = !isIce(gx, gy - 1);
    const eLand = !isIce(gx + 1, gy);
    const sLand = !isIce(gx, gy + 1);
    const wLand = !isIce(gx - 1, gy);
    if (!nLand && !eLand && !sLand && !wLand) return;

    const cX = (pN.x + pE.x + pS.x + pW.x) * 0.25;
    const cY = (pN.y + pE.y + pS.y + pW.y) * 0.25;
    const mid = (a, b) => ({ x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 });
    const pull = (pt, amt) => ({ x: pt.x + (cX - pt.x) * amt, y: pt.y + (cY - pt.y) * amt });

    const mNE = mid(pN, pE);
    const mES = mid(pE, pS);
    const mSW = mid(pS, pW);
    const mWN = mid(pW, pN);

    ctx.fillStyle = snowBucket >= 2 ? '#deecfb' : (snowBucket === 1 ? '#7da66c' : '#53853f');
    ctx.strokeStyle = snowBucket >= 2 ? '#7dd3fc' : '#3f6a2e';
    ctx.lineWidth = Math.max(1, 1.4 * z);

    // Round off outer corners where two adjacent edges meet land
    const roundCorner = (a, corner, b) => {
      const ctrl = pull(corner, 0.55);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, b.x, b.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, b.x, b.y);
      ctx.stroke();
    };

    if (wLand && nLand) roundCorner(mWN, pN, mNE);
    if (nLand && eLand) roundCorner(mNE, pE, mES);
    if (eLand && sLand) roundCorner(mES, pS, mSW);
    if (sLand && wLand) roundCorner(mSW, pW, mWN);

    // Soft curved snowbank lips along straight edges
    const drawEdgeLip = (a, b) => {
      const ctrl = pull(mid(a, b), 0.28);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, b.x, b.y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, b.x, b.y);
      ctx.stroke();
    };

    if (nLand) drawEdgeLip(pN, pE);
    if (eLand) drawEdgeLip(pE, pS);
    if (sLand) drawEdgeLip(pS, pW);
    if (wLand) drawEdgeLip(pW, pN);
  }

  function drawChristmasLights(ctx, obj, cx, footY, z) {
    const paletteMap = {
      warm:   ['#fef08a', '#fde047', '#fef9c3'],
      multi:  ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899'],
      candy:  ['#ef4444', '#ffffff'],
      icicle: ['#38bdf8', '#e0f2fe', '#7dd3fc'],
    };
    const cols = paletteMap[obj.lights] || paletteMap.warm;
    const mode = obj.lightMode || 'twinkle';

    let pts = [];
    if (obj.type === 'pine' || obj.type === 'grandtree') {
      const rows = obj.type === 'grandtree' ? 4 : 3;
      for (let r = 0; r < rows; r++) {
        const y = -17 - r * 11;
        const w = 15 - r * 4;
        for (let dx = -w; dx <= w; dx += 6) pts.push([dx, y - Math.abs(dx) * 0.2]);
      }
    } else if (obj.type === 'sleigh') {
      for (let dx = -12; dx <= 12; dx += 6) pts.push([dx, -18]);
    } else if (obj.type === 'townhall') {
      for (let dx = -42; dx <= 42; dx += 8) pts.push([dx, -38 - (42 - Math.abs(dx)) * 0.35]);
    } else {
      for (let dx = -22; dx <= 22; dx += 7) pts.push([dx, -27 - (22 - Math.abs(dx)) * 0.35]);
    }

    pts.forEach(([dx, dy], idx) => {
      let on = true;
      if (mode === 'twinkle') on = Math.sin(animClock * 5 + idx * 1.7 + obj.id) > -0.35;
      else if (mode === 'chase') on = (Math.floor(animClock * 6) + idx) % 3 !== 0;
      if (!on) return;
      const col = cols[(idx + obj.id) % cols.length];
      const bx = cx + dx * z, by = footY + dy * z;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(1.4, 1.6 * z), 0, Math.PI * 2);
      ctx.fill();
    });
  }

