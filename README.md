# A Free Christmas Village Editor

**Live App:** https://jasonaaronwilson.github.io/xmas-village/

An isometric, semi-realistic whimsical vector-art village builder for
creating cozy Christmas villages right in your browser!

## Features

- **Terrain & 3D Elevation Editing**:

  - Start with a randomized landscape preset (**Victorian Flat**,
    **Swiss Alpine**, **Rolling Foothills**, or **Lakeside & Peaks**
    with water-level frozen lakes and smooth curved shorelines)
    beginning as grass and shrubs before the snow falls.

  - Sculpt hills and valleys directly with **Raise Hill** and **Lower
    Ground**— elevation has no max cap and smoothly expands slope
    radii into neighboring tiles.

- **Buildings, Decor & Living Features**:

  - Place `1×1` and multi-tile `2×2` buildings (*Grand Town Hall*,
    *Village School*, *Cottage Hospital*, *Village Inn*, *Cozy
    Cottage*, *Cocoa Bakery*, *Toy Workshop*, *Log Cabin*, *Steeple
    Chapel*, *Butcher Shop*, *Post Office*) alongside pine trees,
    lampposts, market stalls, sleighs, snowmen, horses, reindeer,
    carolers, and ice skaters.

  - Click any placed item with the **Pointer** tool to customize its
    color palette, facing (`R`), fireplace/chimney smoke, and
    Christmas light style (`Warm White`, `Multicolor`, `Candy Cane`,
    `Icicle Blue`) and pattern (`Twinkle`, `Steady`, `Chase`).

- **Landmark Labels & Snow Tour Mode**:

  - Add custom **labels** and **descriptions** to any placed landmark.

  - Press the **❄️ Snow** button to choose one of three snowfall rates
    (**Gentle Flurries**, **Steady Snowfall**, or **Winter Blizzard**)
    and hide the editor UI (leaving only a single **✏️ Editor** button
    in the lower-left corner).

  - Watch gusting wind, parallax snow, and realistic per-tile snow
    accumulation (sheltered leeward drifts and warm melted rings near
    fireplaces, bonfires, and lampposts) while **Tour Landmarks**
    smoothly pans and zooms in to visit each labeled site.

- **Save, Share & Audio**:

  - `Ctrl+Z` / `Ctrl+Y` undo & redo, browser auto-save and named save
    slots, optional synthesized Web Audio winter ambiance, and `.json`
    export/import with a customized holiday greeting banner.

## Controls

- **Pan**: Arrow keys (hold `Shift` for faster panning), middle-mouse
    drag, or `Space` + drag

- **Zoom**: `+` / `-` keys, mouse wheel, or toolbar `➕` / `➖`
    buttons (`20%`–`300%`)

- **Erase**: Right-click or **🧹** tool

- **Rotate Facing**: `R` key or item properties

- **Undo / Redo**: `Ctrl+Z` / `Ctrl+Y`

## Building from Source

Modular HTML, CSS, and JS live under `src/` and are assembled into the
single-page `index.html` (and `docs/index.html`) via `make`:

```bash
make        # builds index.html and docs/index.html
make check  # validates combined JavaScript syntax
```
