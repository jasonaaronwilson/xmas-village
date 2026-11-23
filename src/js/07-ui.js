  // =========================================================================
  // 9. LEFT TOOLBAR DIALOGS & CONFIGURATOR
  // =========================================================================
  function closeAllDockDialogs() {
    document.querySelectorAll('.dock-dialog').forEach(d => d.classList.remove('open'));
    document.getElementById('btn-dock-build').classList.remove('dialog-open');
    document.getElementById('btn-dock-options').classList.remove('dialog-open');
  }

  function openDockDialog(id) {
    const already = document.getElementById(id).classList.contains('open');
    closeAllDockDialogs();
    if (!already) {
      document.getElementById(id).classList.add('open');
      if (id === 'dialog-build') document.getElementById('btn-dock-build').classList.add('dialog-open');
      if (id === 'dialog-options') document.getElementById('btn-dock-options').classList.add('dialog-open');
    }
  }

  function toggleDockDialog(id) {
    const el = document.getElementById(id);
    if (el.classList.contains('open')) closeAllDockDialogs();
    else openDockDialog(id);
  }

  function setTool(tool) {
    state.selectedTool = tool;
    if (tool !== 'inspect') state.inspectedObjId = null;
    document.getElementById('tool-place').classList.toggle('active', tool === 'place');
    document.getElementById('tool-inspect').classList.toggle('active', tool === 'inspect');
    document.getElementById('tool-erase').classList.toggle('active', tool === 'erase');
    renderConfigPanel();
  }

  function toggleFlip() {
    if (state.inspectedObjId) {
      const obj = state.objects.find(o => o.id === state.inspectedObjId);
      if (obj && CATALOG_MAP[obj.type]?.hasFlip) { pushUndo(); obj.flip = !obj.flip; autoSave(); }
    } else {
      state.config.flip = !state.config.flip;
    }
    audio.playClick(500);
    renderConfigPanel();
  }

  function renderPalette() {
    document.querySelectorAll('.cat-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.cat === state.selectedCat);
    });
    const grid = document.getElementById('item-grid');
    grid.innerHTML = '';
    const items = CATALOG.filter(c => c.cat === state.selectedCat);
    for (const item of items) {
      const card = document.createElement('div');
      card.className = 'item-card' + (state.selectedItem === item.id ? ' selected' : '');
      const thumb = getItemThumbnail(item);
      const preview = document.createElement('canvas');
      preview.width = 116; preview.height = 116;
      const pctx = preview.getContext('2d');
      pctx.imageSmoothingEnabled = true;
      pctx.imageSmoothingQuality = 'high';
      const scale = Math.min(104 / thumb.width, 104 / thumb.height);
      const dw = thumb.width * scale, dh = thumb.height * scale;
      pctx.drawImage(thumb, (116 - dw) / 2, (116 - dh) / 2, dw, dh);

      const label = document.createElement('span');
      label.textContent = item.name;
      card.appendChild(preview);
      card.appendChild(label);

      card.onclick = () => {
        state.selectedItem = item.id;
        setTool('place');
        renderPalette();
        renderConfigPanel();
        audio.playClick(540);
      };
      grid.appendChild(card);
    }
  }

  function renderConfigPanel() {
    const titleEl = document.getElementById('config-item-title');
    const descEl = document.getElementById('config-item-desc');
    const container = document.getElementById('config-options-container');
    container.innerHTML = '';

    let targetObj = null;
    let itemMeta = CATALOG_MAP[state.selectedItem];

    if (state.selectedTool === 'inspect') {
      targetObj = state.objects.find(o => o.id === state.inspectedObjId);
      if (!targetObj) {
        titleEl.textContent = '🔍 Inspect Mode';
        descEl.textContent = 'Click any building or feature on the map to customize it.';
        return;
      }
      itemMeta = CATALOG_MAP[targetObj.type];
      titleEl.textContent = `🎨 ${itemMeta.name}`;
      descEl.textContent = `Tile (${targetObj.x}, ${targetObj.y}) — edits apply live.`;
    } else {
      titleEl.textContent = itemMeta ? `🎨 ${itemMeta.name}` : '🎨 Customize';
      descEl.textContent = itemMeta ? itemMeta.desc : '';
    }

    if (!itemMeta) return;
    const activeCfg = targetObj || state.config;

    const mutate = (key, val) => {
      if (targetObj) { pushUndo(); targetObj[key] = val; autoSave(); }
      else { state.config[key] = val; }
      audio.playClick(520);
      renderConfigPanel();
    };

    if (itemMeta.hasColor) {
      const row = document.createElement('div');
      row.className = 'option-row';
      row.innerHTML = `<label><span>Style / Color</span><span>${PALETTES[activeCfg.color]?.name || ''}</span></label>`;
      const group = document.createElement('div');
      group.className = 'chip-group';
      for (const [k, pal] of Object.entries(PALETTES)) {
        const dot = document.createElement('div');
        dot.className = 'color-dot' + (activeCfg.color === k ? ' active' : '');
        dot.style.background = pal.roof;
        dot.title = pal.name;
        dot.onclick = () => mutate('color', k);
        group.appendChild(dot);
      }
      row.appendChild(group);
      container.appendChild(row);
    }

    if (itemMeta.hasHorseColor) {
      const row = document.createElement('div');
      row.className = 'option-row';
      row.innerHTML = `<label>Coat Color</label>`;
      const group = document.createElement('div');
      group.className = 'chip-group';
      for (const hc of HORSE_COLORS) {
        const chip = document.createElement('div');
        chip.className = 'chip' + (activeCfg.horseColor === hc.id ? ' active' : '');
        chip.textContent = hc.name;
        chip.onclick = () => mutate('horseColor', hc.id);
        group.appendChild(chip);
      }
      row.appendChild(group);
      container.appendChild(row);
    }

    if (itemMeta.hasLights) {
      const row = document.createElement('div');
      row.className = 'option-row';
      row.innerHTML = `<label>Christmas Lights</label>`;
      const group = document.createElement('div');
      group.className = 'chip-group';
      for (const ls of LIGHT_STYLES) {
        const chip = document.createElement('div');
        chip.className = 'chip' + (activeCfg.lights === ls.id ? ' active' : '');
        chip.textContent = ls.name;
        chip.onclick = () => mutate('lights', ls.id);
        group.appendChild(chip);
      }
      row.appendChild(group);
      container.appendChild(row);

      if (activeCfg.lights !== 'none') {
        const mRow = document.createElement('div');
        mRow.className = 'option-row';
        mRow.innerHTML = `<label>Light Pattern</label>`;
        const mGroup = document.createElement('div');
        mGroup.className = 'chip-group';
        for (const lm of LIGHT_MODES) {
          const chip = document.createElement('div');
          chip.className = 'chip' + (activeCfg.lightMode === lm.id ? ' active' : '');
          chip.textContent = lm.name;
          chip.onclick = () => mutate('lightMode', lm.id);
          mGroup.appendChild(chip);
        }
        mRow.appendChild(mGroup);
        container.appendChild(mRow);
      }
    }

    if (itemMeta.hasFireplace) {
      const row = document.createElement('div');
      row.className = 'option-row';
      const sw = document.createElement('div');
      sw.className = 'toggle-switch';
      sw.innerHTML = `<span>🔥 Fireplace & Chimney</span><div class="toggle-pill ${activeCfg.fireplace ? 'on' : ''}"></div>`;
      sw.onclick = () => mutate('fireplace', !activeCfg.fireplace);
      row.appendChild(sw);
      container.appendChild(row);
    }

    if (itemMeta.hasFlip) {
      const row = document.createElement('div');
      row.className = 'option-row';
      const sw = document.createElement('div');
      sw.className = 'toggle-switch';
      sw.innerHTML = `<span>🔄 Facing</span><span style="color:var(--accent-gold);font-weight:600;">${activeCfg.flip ? 'Right' : 'Left'}</span>`;
      sw.onclick = () => mutate('flip', !activeCfg.flip);
      row.appendChild(sw);
      container.appendChild(row);
    }

    if (targetObj) {
      const lRow = document.createElement('div');
      lRow.className = 'option-row';
      lRow.innerHTML = `<label>🏷️ Landmark Label (for Snow Tour)</label>`;
      const lInput = document.createElement('input');
      lInput.type = 'text';
      lInput.placeholder = `e.g. ${itemMeta.name}`;
      lInput.value = targetObj.label || '';
      lInput.oninput = () => { targetObj.label = lInput.value; autoSave(); };
      lRow.appendChild(lInput);
      container.appendChild(lRow);

      const dRow = document.createElement('div');
      dRow.className = 'option-row';
      dRow.innerHTML = `<label>📝 Description</label>`;
      const dInput = document.createElement('textarea');
      dInput.rows = 2;
      dInput.placeholder = 'A short cozy description...';
      dInput.value = targetObj.note || '';
      dInput.oninput = () => { targetObj.note = dInput.value; autoSave(); };
      dRow.appendChild(dInput);
      container.appendChild(dRow);
    }
  }

  // =========================================================================
  // 10. SNOW MODE, SAVES & SHARE
  // =========================================================================
  function enterSnowMode(showGreeting = false) {
    state.snowMode = true;
    closeAllDockDialogs();
    document.getElementById('left-dock').classList.add('hidden-editor');
    document.getElementById('btn-exit-snow').classList.add('visible');

    state.tour.savedCam = { x: state.camera.x, y: state.camera.y, zoom: state.camera.zoom };
    const labeled = state.objects.filter(o => (o.label && o.label.trim()) || (o.note && o.note.trim()));
    state.tour.stops = labeled.map(o => ({
      obj: o,
      title: (o.label && o.label.trim()) || CATALOG_MAP[o.type]?.name || 'Landmark',
      desc: (o.note && o.note.trim()) || '',
    }));
    state.tour.index = 0;
    state.tour.timer = 0;
    state.tour.active = state.tourEnabled && state.tour.stops.length > 0;

    if (showGreeting) showGreetingBanner();
  }

  function exitSnowMode() {
    state.snowMode = false;
    state.tour.active = false;
    document.getElementById('tour-caption').classList.remove('visible');
    if (state.tour.savedCam) {
      state.camera.x = state.tour.savedCam.x;
      state.camera.y = state.tour.savedCam.y;
      state.camera.zoom = state.tour.savedCam.zoom;
      state.tour.savedCam = null;
    }
    document.getElementById('left-dock').classList.remove('hidden-editor');
    document.getElementById('btn-exit-snow').classList.remove('visible');
    document.getElementById('greeting-banner').classList.remove('visible');
  }

  function showGreetingBanner() {
    document.getElementById('banner-title').textContent = state.greeting.title || "Season's Greetings!";
    document.getElementById('banner-msg').textContent = state.greeting.message || '';
    document.getElementById('banner-sig').textContent = state.greeting.signature || '';
    document.getElementById('greeting-banner').classList.add('visible');
  }

  function serializeVillage() {
    return {
      version: 3,
      gridSize: GRID_SIZE,
      terrain: state.terrain,
      corners: state.corners,
      objects: state.objects,
      nextObjId: state.nextObjId,
      snowAccum: state.snowAccum,
      greeting: state.greeting,
      savedAt: new Date().toISOString(),
    };
  }

  function loadVillageData(data, showBannerIfGreet = false) {
    if (!data || !Array.isArray(data.terrain) || !Array.isArray(data.objects)) {
      alert('Invalid village file format.');
      return;
    }
    if (data.terrain.length < GRID_SIZE) {
      initEmptyMap();
      const offset = Math.floor((GRID_SIZE - data.terrain.length) / 2);
      for (let y = 0; y < data.terrain.length; y++) {
        for (let x = 0; x < data.terrain[y].length; x++) {
          state.terrain[y + offset][x + offset] = data.terrain[y][x];
        }
      }
      if (Array.isArray(data.corners)) {
        for (let cy = 0; cy < data.corners.length; cy++) {
          for (let cx = 0; cx < data.corners[cy].length; cx++) {
            state.corners[cy + offset][cx + offset] = data.corners[cy][cx];
          }
        }
      }
      state.objects = data.objects.map(o => ({ ...o, x: o.x + offset, y: o.y + offset }));
    } else {
      state.terrain = data.terrain;
      state.corners = data.corners || Array.from({ length: GRID_SIZE + 1 }, () => Array.from({ length: GRID_SIZE + 1 }, () => 0));
      state.objects = data.objects;
    }
    state.nextObjId = data.nextObjId || (state.objects.reduce((m, o) => Math.max(m, o.id), 0) + 1);
    state.snowAccum = typeof data.snowAccum === 'number' ? data.snowAccum : 0;
    state.snowGrid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => state.snowAccum)
    );
    if (data.greeting) state.greeting = data.greeting;
    state.undoStack = []; state.redoStack = []; state.inspectedObjId = null;
    updateUndoButtons();
    renderConfigPanel();
    autoSave();
    if (showBannerIfGreet && state.greeting?.message) enterSnowMode(true);
  }

  function autoSave() {
    try { localStorage.setItem(STORAGE_AUTOSAVE, JSON.stringify(serializeVillage())); } catch (_) {}
  }

  function getSavedSlots() {
    try { return JSON.parse(localStorage.getItem(STORAGE_SLOTS) || '[]'); } catch (_) { return []; }
  }

  function renderSaveSlots() {
    const list = document.getElementById('save-slots-list');
    const slots = getSavedSlots();
    list.innerHTML = '';
    if (!slots.length) {
      list.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:6px;">No saved villages yet.</div>`;
      return;
    }
    slots.forEach((slot, idx) => {
      const row = document.createElement('div');
      row.className = 'slot-item';
      row.innerHTML = `
        <div class="slot-info">
          <strong>${slot.name}</strong>
          <small>${slot.data.objects.length} items • ${new Date(slot.data.savedAt).toLocaleString()}</small>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn" data-load="${idx}">Load</button>
          <button class="btn btn-danger" data-del="${idx}">✕</button>
        </div>
      `;
      row.querySelector('[data-load]').onclick = () => { pushUndo(); loadVillageData(slot.data, false); closeModal('modal-saves'); };
      row.querySelector('[data-del]').onclick = () => {
        const updated = getSavedSlots().filter((_, i) => i !== idx);
        localStorage.setItem(STORAGE_SLOTS, JSON.stringify(updated));
        renderSaveSlots();
      };
      list.appendChild(row);
    });
  }

  function buildSampleVillage() {
    initEmptyMap();
    const mid = Math.floor(GRID_SIZE / 2);
    for (let i = mid - 10; i <= mid + 10; i++) {
      state.terrain[mid - 1][i] = 'road';
      state.terrain[mid][i] = 'road';
      state.terrain[i][mid - 1] = 'road';
      state.terrain[i][mid] = 'road';
    }
    for (let x = mid - 3; x <= mid + 2; x++) {
      for (let y = mid - 3; y <= mid + 2; y++) {
        state.terrain[y][x] = 'plaza';
      }
    }
    for (let x = mid + 4; x <= mid + 8; x++) {
      for (let y = mid + 3; y <= mid + 7; y++) {
        state.terrain[y][x] = 'ice';
      }
    }

    let id = 1;
    const add = (type, x, y, opts = {}) => {
      const meta = CATALOG_MAP[type];
      state.objects.push({
        id: id++, type, x, y, size: meta.size || 1,
        color: opts.color || 'red',
        lights: opts.lights || 'warm',
        lightMode: opts.lightMode || 'twinkle',
        fireplace: opts.fireplace !== undefined ? opts.fireplace : !!meta.hasFireplace,
        flip: !!opts.flip,
        horseColor: opts.horseColor || 'white',
        label: opts.label || '',
        note: opts.note || '',
      });
    };

    add('townhall', mid - 3, mid - 5, { color: 'red', lights: 'warm', label: 'Pinewood Town Hall', note: 'The heart of the village, chiming on the hour.' });
    add('grandtree', mid - 1, mid - 1, { lights: 'multi', lightMode: 'twinkle', label: 'Town Square Tree', note: 'Gather round for carols and warm holiday cheer.' });
    add('carolers', mid - 2, mid);

    add('bakery', mid - 6, mid - 2, { color: 'ginger', lights: 'candy', label: "Mrs. Claus's Bakery", note: 'Fresh gingerbread & spiced hot cocoa served nightly!' });
    add('workshop', mid + 3, mid - 3, { color: 'green', lights: 'multi' });
    add('cottage', mid - 5, mid + 2, { color: 'blue', lights: 'icicle' });
    add('cottage', mid + 2, mid + 1, { color: 'red', lights: 'warm', flip: true });
    add('cabin', mid - 8, mid + 2, { color: 'timber', lights: 'warm' });
    add('chapel', mid - 5, mid - 6, { color: 'blue', lights: 'warm', label: 'St. Nicholas Chapel', note: 'Candlelit midnight service beneath the stars.' });

    add('lamppost', mid - 4, mid - 2);
    add('lamppost', mid + 1, mid - 2);
    add('lamppost', mid - 4, mid + 1);
    add('lamppost', mid + 1, mid + 1);
    add('stall', mid - 2, mid - 2, { color: 'red', lights: 'warm' });
    add('stall', mid, mid - 2, { color: 'green', lights: 'multi' });

    add('skater', mid + 5, mid + 4);
    add('skater', mid + 7, mid + 6, { flip: true });
    add('sleigh', mid - 1, mid + 3, { lights: 'warm' });
    add('reindeer', mid, mid + 3);
    add('horse', mid - 7, mid - 1, { horseColor: 'chestnut' });
    add('snowman', mid - 3, mid + 1);
    add('bonfire', mid - 2, mid + 1);

    const trees = [
      [mid - 9, mid - 7], [mid - 7, mid - 8], [mid - 2, mid - 9], [mid + 3, mid - 8],
      [mid + 6, mid - 6], [mid + 8, mid - 3], [mid - 9, mid + 5], [mid - 7, mid + 7],
      [mid - 3, mid + 8], [mid + 9, mid + 2], [mid + 10, mid + 6], [mid + 5, mid - 5]
    ];
    trees.forEach(([x, y], i) => add('pine', x, y, { lights: i % 2 === 0 ? 'warm' : 'none' }));

    state.nextObjId = id;
    state.greeting = {
      title: 'Welcome to Pinewood Hollow!',
      message: 'Wishing you a cozy, bright, and joyful holiday season.',
      signature: '— Christmas Village Editor',
    };
  }

  // =========================================================================
  // 11. EVENT WIRING
  // =========================================================================
  window.openModal = id => document.getElementById(id).classList.add('open');
  window.closeModal = id => document.getElementById(id).classList.remove('open');

  document.getElementById('btn-dock-build').onclick = () => toggleDockDialog('dialog-build');
  document.getElementById('btn-dock-options').onclick = () => toggleDockDialog('dialog-options');
  document.getElementById('close-build').onclick = closeAllDockDialogs;
  document.getElementById('close-options').onclick = closeAllDockDialogs;

  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.selectedCat = tab.dataset.cat;
      const first = CATALOG.find(c => c.cat === state.selectedCat);
      if (first) state.selectedItem = first.id;
      setTool('place');
      renderPalette();
      renderConfigPanel();
    };
  });

  document.getElementById('tool-place').onclick = () => setTool('place');
  document.getElementById('tool-inspect').onclick = () => setTool('inspect');
  document.getElementById('tool-erase').onclick = () => setTool('erase');
  document.getElementById('btn-rotate').onclick = toggleFlip;
  document.getElementById('btn-undo').onclick = undo;
  document.getElementById('btn-redo').onclick = redo;
  document.getElementById('btn-zoom-in').onclick = () => {
    const idx = ZOOM_LEVELS.indexOf(state.camera.zoom);
    setZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, (idx === -1 ? 5 : idx) + 1)]);
  };
  document.getElementById('btn-zoom-out').onclick = () => {
    const idx = ZOOM_LEVELS.indexOf(state.camera.zoom);
    setZoom(ZOOM_LEVELS[Math.max(0, (idx === -1 ? 5 : idx) - 1)]);
  };
  function clearSnow() {
    state.snowAccum = 0;
    state.snowGrid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => 0));
    document.getElementById('accum-label').textContent = '0%';
    audio.playClick(420);
  }
  document.getElementById('btn-clear-snow').onclick = clearSnow;
  document.getElementById('btn-dialog-clear-snow').onclick = () => {
    clearSnow();
    closeAllDockDialogs();
  };

  function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    audio.setEnabled(state.audioEnabled);
    document.getElementById('btn-audio').textContent = state.audioEnabled ? '🔊' : '🔇';
  }
  document.getElementById('btn-audio').onclick = toggleAudio;

  document.getElementById('btn-snow-mode').onclick = () => toggleDockDialog('dialog-snow');
  document.getElementById('close-snow-dialog').onclick = closeAllDockDialogs;
  document.getElementById('toggle-tour-mode').onclick = () => {
    state.tourEnabled = !state.tourEnabled;
    document.getElementById('pill-tour-mode').classList.toggle('on', state.tourEnabled);
    audio.playClick(500);
  };
  document.querySelectorAll('.snow-start-btn').forEach(btn => {
    btn.onclick = () => {
      state.snowLevel = Number(btn.dataset.lvl);
      document.querySelectorAll('.snow-lvl-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.lvl) === state.snowLevel);
      });
      enterSnowMode(false);
    };
  });
  document.getElementById('btn-exit-snow').onclick = exitSnowMode;
  document.getElementById('btn-close-banner').onclick = () => {
    document.getElementById('greeting-banner').classList.remove('visible');
  };

  document.querySelectorAll('.snow-lvl-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.snow-lvl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.snowLevel = Number(btn.dataset.lvl);
    };
  });

  document.getElementById('btn-saves').onclick = () => { renderSaveSlots(); openModal('modal-saves'); };
  document.getElementById('btn-save-slot').onclick = () => {
    const input = document.getElementById('save-name-input');
    const name = input.value.trim() || `Village ${new Date().toLocaleTimeString()}`;
    const slots = getSavedSlots();
    slots.unshift({ name, data: serializeVillage() });
    localStorage.setItem(STORAGE_SLOTS, JSON.stringify(slots));
    input.value = '';
    renderSaveSlots();
  };
  document.getElementById('btn-load-sample').onclick = () => {
    pushUndo(); buildSampleVillage(); autoSave(); renderConfigPanel(); closeModal('modal-saves');
  };
  document.getElementById('btn-generate-terrain').onclick = () => {
    if (state.objects.length > 0 && !confirm('Replace the current map with this new terrain?')) return;
    const preset = document.getElementById('new-terrain-preset').value;
    const elevScale = Number(document.getElementById('new-terrain-elev').value);
    pushUndo();
    generateInitialTerrain(preset, elevScale);
    autoSave();
    renderConfigPanel();
    closeModal('modal-saves');
  };

  document.querySelectorAll('[data-start-preset]').forEach(btn => {
    btn.onclick = () => {
      const preset = btn.dataset.startPreset;
      pushUndo();
      generateInitialTerrain(preset, preset === 'victorian' ? 1 : 2);
      autoSave();
      renderConfigPanel();
      closeModal('modal-welcome');
    };
  });
  document.getElementById('btn-welcome-sample').onclick = () => {
    pushUndo();
    buildSampleVillage();
    autoSave();
    renderConfigPanel();
    closeModal('modal-welcome');
  };

  document.getElementById('btn-share').onclick = () => {
    document.getElementById('greet-title').value = state.greeting.title || '';
    document.getElementById('greet-msg').value = state.greeting.message || '';
    document.getElementById('greet-sig').value = state.greeting.signature || '';
    openModal('modal-share');
  };

  function syncGreetingFromInputs() {
    state.greeting = {
      title: document.getElementById('greet-title').value.trim() || "Season's Greetings!",
      message: document.getElementById('greet-msg').value.trim(),
      signature: document.getElementById('greet-sig').value.trim(),
    };
    autoSave();
  }

  document.getElementById('btn-export-json').onclick = () => {
    syncGreetingFromInputs();
    const blob = new Blob([JSON.stringify(serializeVillage(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'christmas-village.json'; a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById('btn-import-json-trigger').onclick = () => document.getElementById('import-json-file').click();
  document.getElementById('import-json-file').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        pushUndo();
        loadVillageData(JSON.parse(ev.target.result), true);
        closeModal('modal-share');
      } catch (err) { alert('Could not read JSON file: ' + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  document.getElementById('btn-preview-greeting').onclick = () => {
    syncGreetingFromInputs();
    closeModal('modal-share');
    enterSnowMode(true);
  };

  // =========================================================================
  // 12. INITIALIZATION
  // =========================================================================
  window.addEventListener('resize', () => { resizeCanvas(); initSnowflakes(); });
  resizeCanvas();
  initSnowflakes();

  let loaded = false;
  try {
    const raw = localStorage.getItem(STORAGE_AUTOSAVE);
    if (raw) { loadVillageData(JSON.parse(raw), false); loaded = true; }
  } catch (_) {}

  if (!loaded) { buildSampleVillage(); autoSave(); }

  centerCamera();
  renderPalette();
  renderConfigPanel();
  requestAnimationFrame(renderFrame);
