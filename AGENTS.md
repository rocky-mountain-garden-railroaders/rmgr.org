# Agent instructions

## Gallery manifest updates

When adding or updating galleries in
`src/assets/images/galleries/galleries.json`, preserve this display order:

1. Event galleries from the current calendar year and the preceding four years,
   newest to oldest.
2. Member layout galleries, alphabetically by member name.
3. All older event galleries, newest to oldest.

The five-year window is inclusive of the current year (for example, 2022–2026
in 2026). Use the event year in the gallery name, not image file modification
dates. Within the same year, use the event date when known; otherwise preserve
the existing relative event order.

Gallery `order` values control display priority: higher numbers appear first.
Update these values when adding galleries so the entire list retains the
ordering above. Do not change photo order just to reorder galleries.

For images within each gallery:

- Keep the existing featured photo first; the first `images` entry is the cover.
- For member layouts other than Siwy, sort remaining photos newest to oldest
  using embedded capture dates, falling back to dates in filenames. Put undated
  photos last in descending natural filename order.
- Preserve Siwy's manually curated photo order; do not automatically sort it.
- For event galleries, sort remaining photos oldest to newest using embedded
  capture dates, falling back to dates in filenames. Put undated photos last in
  ascending natural filename order.
- Preserve explicitly requested photo-priority overrides.
- Preserve existing titles, descriptions, alt text, and captions.
- Include all supported images in the gallery subfolder and omit videos.
- Do not use filesystem modification dates to infer capture dates.

Validate gallery changes with
`pnpm run test:unit --run src/tests/galleryImages.spec.ts`. If gallery priorities
change intentionally, update the expected gallery order in that test.
