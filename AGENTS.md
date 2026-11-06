# Agent instructions

## Branch naming

Use the `ts/` prefix for new branches, followed by a short, descriptive
kebab-case name (for example, `ts/gallery-video-support`).

## Implementation and validation

- For new behaviour, use a focused test-first loop: add a test and confirm it
  fails for the expected reason (RED), implement the smallest change to pass
  (GREEN), then refactor while keeping the test green. Run both RED and GREEN
  tests; do not assume their outcomes. Prefer small cycles over a large batch.
- Name tests with a descriptive `GIVEN <context> WHEN <action> THEN <outcome>`
  structure using these exact uppercase keywords.
- Avoid extra abstractions or unrelated refactors.
- Prefer unit tests when behaviour can be tested without crossing I/O or process
  boundaries. Add integration or end-to-end coverage when those boundaries are
  part of the behaviour. For reliably testable bug fixes, add regression tests.
- For configuration-only, generated, mechanical, migration, or behaviour-
  preserving changes, RED may be skipped; run the cheapest relevant
  verification.
- Do not add explanatory comments to code unless explicitly requested.
- Use the repository's pnpm scripts. For focused unit tests, run
  `pnpm run test:unit --run <test-file>`; for the full unit suite, run
  `pnpm run test:unit --run`. Before pushing, run `pnpm run lint:check` and
  address relevant findings.

## Review guidance

- Check behaviour against the request, acceptance criteria, API contracts,
  callers, and applicable feature flags. Prioritise concrete defects and
  behaviour gaps; make findings actionable and explain their impact.
- When reviewing code, consult relevant historical review feedback when
  available, but do not treat one-off preferences as project-wide rules.
- Focus tests at the layer that owns the behaviour and prefer established
  project patterns and shared helpers over speculative refactoring.
- For UI changes, consider keyboard access, overflow, and consistency with
  nearby components where relevant.

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
- Include all supported images in the gallery subfolder. MP4s are discovered
  automatically and appended after photos; list published compressed videos with
  their metadata in the existing `images` map. Never move a video ahead of the
  featured photo or put uncompressed camera originals in the site assets.
- Do not use filesystem modification dates to infer capture dates.

Validate gallery changes with
`pnpm run test:unit --run src/tests/galleryImages.spec.ts`. If gallery priorities
change intentionally, update the expected gallery order in that test.
