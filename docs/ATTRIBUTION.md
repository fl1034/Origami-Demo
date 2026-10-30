# Attribution

All vendored engine files originate from Amanda Ghassaei's OrigamiSimulator at the revision in UPSTREAM.md, distributed under its root MIT license (retained). Dependencies retain their original embedded license notices. No external font service is used by the new interface: system sans-serif and Georgia are used.

Curated source assets:
- `engine/assets/Tessellations/miura-ori.svg`: Miura fold, attributed upstream to Koryo Miura.
- `engine/assets/Origami/singlesquaretwist.svg`: single square twist, upstream collection.
- `engine/assets/Tessellations/huffmanWaterbomb.svg`: Huffman waterbomb, David Huffman attribution in upstream naming/collection.

These files have no separate license notices; redistribution relies on the upstream repository's MIT license. Attribution of the mathematical pattern is distinct from authorship of its SVG encoding. The collection thumbnails are browser captures of the actual simulation. Browser screenshots in docs are generated from this implementation.

## Expanded collection

All following assets are from the same pinned upstream revision. These selected SVGs carry no separate license notices; repository MIT licensing is retained. Curved assets with separate CC attribution are not selected. Pattern designers are credited separately from the SVG source.

| Pattern | Source asset | Attribution |
| --- | --- | --- |
| Miura meadow | `engine/assets/Tessellations/miura-ori.svg` | Koryo Miura |
| Square twist | `engine/assets/Origami/singlesquaretwist.svg` | Traditional |
| Waterbomb field | `engine/assets/Tessellations/huffmanWaterbomb.svg` | David Huffman |
| Flapping bird | `engine/assets/Origami/flappingBird.svg` | Traditional |
| Paper crane | `engine/assets/Origami/traditionalCrane.svg` | Traditional |
| Flat crane | `engine/assets/Origami/flat_crane.svg` | Traditional |
| Pleated saddle | `engine/assets/Origami/hypar.svg` | Upstream hypar study |
| Six-point saddle | `engine/assets/Origami/6ptHypar-anti.svg` | Upstream hypar study |
| Twist variations | `engine/assets/Origami/squaretwistManyAngles.svg` | Upstream bistability study |
| Sharp Miura | `engine/assets/Tessellations/miura_sharpangle.svg` | Koryo Miura |
| Waterbomb tessellation | `engine/assets/Tessellations/waterbomb.svg` | Traditional |
| Extruded boxes | `engine/assets/Tessellations/huffmanExtrudedBoxes.svg` | David Huffman |
| Rectangular weave | `engine/assets/Tessellations/huffmanRectangularWeave.svg` | David Huffman |
| Stars & triangles | `engine/assets/Tessellations/huffmanStarsTriangles.svg` | David Huffman |
| Bird base | `engine/assets/Bases/birdBase.svg` | Traditional |
| Frog base | `engine/assets/Bases/frogBase.svg` | Traditional |
| Boat base | `engine/assets/Bases/boatBase.svg` | Traditional |
| Pinwheel base | `engine/assets/Bases/pinwheelBase.svg` | Traditional |
| Open sink | `engine/assets/Bases/openSinkBase.svg` | Traditional |
| Square base | `engine/assets/Bases/squareBase.svg` | Traditional |
| Waterbomb base | `engine/assets/Bases/waterbombBase.svg` | Traditional |
| Single vertex | `engine/assets/SimpleFolds/simpleVertex.svg` | Upstream collection |
| Russian triangle | `engine/assets/SimpleFolds/russianTriangle.svg` | Upstream collection |
| Map fold | `engine/assets/SimpleFolds/mapfold.svg` | Traditional |
| Brochure fold | `engine/assets/SimpleFolds/brochurefold.svg` | Traditional |

Paper grain is generated procedurally by Origami Lab; no external texture or image service is required. New thumbnails are captures of the running simulation.

## Named color palettes

Paper colors use the standardized keyword/hex mappings in [W3C CSS Color 4: Named Colors](https://www.w3.org/TR/css-color-4/#named-colors) (checked 2026-10-30). The UI adds spaces for readability, e.g. “Rebecca Purple” maps to `rebeccapurple` (`#663399`). Five studio palettes—Linen, Sage, Rose, Slate and Midnight—are custom coordinated combinations, not claims of standardized theme names. No runtime request is made to the specification or any palette service.

`docs/finished/` contains browser captures of all 25 simulated patterns at the individually labeled preview fold target, rendered with neutral paper. These are illustrative folded references, not convergence or fabrication guarantees.

The header crane is an original inline SVG illustration created for Origami Lab.
