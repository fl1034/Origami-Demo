# Origami Lab

An interactive paper experiment powered by Amanda Ghassaei's real GPU origami solver. No login, API key, package installation or build step required.

## Run

```sh
cd /workspace/Origami-Demo
python3 -m http.server 8080 --bind 127.0.0.1
```

Open the server in a WebGL-capable browser. To test repository-subpath hosting, serve the parent directory and use `/Origami-Demo/`. Publish the entire directory to any static host; all application paths are relative. Live processes must be restarted after environment restoration.

Choose from 25 patterns in the searchable collection, drag the fold slider, orbit/zoom the paper, pause or reset, and inspect paper and crease views. Download a PNG screenshot using the camera icon beside the view controls. The right panel shows a folded reference image for the selected pattern. Export the current geometry as FOLD or OBJ. Local FOLD imports are bounded and validated; SVG upload is intentionally not exposed.

Source/provenance: [docs/UPSTREAM.md](docs/UPSTREAM.md), [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md). Validation: [docs/VALIDATION.md](docs/VALIDATION.md).

Simulation does not provide human folding instructions, collision detection or a fabrication guarantee. Captures record a target and running/paused status, never a claim of convergence. AI is not included.

The action controls use icons with hover tooltips and accessible labels. The paper uses a rough, textured material with soft self-shadows; this is a visual treatment, not added physical thickness.

Appearance: choose one of five studio themes and 48 named paper colors independently. Presets use swatches, with no color-wheel control. Preferences are stored locally in your browser. Folded reference images show a 100% target and follow the selected paper color while preserving their shading. The fold slider spans 0–100% on desktop and mobile; it controls crease-angle targets, not elapsed progress or guaranteed convergence.

## GitHub Pages

Pushing `main` runs `.github/workflows/pages.yml`. It publishes the static application, bundled engine and required image assets through GitHub Pages. There is no server-side application or build dependency. The workflow uses GitHub's Pages deployment environment.

Models are prepared before appearing and start held still. Moving the fold slider runs a gradual, bounded solve, then holds the result. The play icon resumes another settling pass; pause stops it immediately. “Held” does not mean physically converged. During model changes, the existing paper and camera freeze until a valid replacement is ready. Reset restores the selected pattern at 35%.

Phones use lower-resolution rendering without shadow maps. Idle paper does not run the solver or redraw the GPU canvas. If floating-point WebGL support is unavailable, the application displays a graphics-support message. After an update, reload the page to receive the versioned engine scripts.
