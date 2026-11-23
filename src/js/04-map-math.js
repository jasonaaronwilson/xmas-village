  // =========================================================================
  // 5. COORDINATE MATH & COLLISION (HiDPI Vector Canvas)
  // =========================================================================
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let viewW = window.innerWidth;
  let viewH = window.innerHeight;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  function centerCamera() {
    state.camera.x = viewW / 2 + 24;
    state.camera.y = viewH / 2 - (GRID_SIZE * TILE_H * state.camera.zoom) / 2;
  }

  function cornerScreen(cx, cy) {
    const z = state.camera.zoom;
    const h = state.corners[cy]?.[cx] || 0;
    return {
      x: state.camera.x + (cx - cy) * (TILE_W / 2) * z,
      y: state.camera.y + (cx + cy) * (TILE_H / 2) * z - h * ELEV_STEP * z,
    };
  }

  function tileElev(gx, gy) {
    const n = state.corners[gy]?.[gx] || 0;
    const e = state.corners[gy]?.[gx + 1] || 0;
    const s = state.corners[gy + 1]?.[gx + 1] || 0;
    const w = state.corners[gy + 1]?.[gx] || 0;
    return (n + e + s + w) / 4;
  }

  function gridToScreen(gx, gy, elev = 0) {
    const z = state.camera.zoom;
    return {
      x: state.camera.x + (gx - gy) * (TILE_W / 2) * z,
      y: state.camera.y + (gx + gy) * (TILE_H / 2) * z - elev * ELEV_STEP * z,
    };
  }

  function pointInQuad(px, py, p0, p1, p2, p3) {
    const cross = (a, b) => (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
    return cross(p0, p1) >= 0 && cross(p1, p2) >= 0 && cross(p2, p3) >= 0 && cross(p3, p0) >= 0;
  }

  function screenToGrid(sx, sy) {
    // Check in front-to-back order using true 4-corner sloped tile quads
    for (let sum = (GRID_SIZE - 1) * 2; sum >= 0; sum--) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const gy = sum - gx;
        if (gy < 0 || gy >= GRID_SIZE) continue;
        const pN = cornerScreen(gx, gy);
        const pE = cornerScreen(gx + 1, gy);
        const pS = cornerScreen(gx + 1, gy + 1);
        const pW = cornerScreen(gx, gy + 1);
        if (pointInQuad(sx, sy, pN, pE, pS, pW)) return { x: gx, y: gy };
      }
    }
    return null;
  }

  function findObjectAt(gx, gy) {
    return state.objects.find(o => {
      const s = o.size || 1;
      return gx >= o.x && gx < o.x + s && gy >= o.y && gy < o.y + s;
    });
  }

  function canPlaceObject(gx, gy, size) {
    if (gx < 0 || gy < 0 || gx + size > GRID_SIZE || gy + size > GRID_SIZE) return false;
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        if (findObjectAt(gx + dx, gy + dy)) return false;
      }
    }
    return true;
  }

  // =========================================================================
  // 6. UNDO / REDO & MUTATION
  // =========================================================================
  function captureSnapshot() {
    return JSON.stringify({ terrain: state.terrain, corners: state.corners, objects: state.objects, nextObjId: state.nextObjId });
  }

  function pushUndo() {
    state.undoStack.push(captureSnapshot());
    if (state.undoStack.length > 60) state.undoStack.shift();
    state.redoStack = [];
    updateUndoButtons();
  }

  function restoreSnapshot(snapStr) {
    const data = JSON.parse(snapStr);
    state.terrain = data.terrain;
    state.corners = data.corners || Array.from({ length: GRID_SIZE + 1 }, () => Array.from({ length: GRID_SIZE + 1 }, () => 0));
    state.objects = data.objects;
    state.nextObjId = data.nextObjId || 1;
    state.inspectedObjId = null;
    renderConfigPanel();
    autoSave();
  }

  function undo() {
    if (!state.undoStack.length) return;
    state.redoStack.push(captureSnapshot());
    restoreSnapshot(state.undoStack.pop());
    updateUndoButtons();
    audio.playClick(380);
  }

  function redo() {
    if (!state.redoStack.length) return;
    state.undoStack.push(captureSnapshot());
    restoreSnapshot(state.redoStack.pop());
    updateUndoButtons();
    audio.playClick(460);
  }

  function updateUndoButtons() {
    document.getElementById('btn-undo').disabled = state.undoStack.length === 0;
    document.getElementById('btn-redo').disabled = state.redoStack.length === 0;
  }

