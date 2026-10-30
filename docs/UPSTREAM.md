# Upstream and integration map

Engine: https://github.com/amandaghassaei/OrigamiSimulator
Starting revision: `903ef27afcec7113390659935ae884798ed27188`.
Copyright 2018 Amanda Ghassaei. MIT license retained at `engine/LICENSE`.

The original GPU solver, Three.js renderer, parsers and dependencies are retained in `engine/`. The engine HTML hides the original controls and removes the Google analytics network script. The application-owned adapter in `lab.js` controls a same-origin iframe. A replacement iframe is staged until geometry exists; a monotonically increasing token rejects stale completions. On replacement the old renderer is disposed, its WebGL context is lost, and the entire old document is removed. This isolates legacy listeners and animation loops.

Integration paths:
- `js/main.js`: initializes globals and loads an example selected by URL.
- `js/pattern.js`: `setFoldData`, `getFoldData`, SVG preprocessing and model construction.
- `js/model.js`: `pause`, `resume`, positions, geometry, mesh materials.
- `js/globals.js`: fold target; adapter sets `shouldChangeCreasePercent` after changing it.
- `js/dynamic/`: original GPU simulation; no solver changes.
- `js/threeView.js`: renderer, camera and simulation loop.

Exports use the solver position buffer and triangulated pattern topology, serialized as FOLD or OBJ. Units are the normalized solver coordinate system. The original app's exports remain in the engine but are hidden by the new interface.

Inherited limitations: no collision detection or physical fabrication guarantee; target percentages are not convergence measurements. GPU/WebGL capability is required. Strain is the original engine's axial strain coloring; no numerical strain claim is made. Imported folded forms establish a new rest geometry. Limits are deliberately conservative: 512 KB, 1,000 vertices, 3,000 edges, 2,000 faces; validated sample workloads are smaller and do not establish a universal performance guarantee at those limits.

## Paper appearance update

`engine/js/model.js` now uses MeshStandardMaterial (roughness 0.96, no metalness), a deterministic procedural fiber texture and rest-space UVs. Materials are disposed when replaced. Paper and reverse sides have warm, distinct tones. Surface mode hides crease line overlays; crease mode shows the original crease network. `engine/js/threeView.js` now uses a warm shadow-casting key light, hemisphere fill, PCF soft self-shadows, gamma output and a pixel-ratio cap of 2. The physics solver is unchanged. Appearance does not add thickness or collision handling. The application no longer exposes strain view.

Camera framing now scales its zoom with viewport aspect ratio on initialization and resize, keeping the sheet visible on narrow screens. This is a rendering-only change.

## Appearance and reference panel

`appearance.js` owns five UI/background palettes and 48 CSS named paper swatches. CSS variables theme the page; the adapter updates the renderer background, paper material, and crease line colors. Stored selections are validated before reuse and theme/paper settings remain independent across resets, imports and pattern changes. Theme changes preserve paper/crease visibility. The camera icon downloads a PNG of the current renderer; A/B comparison and observation challenges have been removed. Pre-rendered folded references keep this UI to a single live solver.

Folded reference PNGs now preserve transparency. The renderer supports an alpha channel while the interactive scene still uses the selected theme background. The reference renderer temporarily clears the scene background and captures only the projected model bounds; the panel supplies the themed background at display time.

## Full fold range and matched preview pigment

The slider now exposes 0–100% on all viewport sizes. Its earlier 80% cap was an application-level prototype bound, not a browser or GPU limit. The right-hand reference is rendered at 100% and recolored with an SVG component-transfer filter. The lookup tables invert the neutral render's gamma-2 / Reinhard mapping, scale each channel by the selected pigment relative to Ivory, then reapply tone mapping. Alpha and existing shading are retained. This is a lightweight color approximation of the original neutral rendering; it adds no second solver or continuous render loop. Imported references are captured neutrally with transparent background before restoring the main material.

## Managed loading and bounded motion

`motion.js` manages gradual target changes, bounded solve sessions (up to 120 render steps), finite/radius checks, display centering and automatic holding. New engines start paused at zero target via `?managed=1`, then prepare 35% offscreen in 30 batches of 40 solver steps. This is bounded preparation, not a convergence claim. Slider motion ramps the target by up to 2.5 percentage points per frame; holding never advances the solver.

The loader freezes the previous model and camera, immediately cancels superseded staging frames, checks geometry/context readiness, and commits only after preparation. `threeView.dispose()` stops its owned animation loop and releases scene/render resources; `GPUMath.dispose()` explicitly releases the separate solver context. Both are called on replacement, cancellation and failure. A failed staged load retains the previous model. Finite but excessive deformation triggers a flat reset rather than allowing the paper to disappear.

Managed preparation explicitly flushes pending model synchronization instead of relying on requestAnimationFrame in hidden iframes. A coarse pointer or low-memory hint selects a 1× render pixel ratio without shadow maps. The renderer redraws only for geometry, camera, material or background changes; idle solves and idle GPU draws stop. Unsupported floating-point contexts/framebuffers now surface an error to the parent UI. Script URLs carry a release version to avoid mixing cached engine and adapter revisions on mobile.
