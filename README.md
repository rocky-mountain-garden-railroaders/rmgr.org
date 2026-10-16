# rmgr-vue3

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

Use Node.js 24 or newer and pnpm 10.18.3, as pinned in `package.json`.
If pnpm is not installed, substitute `npx pnpm@10.18.3` for `pnpm` in the
commands below.

```sh
pnpm install
```

Dependency updates respect the 14-day minimum release age configured in
`pnpm-workspace.yaml`. Use `pnpm update` for updates within the declared version
ranges and `pnpm audit` to check for known vulnerabilities.

### Compile and Hot-Reload for Development

```sh
pnpm run dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm run test:unit
```

### Gallery image metadata

To identify photos while reorganizing the manifest, open
`/gallery?galleryDebug=true`. The slideshow displays the original filename below
each photo, including photos without captions. Remove the flag to hide filenames;
they are hidden by default.

`src/assets/images/galleries/galleries.json` lists the supported photos in each
gallery subfolder. Keep these entries in sync with the files on disk; omit videos.
Only folders listed in the manifest are published. Omit a gallery entry to keep
it unpublished without deleting its photos; Supertrain 2026 is currently omitted
until more photos are available.
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
pnpm exec playwright install

# When testing on CI, must build the project first
pnpm run build

# Runs the end-to-end tests
pnpm run test:e2e
# Runs the tests only on Chromium
pnpm run test:e2e --project=chromium
# Runs the tests of a specific file
pnpm run test:e2e tests/example.spec.ts
# Runs the tests in debug mode
pnpm run test:e2e --debug
```

### Pull request checks

The GitHub Actions `build` check installs dependencies from the frozen pnpm
lockfile, type-checks and builds the site. On pull requests only, it also runs all
Vitest tests and Playwright tests in Chromium, Firefox, and WebKit. Browser tests
still run if unit tests fail. Playwright reports and traces are retained as
workflow artifacts for seven days. Pushes (including merges), scheduled runs,
and manual runs build without rerunning tests; successful builds on `main` deploy.

The `main` ruleset requires the `build` check to pass with the branch up to date
before merging. Organization administrators currently have a ruleset bypass.

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm run lint
```

Pull requests also run `npm run lint:check` in the GitHub Actions `build` check.
This checks Oxlint and ESLint without applying fixes.
