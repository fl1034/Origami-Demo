# Validation — 2026-10-30

Executed in Chromium 151 through Python Playwright, with SwiftShader WebGL (`--use-angle=swiftshader --enable-unsafe-swiftshader`). Served over HTTP beneath `/Origami-Demo/`, not file URLs.

- Original upstream baseline: default waterbomb rendered; 1,320 position-buffer components.
- New interface: Miura (182 vertices), square twist (16), waterbomb (440). Each produced changed simulated vertex coordinates after a fold-target change; each reset and switched surface/crease/strain views successfully.
- Each example captured two PNG views and downloaded FOLD and OBJ; exports contained geometry and no NaN values. Exported waterbomb FOLD successfully reimported as a new study.
- Invalid JSON structure and oversized upload rejected without replacing the current pattern. Null boundary angles accepted, matching upstream FOLD output.
- Rapid three-way switching left the last requested pattern and exactly one live iframe. Old engine renderer/context explicitly disposed on replacement.
- Reduced-motion preference starts paused. Arrow-key slider control changed the target. Hidden tabs pause the solver.
- Desktop 1440×1000 and mobile 390×844 rendered; mobile had no horizontal overflow. Screenshots saved beside this report. Subpath hosting passed.
- Both browser runs completed without page-level JavaScript errors. JavaScript syntax and Git whitespace checks passed.

The tests uncovered and fixed a readiness race (model exists before position buffer) and rejection of valid null boundary angles. An export test initially forgot to open the disclosure panel; the test was corrected. Import-error text needs an asynchronous wait, now included.

Run the retained tests after serving `/workspace` on port 8080:

```
python tests/browser_smoke.py
python tests/browser_extra.py
```

Tests require Python Playwright and Chromium (`python -m playwright install chromium`); these are installed in this prepared environment. No application package installation is needed.

Limits: software-rendered Chromium validation does not certify every hardware/browser combination. No long-duration GPU memory profiling, physical convergence guarantee or collision analysis was performed. The configured import caps are conservative safeguards, not a performance certification for every possible topology. SVG upload and AI are not exposed. Engine code and asset licensing/provenance are recorded separately.

## Collection, icons and paper revision

- Expanded collection: 25 bundled SVG patterns, with real rendered thumbnails, pattern credits and search. `tests/collection.py` loads each pattern, checks finite geometry and face indices, and verifies that changing the target changes vertex positions. All 25 passed; no page-level JavaScript errors.
- `tests/icon_ui.py`: search filters, accessible icon names, keyboard-focus tooltip, paper/crease mode, pause/resume labels, snapshots, FOLD/OBJ downloads, rapid switching, reset and mobile width passed. One live iframe remained after rapid switching. No page-level JavaScript errors.
- Removed strain controls and strain-related copy from the application UI. The vendored engine retains its upstream implementation for provenance, but the application adapter accepts only paper and crease views.
- Paper rendering uses matte textured materials, warm front/back colors, soft self-shadows and tone mapping. The paper shader and lighting were exercised by the collection/browser checks. Desktop and mobile captures: `revised-desktop.png`, `revised-mobile.png`.
- Syntax checks passed for application scripts and the modified renderer/model. All assets are still local and the project still serves as static files beneath `/Origami-Demo/`.

The grain is a visual texture; it does not change solver behavior or add physical thickness. Browser checks remain Chromium/SwiftShader checks, not a certification of every GPU.

Final `tests/collection_range.py` run: all 25 patterns also passed at the 80% slider endpoint (finite vertices, valid face indices and changed geometry), then returned to 45% for updated thumbnails. Results are saved in `collection-results.json`. These are short interactive checks, not long-duration stability proofs.

## Simplified panels and appearance presets

- Removed observation and A/B panels. The third lower-left canvas icon downloads a PNG rather than creating comparison cards.
- Added large neutral folded-reference images for all 25 patterns, captured at an 80% fold target; reference framing follows projected geometry bounds.
- `tests/appearance.py` passed: five themes, 48 named swatches, CSS name-to-hex validation, independent theme/paper state, matching renderer backgrounds, selection persistence through reload/pattern replacement, crease visibility preserved when changing colors, correct reference switching, PNG download signature/content, keyboard tooltip, and mobile width. No page-level JavaScript errors.
- Body and muted text contrast on each theme background were calculated: all ten pairs exceed 4.5:1 (lowest 4.76:1).
- Preferences use localStorage with validated values and a fallback if storage is unavailable. No color-wheel inputs, external palette libraries, or backend endpoints were added.

The updated existing browser smoke suite also passed all three representative patterns, resets, paper/crease switches, PNG screenshots, FOLD/OBJ exports, FOLD reimport and invalid-import recovery, with no page-level JavaScript errors.

## Publishing and panel background

Header branding uses the original inline crane SVG; the introduction now explains the Japanese roots of “origami.” Local browser checks passed app startup, trivia/logo presence, 25 collection entries and mobile width. GitHub Pages publishes via the repository's Actions workflow. The right panel uses the existing theme's toned panel color; reference PNGs have transparent backgrounds so they blend with it.

## Preview color and 100% target

- `tests/render_references.py` exercised all 25 patterns at 100%, verified that geometry remained finite, and rendered transparent reference images at that target.
- `tests/preview_color.py` passed: screenshot pixel-channel comparisons verified actual recoloring between Coral and Cornflower Blue; live material and preview labels agreed; selection survived theme/pattern/reset changes; a 390-pixel mobile viewport sent a target of exactly 1.0 to the engine and displayed 100%; keyboard decrement and reset worked; no page-level JavaScript errors.
- The former 80% maximum was a prototype HTML bound. This change exposes the engine's full 0–100% target range on all screen sizes. These short browser checks do not establish convergence, collision avoidance or physical foldability. Some patterns become almost flat or tightly compressed at their full target.
