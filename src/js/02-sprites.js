  // =========================================================================
  // 3. SEMI-REALISTIC WHIMSICAL VECTOR ART ENGINE (2x Supersampled Smooth Canvas2D)
  // =========================================================================
  const spriteCache = new Map();

  function makeVectorCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w * SPRITE_SS;
    c.height = h * SPRITE_SS;
    const ctx = c.getContext('2d');
    ctx.scale(SPRITE_SS, SPRITE_SS);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    return { c, ctx };
  }

  function hash2(x, y, s = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function drawIsoDiamond(ctx, cx, cy, w, h, fill, stroke, lineWidth = 1) {
    const hw = w / 2, hh = h / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  // Vector Terrain Tiles
  function getTerrainSprite(type, tx, ty, snowBucket) {
    const isLakeTile = (type === 'ice' || type === 'ice_cracked' || type === 'water');
    const variant = isLakeTile ? Math.floor(hash2(tx, ty, 55) * 20) : ((tx * 7 + ty * 13) & 3);
    const key = `vt_${type}_${variant}_${snowBucket}`;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const { c, ctx } = makeVectorCanvas(TILE_W, TILE_H);
    const cx = TILE_W / 2, cy = TILE_H / 2;

    if (type === 'grass' || type === 'shrub') {
      const shades = [
        ['#568a42', '#4d803b'],
        ['#548840', '#4b7e39'],
        ['#588c44', '#4f823c'],
        ['#558941', '#4c7f3a'],
      ];
      const [gTop, gBot] = shades[variant];
      const grad = ctx.createLinearGradient(0, 0, TILE_W, TILE_H);
      grad.addColorStop(0, gTop);
      grad.addColorStop(1, gBot);
      drawIsoDiamond(ctx, cx, cy, TILE_W, TILE_H, grad, '#3f6a2e', 0.8);

      // Subtle grass blade tufts
      ctx.strokeStyle = 'rgba(134, 194, 98, 0.55)';
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 4; i++) {
        const rx = cx + (hash2(i, variant, 3) - 0.5) * 34;
        const ry = cy + (hash2(i, variant, 4) - 0.5) * 14;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(rx - 2, ry - 3, rx - 3, ry - 4);
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(rx + 2, ry - 3, rx + 3, ry - 3.5);
        ctx.stroke();
      }

      if (type === 'shrub') {
        const count = 2 + (variant % 2);
        for (let b = 0; b < count; b++) {
          const bx = cx + (hash2(b, variant, 7) - 0.5) * 26;
          const by = cy + (hash2(b, variant, 8) - 0.5) * 10;
          const r = 4.2 + hash2(b, variant, 9) * 2.4;
          // Shadow
          ctx.fillStyle = 'rgba(20, 45, 18, 0.35)';
          ctx.beginPath(); ctx.ellipse(bx + 1, by + 1.5, r, r * 0.65, 0, 0, Math.PI * 2); ctx.fill();
          // Bush clusters
          ctx.fillStyle = '#2d5a27';
          ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3f7835';
          ctx.beginPath(); ctx.arc(bx - r * 0.25, by - r * 0.2, r * 0.72, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5a9c49';
          ctx.beginPath(); ctx.arc(bx - r * 0.35, by - r * 0.35, r * 0.42, 0, Math.PI * 2); ctx.fill();
          // Tiny autumn/holiday berries on some shrubs
          if ((b + variant) % 2 === 0) {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(bx + 1.5, by - 1, 0.9, 0, Math.PI * 2);
            ctx.arc(bx - 1.5, by + 0.5, 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else if (type === 'snow') {
      const grad = ctx.createLinearGradient(0, 0, TILE_W, TILE_H);
      grad.addColorStop(0, '#f3f8ff');
      grad.addColorStop(0.55, '#deecfb');
      grad.addColorStop(1, '#c4dcf4');
      drawIsoDiamond(ctx, cx, cy, TILE_W, TILE_H, grad, '#b9d2ec', 0.8);

      // Soft curved snowdrifts
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        const rx = cx + (hash2(i, variant, 1) - 0.5) * 32;
        const ry = cy + (hash2(i, variant, 2) - 0.5) * 14;
        ctx.beginPath();
        ctx.moveTo(rx - 8, ry);
        ctx.quadraticCurveTo(rx, ry - 2.5, rx + 8, ry + 0.5);
        ctx.stroke();
      }
    } else if (type === 'road') {
      const grad = ctx.createLinearGradient(0, 0, TILE_W, TILE_H);
      grad.addColorStop(0, '#475569');
      grad.addColorStop(1, '#334155');
      drawIsoDiamond(ctx, cx, cy, TILE_W, TILE_H, grad, '#273244', 1);

      // Rounded vector cobblestones
      for (let py = 6; py < TILE_H - 6; py += 5.5) {
        for (let px = 11; px < TILE_W - 11; px += 8) {
          const ox = px + ((Math.round(py) % 2 === 0) ? 3.5 : 0);
          if (Math.abs(ox - cx) / 35 + Math.abs(py - cy) / 17 < 0.85) {
            const tone = hash2(ox, py, variant);
            ctx.fillStyle = tone > 0.6 ? '#64748b' : (tone > 0.3 ? '#526075' : '#435066');
            ctx.beginPath();
            ctx.ellipse(ox, py, 3.2, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.16)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      // Soft snow banks along edges
      ctx.fillStyle = 'rgba(241, 245, 249, 0.55)';
      ctx.beginPath();
      ctx.ellipse(cx - 14, 7, 7, 2.2, -0.45, 0, Math.PI * 2);
      ctx.ellipse(cx + 14, TILE_H - 7, 7, 2.2, -0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'path') {
      drawIsoDiamond(ctx, cx, cy, TILE_W, TILE_H, '#dce9f7', '#bdd3ea', 0.8);
      drawIsoDiamond(ctx, cx, cy, TILE_W - 20, TILE_H - 10, '#9aa8ba', '#7e8da1', 0.8);
      for (let i = 0; i < 6; i++) {
        const rx = cx + (hash2(i, variant, 5) - 0.5) * 30;
        const ry = cy + (hash2(i, variant, 6) - 0.5) * 12;
        ctx.fillStyle = i % 2 === 0 ? '#cbd5e1' : '#7b899c';
        ctx.beginPath();
        ctx.ellipse(rx, ry, 2.2, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'ice' || type === 'ice_cracked') {
      // Unified seamless glacial blue base (no per-tile checkerboard)
      const grad = ctx.createLinearGradient(0, 0, TILE_W, TILE_H);
      grad.addColorStop(0, '#3ca7db');
      grad.addColorStop(1, '#369fd3');
      drawIsoDiamond(ctx, cx, cy, TILE_W + 1.2, TILE_H + 0.6, grad, null);

      ctx.save();
      drawIsoDiamond(ctx, cx, cy, TILE_W, TILE_H, null, null);
      ctx.clip();

      // Subtle translucent mist/depth variation on ~1 in 10 tiles
      if (variant === 3 || variant === 14) {
        const px = cx + (hash2(variant, 1, 3) - 0.5) * 24;
        const py = cy + (hash2(variant, 2, 4) - 0.5) * 10;
        ctx.fillStyle = variant === 3 ? 'rgba(186, 230, 253, 0.12)' : 'rgba(12, 74, 110, 0.08)';
        ctx.beginPath();
        ctx.ellipse(px, py, 12, 5, (hash2(variant, 3, 5) - 0.5) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tiny trapped air bubbles & frost specks across the ice (dots only, no lines)
      const speckCount = 8 + (variant % 6);
      for (let i = 0; i < speckCount; i++) {
        const bx = cx + (hash2(variant, i, 21) - 0.5) * 44;
        const by = cy + (hash2(variant, i, 22) - 0.5) * 18;
        const br = 0.35 + hash2(variant, i, 23) * 0.55;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(240, 249, 255, 0.48)' : 'rgba(186, 230, 253, 0.36)';
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }

      // Extra subtle frost-dot clusters for ice_cracked (dots only, no lines/lambdas)
      if (type === 'ice_cracked') {
        for (let i = 0; i < 6; i++) {
          const bx = cx + (hash2(variant, i, 41) - 0.5) * 34;
          const by = cy + (hash2(variant, i, 42) - 0.5) * 14;
          ctx.fillStyle = 'rgba(240, 249, 255, 0.58)';
          ctx.beginPath();
          ctx.arc(bx, by, 0.45 + hash2(variant, i, 43) * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (type === 'water') {
      const grad = ctx.createLinearGradient(0, 0, TILE_W, TILE_H);
      grad.addColorStop(0, '#1c77ab');
      grad.addColorStop(1, '#176c9c');
      drawIsoDiamond(ctx, cx, cy, TILE_W + 1.2, TILE_H + 0.6, grad, null);

      for (let i = 0; i < 4; i++) {
        const rx = cx + (hash2(variant, i, 11) - 0.5) * 32;
        const ry = cy + (hash2(variant, i, 12) - 0.5) * 14;
        ctx.fillStyle = 'rgba(186, 230, 253, 0.30)';
        ctx.beginPath();
        ctx.arc(rx, ry, 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'pier') {
      // Water underneath
      drawIsoDiamond(ctx, cx, cy, TILE_W + 1.0, TILE_H + 0.5, '#136ea1', null);
      // Timber dock planks
      drawIsoDiamond(ctx, cx, cy - 2, TILE_W - 14, TILE_H - 7, '#78350f', '#451a03', 1);
      ctx.save();
      drawIsoDiamond(ctx, cx, cy - 2, TILE_W - 15, TILE_H - 8, null, null);
      ctx.clip();
      for (let py = 3; py < TILE_H; py += 4.5) {
        ctx.fillStyle = py % 9 === 0 ? '#92400e' : '#6c320d';
        ctx.fillRect(0, py, TILE_W, 3.5);
      }
      ctx.restore();
      // Corner wooden pilings with snow caps
      const posts = [[cx, 7], [cx - 24, cy - 2], [cx + 24, cy - 2], [cx, TILE_H - 11]];
      for (const [px, py] of posts) {
        ctx.fillStyle = '#451a03';
        ctx.beginPath(); ctx.roundRect(px - 2, py - 4, 4, 7, 1); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.ellipse(px, py - 4, 2.2, 1, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'plaza') {
      drawIsoDiamond(ctx, cx, cy, TILE_W, TILE_H, '#78350f', '#451a03', 1);
      ctx.save();
      drawIsoDiamond(ctx, cx, cy, TILE_W - 2, TILE_H - 1, null, null);
      ctx.clip();
      for (let py = 3; py < TILE_H; py += 5) {
        ctx.fillStyle = py % 10 === 0 ? '#92400e' : '#71320d';
        ctx.fillRect(0, py, TILE_W, 4);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.14)';
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(0, py + 0.5); ctx.lineTo(TILE_W, py + 0.5); ctx.stroke();
      }
      ctx.restore();
    }

    // Soft vector snow accumulation overlay
    if (snowBucket > 0) {
      const alpha = snowBucket * 0.19;
      ctx.fillStyle = `rgba(248, 250, 252, ${alpha.toFixed(2)})`;
      drawIsoDiamond(ctx, cx, cy, TILE_W - 2, TILE_H - 1, ctx.fillStyle, null);
      // Pillowy snow patches
      ctx.fillStyle = `rgba(255, 255, 255, ${(snowBucket * 0.16).toFixed(2)})`;
      for (let i = 0; i < snowBucket * 2; i++) {
        const rx = cx + (hash2(i, variant, 12) - 0.5) * 42;
        const ry = cy + (hash2(i, variant, 14) - 0.5) * 18;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    spriteCache.set(key, c);
    return c;
  }

  function drawVectorBox(ctx, cx, by, hw, hd, h, leftCol, rightCol, topCol, outline = '#1e293b') {
    const leftGrad = ctx.createLinearGradient(cx - hw, by - hd - h, cx, by);
    leftGrad.addColorStop(0, leftCol);
    leftGrad.addColorStop(1, leftCol);

    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(cx - hw, by - hd);
    ctx.lineTo(cx, by);
    ctx.lineTo(cx, by - h);
    ctx.lineTo(cx - hw, by - hd - h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rightCol;
    ctx.beginPath();
    ctx.moveTo(cx, by);
    ctx.lineTo(cx + hw, by - hd);
    ctx.lineTo(cx + hw, by - hd - h);
    ctx.lineTo(cx, by - h);
    ctx.closePath();
    ctx.fill();

    if (topCol) {
      ctx.fillStyle = topCol;
      ctx.beginPath();
      ctx.moveTo(cx, by - h - hd * 2);
      ctx.lineTo(cx + hw, by - hd - h);
      ctx.lineTo(cx, by - h);
      ctx.lineTo(cx - hw, by - hd - h);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - hw, by - hd);
    ctx.lineTo(cx, by);
    ctx.lineTo(cx + hw, by - hd);
    ctx.lineTo(cx + hw, by - hd - h);
    ctx.moveTo(cx - hw, by - hd);
    ctx.lineTo(cx - hw, by - hd - h);
    ctx.stroke();
  }

  // Whimsical vector pitched roof with curved snowdrifts & tapered icicles
  function drawVectorRoof(ctx, cx, by, hw, hd, wallH, roofH, roofCol, roofShade, snowThick) {
    const base = by - wallH;
    const ridgeY = base - hd - roofH;

    // Left slope
    const lGrad = ctx.createLinearGradient(cx - hw, ridgeY, cx, base);
    lGrad.addColorStop(0, roofCol);
    lGrad.addColorStop(1, roofShade);
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.moveTo(cx - hw - 3.5, base - hd + 1.5);
    ctx.lineTo(cx, base + 2.5);
    ctx.lineTo(cx + 2, ridgeY + 2);
    ctx.lineTo(cx - hw + 5, ridgeY - hd / 2 + 2);
    ctx.closePath();
    ctx.fill();

    // Right slope
    ctx.fillStyle = roofShade;
    ctx.beginPath();
    ctx.moveTo(cx, base + 2.5);
    ctx.lineTo(cx + hw + 3.5, base - hd + 1.5);
    ctx.lineTo(cx + 2, ridgeY + 2);
    ctx.closePath();
    ctx.fill();

    // Pillowy curved snow blanket
    const sGrad = ctx.createLinearGradient(cx - hw, ridgeY, cx, base);
    sGrad.addColorStop(0, '#ffffff');
    sGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.moveTo(cx - hw - 3, base - hd);
    ctx.quadraticCurveTo(cx - hw * 0.45, base - hd * 0.35 + 2, cx, base + 1);
    ctx.lineTo(cx + 2, ridgeY + 2);
    ctx.lineTo(cx - hw + 5, ridgeY - hd / 2 + 2);
    ctx.closePath();
    ctx.fill();

    // Soft snow overhang lip
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.6 + snowThick * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - hw - 2.5, base - hd + 0.5);
    ctx.quadraticCurveTo(cx - hw * 0.45, base - hd * 0.35 + 2.5, cx, base + 1.5);
    ctx.stroke();

    // Tapered vector icicles
    ctx.fillStyle = '#bae6fd';
    for (let x = cx - hw + 3; x < cx + hw - 2; x += 6) {
      const dropY = base - hd + (1 - Math.abs(x - cx) / hw) * hd + 1.5;
      const len = 2.5 + ((Math.abs(Math.round(x)) * 3) % 3);
      ctx.beginPath();
      ctx.moveTo(x - 1.1, dropY);
      ctx.lineTo(x + 1.1, dropY);
      ctx.lineTo(x, dropY + len);
      ctx.closePath();
      ctx.fill();
    }

    // Crisp roof outline
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - hw - 3.5, base - hd + 1.5);
    ctx.lineTo(cx, base + 2.5);
    ctx.lineTo(cx + hw + 3.5, base - hd + 1.5);
    ctx.lineTo(cx + 2, ridgeY + 2);
    ctx.lineTo(cx - hw + 5, ridgeY - hd / 2 + 2);
    ctx.closePath();
    ctx.stroke();
  }

  function drawVectorWindow(ctx, x, y, w, h, lit, shutterCol = null) {
    if (shutterCol) {
      ctx.fillStyle = shutterCol;
      ctx.beginPath();
      ctx.roundRect(x - 3.2, y, 2.5, h, 0.8);
      ctx.roundRect(x + w + 0.7, y, 2.5, h, 0.8);
      ctx.fill();
    }
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x - 1, y - 1, w + 2, h + 2, 1.5);
    ctx.fill();

    if (lit) {
      const wg = ctx.createRadialGradient(x + w / 2, y + h / 2, 0.5, x + w / 2, y + h / 2, w);
      wg.addColorStop(0, '#fef9c3');
      wg.addColorStop(1, '#facc15');
      ctx.fillStyle = wg;
    } else {
      ctx.fillStyle = '#334155';
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 1);
    ctx.fill();

    // Mullions
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (w >= 4) { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); }
    if (h >= 4) { ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); }
    ctx.stroke();

    // Pillowy snow sill
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(x - 1.5, y + h - 0.5, w + 3, 2.2, 1);
    ctx.fill();
  }

  function drawVectorWreath(ctx, x, y) {
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 2.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y + 2, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const svgAssetStore = {};
  function getSvgAsset(name, uri) {
    if (!svgAssetStore[name] && uri) {
      const entry = { img: new Image(), ready: false };
      entry.img.onload = () => {
        entry.ready = true;
        spriteCache.clear();
        if (typeof renderPalette === 'function') renderPalette();
      };
      entry.img.src = uri;
      svgAssetStore[name] = entry;
    }
    return svgAssetStore[name];
  }

  function drawSvgAsset(ctx, c, key, W, entry, dx, dy, dw, dh, flip) {
    if (entry && entry.ready) {
      if (flip) {
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(entry.img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(entry.img, dx, dy, dw, dh);
      }
      spriteCache.set(key, c);
    }
    return c;
  }

  // Vector Object Sprites
  function getObjectSprite(obj, snowBucket) {
    const key = `vo_${obj.type}_${obj.color}_${obj.fireplace ? 1 : 0}_${obj.flip ? 1 : 0}_${obj.horseColor || 'w'}_${snowBucket}`;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const isBig = obj.size === 2;
    const W = isBig ? 160 : 80;
    const H = obj.type === 'cathedral' ? 160 : (isBig ? 132 : 96);
    const { c, ctx } = makeVectorCanvas(W, H);
    const cx = W / 2;
    const by = H - 10;
    const pal = PALETTES[obj.color] || PALETTES.red;
    const snowThick = snowBucket >= 2 ? 2 : (snowBucket === 1 ? 1 : 0);
    const lit = !!obj.fireplace;

    // Soft ground contact shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(cx, by - (isBig ? 18 : 9), isBig ? 46 : 20, isBig ? 22 : 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (obj.type === 'cottage_svg') {
      const entry = getSvgAsset('cottage_svg', typeof SVG_COTTAGE_URI !== 'undefined' ? SVG_COTTAGE_URI : null);
      return drawSvgAsset(ctx, c, key, W, entry, 14, 2, 132, 122, obj.flip);
    }
    if (obj.type === 'bakery') {
      const entry = getSvgAsset('bakery', typeof SVG_BAKERY_URI !== 'undefined' ? SVG_BAKERY_URI : null);
      return drawSvgAsset(ctx, c, key, W, entry, 4, 10, 72, 78, obj.flip);
    }
    if (obj.type === 'cathedral') {
      const entry = getSvgAsset('cathedral', typeof SVG_CATHEDRAL_URI !== 'undefined' ? SVG_CATHEDRAL_URI : null);
      return drawSvgAsset(ctx, c, key, W, entry, 22, 4, 116, 146, obj.flip);
    }

    if (obj.type === 'cottage') {
      drawVectorBox(ctx, cx, by, 24, 12, 22, pal.wall, pal.wallShade, null);
      // Timber beams
      ctx.strokeStyle = pal.trim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 23, by - 34); ctx.lineTo(cx - 23, by - 12);
      ctx.moveTo(cx, by - 22); ctx.lineTo(cx, by);
      ctx.moveTo(cx + 23, by - 34); ctx.lineTo(cx + 23, by - 12);
      ctx.stroke();
      // Arched door
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.roundRect(cx - 14, by - 18, 7.5, 13, [3.5, 3.5, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(cx - 8.5, by - 11, 0.8, 0, Math.PI * 2); ctx.fill();
      drawVectorWreath(ctx, cx - 10.2, by - 14);

      drawVectorWindow(ctx, cx + 6, by - 19, 8, 7, lit, pal.shutter);
      drawVectorWindow(ctx, cx - 20, by - 26, 5, 6, lit);
      drawVectorRoof(ctx, cx, by, 24, 12, 22, 18, pal.roof, pal.roofShade, snowThick);

      // Stone Chimney
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.roundRect(cx + 8, by - 53, 7, 16, 1); ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx + 12, by - 53, 3, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx + 11.5, by - 53.5, 5, 1.8 + snowThick * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'workshop') {
      drawVectorBox(ctx, cx, by, 26, 13, 24, pal.wall, pal.wallShade, null);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.roundRect(cx + 5, by - 28, 12, 6, 1.5); ctx.fill();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath(); ctx.roundRect(cx + 6, by - 27, 10, 4, 1); ctx.fill();
      drawVectorWindow(ctx, cx - 18, by - 21, 8, 7, lit, pal.shutter);
      drawVectorWindow(ctx, cx + 7, by - 17, 8, 7, lit);
      drawVectorRoof(ctx, cx, by, 26, 13, 24, 19, pal.roof, pal.roofShade, snowThick);
      ctx.fillStyle = '#991b1b';
      ctx.beginPath(); ctx.roundRect(cx - 10, by - 56, 7, 14, 1); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx - 6.5, by - 56, 5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'cabin') {
      drawVectorBox(ctx, cx, by, 24, 12, 20, '#966136', '#6e4321', null);
      ctx.strokeStyle = '#523015';
      ctx.lineWidth = 1;
      for (let y = 3; y < 20; y += 3.5) {
        ctx.beginPath();
        ctx.moveTo(cx - 23, by - 12 - y);
        ctx.lineTo(cx - 1, by - y);
        ctx.stroke();
      }
      ctx.fillStyle = '#451a03';
      ctx.beginPath(); ctx.roundRect(cx - 13, by - 16, 7, 11, [3, 3, 0, 0]); ctx.fill();
      drawVectorWreath(ctx, cx - 9.5, by - 12);
      drawVectorWindow(ctx, cx + 6, by - 18, 7, 6, lit, '#166534');
      drawVectorRoof(ctx, cx, by, 24, 12, 20, 16, '#475569', '#334155', snowThick);
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.roundRect(cx + 8, by - 49, 6, 15, 1); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx + 11, by - 49, 4.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'chapel') {
      drawVectorBox(ctx, cx, by, 22, 11, 24, pal.wall, pal.wallShade, null);
      drawVectorRoof(ctx, cx, by, 22, 11, 24, 16, pal.roof, pal.roofShade, snowThick);
      drawVectorBox(ctx, cx, by - 31, 9, 5, 19, pal.wall, pal.wallShade, null);
      ctx.fillStyle = pal.roof;
      ctx.beginPath();
      ctx.moveTo(cx - 10, by - 54);
      ctx.lineTo(cx + 10, by - 54);
      ctx.lineTo(cx, by - 77);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, by - 84); ctx.lineTo(cx, by - 77);
      ctx.moveTo(cx - 3, by - 81); ctx.lineTo(cx + 3, by - 81);
      ctx.stroke();
      drawVectorWindow(ctx, cx + 6, by - 19, 6, 11, true);
      drawVectorWindow(ctx, cx - 12, by - 19, 6, 11, true);
    }
    else if (obj.type === 'townhall') {
      drawVectorBox(ctx, cx, by, 52, 26, 34, pal.wall, pal.wallShade, null);
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath(); ctx.roundRect(cx - 15, by - 20, 10, 15, [4, 4, 0, 0]); ctx.fill();
      drawVectorWreath(ctx, cx - 10, by - 14);
      for (let i = -38; i <= 32; i += 14) {
        if (Math.abs(i) > 6) drawVectorWindow(ctx, cx + i, by - 28, 7, 9, lit, pal.shutter);
      }
      drawVectorRoof(ctx, cx, by, 52, 26, 34, 26, pal.roof, pal.roofShade, snowThick);
      drawVectorBox(ctx, cx, by - 56, 12, 6, 26, pal.wall, pal.wallShade, null);
      // Circular illuminated clock
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath(); ctx.arc(cx + 6, by - 70, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 6, by - 70); ctx.lineTo(cx + 6, by - 73); ctx.moveTo(cx + 6, by - 70); ctx.lineTo(cx + 8.5, by - 70); ctx.stroke();

      ctx.fillStyle = pal.roof;
      ctx.beginPath();
      ctx.moveTo(cx - 13, by - 86); ctx.lineTo(cx + 13, by - 86); ctx.lineTo(cx, by - 107);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1e293b'; ctx.stroke();
    }
    else if (obj.type === 'butcher') {
      drawVectorBox(ctx, cx, by, 25, 12.5, 23, pal.wall, pal.wallShade, null);
      // Red & white butcher awning
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#b91c1c' : '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(cx - 21 + i * 3, by - 18 + i * 1.4, 3.2, 5, [0, 0, 1.5, 1.5]);
        ctx.fill();
      }
      // Warm display window + hanging sign
      drawVectorWindow(ctx, cx + 5, by - 17, 11, 8, true);
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.roundRect(cx - 17, by - 25, 9, 5, 1); ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath(); ctx.arc(cx - 12.5, by - 22.5, 1.5, 0, Math.PI * 2); ctx.fill();
      drawVectorRoof(ctx, cx, by, 25, 12.5, 23, 16, pal.roof, pal.roofShade, snowThick);
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath(); ctx.roundRect(cx + 8, by - 52, 6, 14, 1); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx + 11, by - 52, 4.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'postoffice') {
      drawVectorBox(ctx, cx, by, 24, 12, 22, pal.wall, pal.wallShade, null);
      ctx.fillStyle = '#166534';
      ctx.beginPath(); ctx.roundRect(cx - 13, by - 17, 7, 12, [3, 3, 0, 0]); ctx.fill();
      drawVectorWreath(ctx, cx - 9.5, by - 13);
      drawVectorWindow(ctx, cx + 6, by - 18, 9, 7, lit, '#b91c1c');
      // Red postbox out front
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.roundRect(cx - 20, by - 14, 4.5, 7, [2, 2, 0.5, 0.5]); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx - 19, by - 12, 2.5, 1);
      drawVectorRoof(ctx, cx, by, 24, 12, 22, 16, pal.roof, pal.roofShade, snowThick);
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.roundRect(cx - 11, by - 50, 6, 13, 1); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx - 8, by - 50, 4.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'school') {
      drawVectorBox(ctx, cx, by, 52, 26, 32, '#b45348', '#8f3d34', null);
      // Double arched school doors + wreath
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath(); ctx.roundRect(cx - 16, by - 20, 11, 15, [4, 4, 0, 0]); ctx.fill();
      drawVectorWreath(ctx, cx - 10.5, by - 14);
      // Tall classroom windows
      for (let i = -39; i <= 33; i += 13) {
        if (Math.abs(i + 10) > 7) drawVectorWindow(ctx, cx + i, by - 27, 7, 10, lit, '#f8fafc');
      }
      drawVectorRoof(ctx, cx, by, 52, 26, 32, 24, pal.roof, pal.roofShade, snowThick);
      // Bell Cupola
      drawVectorBox(ctx, cx, by - 54, 10, 5, 16, '#f8fafc', '#cbd5e1', null);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(cx, by - 64, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.roof;
      ctx.beginPath();
      ctx.moveTo(cx - 11, by - 73); ctx.lineTo(cx + 11, by - 73); ctx.lineTo(cx, by - 88);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1e293b'; ctx.stroke();
    }
    else if (obj.type === 'hospital') {
      drawVectorBox(ctx, cx, by, 52, 26, 36, '#f1f5f9', '#cbd5e1', null);
      // Covered entrance
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.roundRect(cx - 16, by - 20, 12, 16, [3, 3, 0, 0]); ctx.fill();
      // Red Cross emblem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(cx - 15, by - 34, 10, 10, 2); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 11.2, by - 32.5, 2.4, 7);
      ctx.fillRect(cx - 13.5, by - 30.2, 7, 2.4);
      // Two floors of ward windows
      for (let i = -38; i <= 32; i += 14) {
        if (Math.abs(i + 10) > 8) drawVectorWindow(ctx, cx + i, by - 22, 7, 7, lit);
        drawVectorWindow(ctx, cx + i, by - 34, 7, 7, lit);
      }
      drawVectorRoof(ctx, cx, by, 52, 26, 36, 22, '#334155', '#1e293b', snowThick);
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.roundRect(cx + 20, by - 72, 7, 16, 1); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx + 23.5, by - 72, 5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'inn') {
      drawVectorBox(ctx, cx, by, 52, 26, 36, pal.wall, pal.wallShade, null);
      // Timber half-framing
      ctx.strokeStyle = pal.trim; ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 50, by - 46); ctx.lineTo(cx, by - 20); ctx.lineTo(cx + 50, by - 46);
      ctx.stroke();
      // Tavern door & hanging lantern sign
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath(); ctx.roundRect(cx - 14, by - 20, 10, 15, [4, 4, 0, 0]); ctx.fill();
      drawVectorWreath(ctx, cx - 9, by - 14);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.roundRect(cx + 2, by - 26, 11, 6, 1.5); ctx.fill();
      for (let i = -38; i <= 32; i += 14) {
        if (Math.abs(i + 9) > 7) drawVectorWindow(ctx, cx + i, by - 22, 7, 7, true, pal.shutter);
        drawVectorWindow(ctx, cx + i, by - 34, 7, 7, lit, pal.shutter);
      }
      drawVectorRoof(ctx, cx, by, 52, 26, 36, 24, pal.roof, pal.roofShade, snowThick);
      // Twin chimneys
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath(); ctx.roundRect(cx - 22, by - 74, 7, 16, 1); ctx.roundRect(cx + 16, by - 74, 7, 16, 1); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx - 18.5, by - 74, 5, 1.8, 0, 0, Math.PI * 2); ctx.ellipse(cx + 19.5, by - 74, 5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'pine' || obj.type === 'grandtree') {
      const tall = obj.type === 'grandtree';
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath(); ctx.roundRect(cx - 3, by - 15, 6, 11, 1.5); ctx.fill();
      const tiers = tall ? 4 : 3;
      for (let t = 0; t < tiers; t++) {
        const w = (tall ? 25 : 19) - t * 4;
        const y0 = by - 13 - t * 11;
        const h = 18;
        const g = ctx.createLinearGradient(cx - w, y0 - h, cx + w, y0);
        g.addColorStop(0, '#15803d');
        g.addColorStop(1, '#0d3b20');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx - w, y0);
        ctx.quadraticCurveTo(cx, y0 + 3, cx + w, y0);
        ctx.quadraticCurveTo(cx + w * 0.45, y0 - h * 0.55, cx, y0 - h);
        ctx.quadraticCurveTo(cx - w * 0.45, y0 - h * 0.55, cx - w, y0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0a2e18'; ctx.lineWidth = 0.9; ctx.stroke();

        // Curved snow tufts
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(cx - w * 0.55, y0 - 1.5, 4.5, 1.8, -0.25, 0, Math.PI * 2);
        ctx.ellipse(cx + w * 0.55, y0 - 1.5, 4.5, 1.8, 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      if (tall) {
        // Glowing 5-point vector star
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 5 : 2.1;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const sx = cx + Math.cos(a) * r, sy = (by - 66) + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.closePath(); ctx.fill();
      }
    }
    else if (obj.type === 'lamppost') {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.ellipse(cx, by - 7, 4.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(cx, by - 7); ctx.lineTo(cx, by - 45); ctx.stroke();
      // Decorative scroll bracket
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx - 3, by - 42, 3, 0, Math.PI * 1.5); ctx.stroke();
      // Lantern glass
      const lg = ctx.createRadialGradient(cx, by - 49, 1, cx, by - 49, 6);
      lg.addColorStop(0, '#fef9c3'); lg.addColorStop(1, '#facc15');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.roundRect(cx - 4, by - 53, 8, 8, 1.5); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.stroke();
      // Cap + snow
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.moveTo(cx - 5.5, by - 53); ctx.lineTo(cx + 5.5, by - 53); ctx.lineTo(cx, by - 58); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(cx, by - 55.5, 4, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    else if (obj.type === 'snowman') {
      const drawSnowball = (x, y, r) => {
        const sg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.8; ctx.stroke();
      };
      drawSnowball(cx, by - 12, 8);
      drawSnowball(cx, by - 23, 6);
      drawSnowball(cx, by - 32, 4.5);
      // Scarf
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(cx - 4.5, by - 27.5); ctx.quadraticCurveTo(cx, by - 26, cx + 4.5, by - 27.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 3, by - 27); ctx.lineTo(cx + 5, by - 21); ctx.stroke();
      // Top hat
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.ellipse(cx, by - 36, 6.5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(cx - 4, by - 44, 8, 8, 1); ctx.fill();
      ctx.fillStyle = '#dc2626'; ctx.fillRect(cx - 4, by - 38.5, 8, 1.5);
      // Carrot nose & eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(cx - 1.6, by - 33, 0.8, 0, Math.PI * 2); ctx.arc(cx + 1.6, by - 33, 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.moveTo(cx, by - 32); ctx.lineTo(cx + 5, by - 31); ctx.lineTo(cx, by - 30.2); ctx.closePath(); ctx.fill();
    }
    else if (obj.type === 'stall') {
      drawVectorBox(ctx, cx, by, 17, 9, 11, '#92400e', '#78350f', '#b45309');
      ctx.strokeStyle = '#5c3a21'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 14, by - 14); ctx.lineTo(cx - 14, by - 31); ctx.moveTo(cx + 14, by - 14); ctx.lineTo(cx + 14, by - 31); ctx.stroke();
      for (let i = -17; i < 17; i += 4.25) {
        ctx.fillStyle = (Math.round(i) % 2 === 0) ? pal.roof : '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(cx + i, by - 34, 4.25, 6.5, [0, 0, 2, 2]);
        ctx.fill();
      }
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.roundRect(cx - 17, by - 35, 34, 2.5, 1); ctx.fill();
    }
    else if (obj.type === 'bench') {
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 10, by - 5); ctx.lineTo(cx - 10, by - 12); ctx.moveTo(cx + 10, by - 5); ctx.lineTo(cx + 10, by - 12); ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.roundRect(cx - 12, by - 13, 24, 3.5, 1); ctx.roundRect(cx - 12, by - 20, 24, 5, 1.5); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.roundRect(cx - 12, by - 21, 24, 2, 1); ctx.fill();
    }
    else if (obj.type === 'bonfire') {
      ctx.fillStyle = '#64748b';
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 8, by - 8 + Math.sin(a) * 3.5, 3.5, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.roundRect(cx - 6, by - 12, 12, 3, 1.5); ctx.fill();
    }
    else if (obj.type === 'sleigh') {
      // Curved golden runners
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 15, by - 7);
      ctx.lineTo(cx + 11, by - 7);
      ctx.quadraticCurveTo(cx + 17, by - 7, cx + 16, by - 13);
      ctx.stroke();
      // Glossy crimson sleigh body
      const sg = ctx.createLinearGradient(cx - 14, by - 24, cx + 12, by - 9);
      sg.addColorStop(0, '#ef4444'); sg.addColorStop(1, '#991b1b');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(cx - 14, by - 23);
      ctx.quadraticCurveTo(cx - 6, by - 16, cx + 12, by - 17);
      ctx.lineTo(cx + 10, by - 9);
      ctx.lineTo(cx - 12, by - 9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.2; ctx.stroke();
      // Gift boxes
      ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.roundRect(cx - 8, by - 24, 8, 7, 1); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.roundRect(cx + 1, by - 22, 6, 5, 1); ctx.fill();
    }
    else if (obj.type === 'horse') {
      const hc = HORSE_COLORS.find(h => h.id === obj.horseColor) || HORSE_COLORS[0];
      ctx.strokeStyle = hc.shade; ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 7, by - 14); ctx.lineTo(cx - 7, by - 6);
      ctx.moveTo(cx - 3, by - 14); ctx.lineTo(cx - 3, by - 6);
      ctx.moveTo(cx + 4, by - 14); ctx.lineTo(cx + 4, by - 6);
      ctx.moveTo(cx + 8, by - 14); ctx.lineTo(cx + 8, by - 6);
      ctx.stroke();
      // Body & neck
      ctx.fillStyle = hc.body;
      ctx.beginPath(); ctx.ellipse(cx, by - 17, 10, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 5, by - 19); ctx.quadraticCurveTo(cx + 9, by - 28, cx + 11, by - 31);
      ctx.lineTo(cx + 15, by - 29); ctx.quadraticCurveTo(cx + 11, by - 23, cx + 9, by - 16);
      ctx.closePath(); ctx.fill();
      // Saddle blanket
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.roundRect(cx - 5, by - 22, 10, 6, 2); ctx.fill();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1; ctx.stroke();
      // Mane & flowing tail
      ctx.strokeStyle = hc.mane; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx - 10, by - 18); ctx.quadraticCurveTo(cx - 14, by - 14, cx - 12, by - 9); ctx.stroke();
    }
    else if (obj.type === 'carolers') {
      const coats = ['#dc2626', '#16a34a', '#2563eb'];
      [-10, 0, 10].forEach((dx, i) => {
        ctx.fillStyle = coats[i];
        ctx.beginPath(); ctx.roundRect(cx + dx - 4, by - 19, 8, 12, [3, 3, 1, 1]); ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath(); ctx.arc(cx + dx, by - 22.5, 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.ellipse(cx + dx, by - 25, 3.2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.roundRect(cx + dx - 1.5, by - 16, 4, 3.5, 0.6); ctx.fill();
      });
    }
    else if (obj.type === 'skater') {
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx - 5, by - 5.5); ctx.lineTo(cx, by - 5.5); ctx.moveTo(cx + 1, by - 5.5); ctx.lineTo(cx + 6, by - 5.5); ctx.stroke();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath(); ctx.roundRect(cx - 4.5, by - 18, 9, 11, [4, 4, 2, 2]); ctx.fill();
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(cx - 4, by - 18); ctx.lineTo(cx + 4, by - 18); ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(cx, by - 22, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(cx, by - 24, 3.2, Math.PI, 0); ctx.fill();
    }
    else if (obj.type === 'reindeer') {
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, by - 14); ctx.lineTo(cx - 6, by - 6);
      ctx.moveTo(cx + 6, by - 14); ctx.lineTo(cx + 6, by - 6);
      ctx.stroke();
      ctx.fillStyle = '#92400e';
      ctx.beginPath(); ctx.ellipse(cx, by - 17, 8.5, 4.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(cx + 4, by - 28, 4.5, 11, 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 9.5, by - 27.5, 4.2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(cx + 13.5, by - 27.5, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cx + 6, by - 29); ctx.lineTo(cx + 5, by - 35);
      ctx.moveTo(cx + 5.5, by - 32); ctx.lineTo(cx + 8, by - 34);
      ctx.stroke();
    }

    if (obj.flip) {
      const flipped = makeVectorCanvas(W, H);
      flipped.ctx.translate(W, 0);
      flipped.ctx.scale(-1, 1);
      flipped.ctx.drawImage(c, 0, 0, W, H);
      spriteCache.set(key, flipped.c);
      return flipped.c;
    }

    spriteCache.set(key, c);
    return c;
  }

  function getItemThumbnail(catItem) {
    if (catItem.type === 'terrain') return getTerrainSprite(catItem.id, 0, 0, 0);
    if (catItem.type === 'elev') {
      const key = `thumb_${catItem.id}`;
      if (spriteCache.has(key)) return spriteCache.get(key);
      const { c, ctx } = makeVectorCanvas(64, 56);
      drawIsoDiamond(ctx, 32, 36, 48, 24, '#deecfb', '#64748b', 1.2);
      ctx.fillStyle = catItem.delta > 0 ? '#22c55e' : '#38bdf8';
      ctx.beginPath();
      if (catItem.delta > 0) {
        ctx.moveTo(32, 10); ctx.lineTo(42, 22); ctx.lineTo(36, 22); ctx.lineTo(36, 32);
        ctx.lineTo(28, 32); ctx.lineTo(28, 22); ctx.lineTo(22, 22);
      } else {
        ctx.moveTo(32, 34); ctx.lineTo(42, 22); ctx.lineTo(36, 22); ctx.lineTo(36, 12);
        ctx.lineTo(28, 12); ctx.lineTo(28, 22); ctx.lineTo(22, 22);
      }
      ctx.closePath(); ctx.fill();
      spriteCache.set(key, c);
      return c;
    }
    return getObjectSprite({
      type: catItem.id, size: catItem.size || 1, color: 'red',
      fireplace: true, flip: false, horseColor: 'white',
    }, 0);
  }

