# rmgr-vue3

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Gallery image metadata

To identify photos while reorganizing the manifest, open
`/gallery?galleryDebug=true`. The slideshow displays the original filename below
each photo, including photos without captions. Remove the flag to hide filenames;
they are hidden by default.

`src/assets/images/galleries/galleries.json` lists the supported photos in each
gallery subfolder. Keep these entries in sync with the files on disk; omit videos.
Site photos use WebP at quality 85 without resizing; the logo uses lossless WebP
to preserve its pixels and transparency. When converting new photos, preserve
their displayed orientation, capture-date metadata, and color profile, and update
manifest filenames and any direct imports to match.
The first image is the gallery's featured photo. Keep it first and order the
remaining member layout photos newest to oldest, except for Siwy, whose manually
curated order must be preserved. Event photos remain oldest to newest. Use
embedded capture dates, then dates in filenames when capture metadata is
unavailable. Place undated photos last in natural filename order, descending for
member layouts and ascending for events. Do not use filesystem modification dates,
which can change when photos are copied.

Gallery `order` values are display priorities, with higher numbers listed first.
Arrange events from the latest five calendar years (2022–2026 for the current
curation) newest first, then member layouts alphabetically, then older events
newest first. Update these priorities as new galleries are added.

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
