  // =========================================================================
  // 8. INPUT HANDLING
  // =========================================================================
  let isPanning = false, isPainting = false, spaceDown = false, paintUndoPushed = false;
  let panStart = { x: 0, y: 0, cx: 0, cy: 0 };

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousedown', e => {
    if (state.snowMode) return;
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY, cx: state.camera.x, cy: state.camera.y };
      canvas.style.cursor = 'grabbing';
      return;
    }
    const tile = screenToGrid(e.clientX, e.clientY);
    if (!tile) return;
    if (e.button === 2) {
      isPainting = true; paintUndoPushed = false; eraseAt(tile.x, tile.y); return;
    }
    if (e.button === 0) {
      if (state.selectedTool === 'inspect') {
        inspectAt(tile.x, tile.y);
      } else if (state.selectedTool === 'erase') {
        isPainting = true; paintUndoPushed = false; eraseAt(tile.x, tile.y);
      } else {
        isPainting = true; paintUndoPushed = false; placeAt(tile.x, tile.y);
      }
    }
  });

  window.addEventListener('mousemove', e => {
    if (isPanning) {
      state.camera.x = panStart.cx + (e.clientX - panStart.x);
      state.camera.y = panStart.cy + (e.clientY - panStart.y);
      return;
    }
    const tile = screenToGrid(e.clientX, e.clientY);
    state.hoverTile = tile;
    if (isPainting && tile && !state.snowMode) {
      if (e.buttons === 2 || state.selectedTool === 'erase') eraseAt(tile.x, tile.y);
      else if (state.selectedTool === 'place' && CATALOG_MAP[state.selectedItem]?.type === 'terrain') {
        placeAt(tile.x, tile.y);
      }
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) { isPanning = false; canvas.style.cursor = spaceDown ? 'grab' : 'crosshair'; }
    isPainting = false; paintUndoPushed = false;
  });

  const ZOOM_LEVELS = [0.2, 0.28, 0.4, 0.55, 0.75, 1, 1.5, 2, 3];
  function setZoom(nextZoom, pivotX = viewW / 2, pivotY = viewH / 2) {
    const clamped = Math.max(0.2, Math.min(3, nextZoom));
    if (clamped === state.camera.zoom) return;
    const ratio = clamped / state.camera.zoom;
    state.camera.x = pivotX - (pivotX - state.camera.x) * ratio;
    state.camera.y = pivotY - (pivotY - state.camera.y) * ratio;
    state.camera.zoom = clamped;
  }

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const idx = ZOOM_LEVELS.indexOf(state.camera.zoom);
    const cur = idx === -1 ? 5 : idx;
    const nextIdx = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, cur + (e.deltaY < 0 ? 1 : -1)));
    setZoom(ZOOM_LEVELS[nextIdx], e.clientX, e.clientY);
  }, { passive: false });

  function placeAt(gx, gy) {
    const item = CATALOG_MAP[state.selectedItem];
    if (!item) return;
    if (item.type === 'elev') {
      pushUndo();
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          const cur = state.corners[gy + dy][gx + dx] || 0;
          state.corners[gy + dy][gx + dx] = Math.max(0, Math.min(12, cur + item.delta * 0.75));
        }
      }
      audio.playClick(item.delta > 0 ? 520 : 340);
      autoSave();
      return;
    }
    if (item.type === 'terrain') {
      if (state.terrain[gy][gx] === item.id) return;
      if (!paintUndoPushed) { pushUndo(); paintUndoPushed = true; }
      state.terrain[gy][gx] = item.id;
      audio.playClick(420); autoSave(); return;
    }
    const sz = item.size || 1;
    if (!canPlaceObject(gx, gy, sz)) return;
    pushUndo();
    state.objects.push({
      id: state.nextObjId++,
      type: item.id, x: gx, y: gy, size: sz,
      color: state.config.color,
      lights: item.hasLights ? state.config.lights : 'none',
      lightMode: state.config.lightMode,
      fireplace: item.hasFireplace ? state.config.fireplace : false,
      flip: item.hasFlip ? state.config.flip : false,
      horseColor: item.hasHorseColor ? state.config.horseColor : 'white',
    });
    audio.playClick(580); autoSave();
  }

  function eraseAt(gx, gy) {
    const obj = findObjectAt(gx, gy);
    if (obj) {
      if (!paintUndoPushed) { pushUndo(); paintUndoPushed = true; }
      state.objects = state.objects.filter(o => o.id !== obj.id);
      if (state.inspectedObjId === obj.id) { state.inspectedObjId = null; renderConfigPanel(); }
      audio.playClick(260); autoSave();
    } else if (state.terrain[gy][gx] !== 'grass' && state.terrain[gy][gx] !== 'shrub') {
      if (!paintUndoPushed) { pushUndo(); paintUndoPushed = true; }
      state.terrain[gy][gx] = 'grass';
      audio.playClick(300); autoSave();
    }
  }

  function inspectAt(gx, gy) {
    const obj = findObjectAt(gx, gy);
    state.inspectedObjId = obj ? obj.id : null;
    if (obj) {
      audio.playClick(640);
      openDockDialog('dialog-options');
    }
    renderConfigPanel();
  }

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { spaceDown = true; if (!isPanning) canvas.style.cursor = 'grab'; e.preventDefault(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    if (e.key.toLowerCase() === 'r') toggleFlip();
    if (e.key.toLowerCase() === 'b') toggleDockDialog('dialog-build');
    if (e.key.toLowerCase() === 'o') toggleDockDialog('dialog-options');
    if (e.key === '1') setTool('place');
    if (e.key === '2') setTool('inspect');
    if (e.key === '3') setTool('erase');
    if (!e.ctrlKey && !e.metaKey && (e.key === '+' || e.key === '=')) {
      const idx = ZOOM_LEVELS.indexOf(state.camera.zoom);
      setZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, (idx === -1 ? 5 : idx) + 1)]);
    }
    if (!e.ctrlKey && !e.metaKey && (e.key === '-' || e.key === '_')) {
      const idx = ZOOM_LEVELS.indexOf(state.camera.zoom);
      setZoom(ZOOM_LEVELS[Math.max(0, (idx === -1 ? 5 : idx) - 1)]);
    }
    if (e.key === 'Escape') {
      if (state.snowMode) exitSnowMode();
      else closeAllDockDialogs();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'Space') { spaceDown = false; if (!isPanning) canvas.style.cursor = 'crosshair'; }
  });

