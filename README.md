# LCARS Design System

An LCARS-inspired design system: design tokens, component specs and reference implementations.
Terminal first; CSS and SVG later.

[See every theme, state and example pill](https://jawsomejason.github.io/lcars-design-system/)
(generated from the tokens into `docs/index.html`; GitHub Pages serves it from `main` `/docs` once
the repo is public).

## Layout

| Path                     | What it is                                                      |
| ------------------------ | --------------------------------------------------------------- |
| `tokens/roles.tokens.json` | Every role: structural and semantic, defaults and minimum contrast; blink and dim |
| `dist/tokens.json`       | Generated. The tokens resolved to plain hex, for consumers       |
| `tokens/themes/*.tokens.json` | Themes (eras): each role's color, light-mode measurements, sources |
| `tokens/modes/*.tokens.json` | Modes: shared `light` and `print` values                 |
| `spec/pill.md`           | The pill component: anatomy, states, roles                      |
| `tokens/type.tokens.json`, `spec/type.md` | Typography: faces, weights, tracking, cap ratio, levels |
| `spec/guidelines.md`     | What colors mean, escalation, shape rules                       |
| `impl/shell/`            | Terminal implementation: generated theme files and the renderer |
| `docs/index.html`        | The generated reference page                                    |
| `scripts/build.mjs`      | Generates every committed output from the tokens                |

Tokens use the [Design Tokens Community Group format](https://www.designtokens.org/tr/drafts/format/)
(`$value`, `$type`). Themes: `tng` (default), `pic`, `voy`, `fc` and `nem`, measured or reconstructed
in the thejase.com LCARS lab; each file cites its sources. Modes: `dark` (default), `light`, `print`.

## Implementations

The spec layer (`tokens/`, `spec/`) describes components without reference to any medium: shapes
in proportions of block height, colors as roles, blink as a period and a dim factor. Each
implementation under `impl/` maps that onto one medium and documents the mapping in its own README.
A consumer reads the resolved `dist/tokens.json`, never the DTCG files, or uses an implementation.

- `impl/shell/` draws pills in truecolor terminals and zsh prompts. See
  [`impl/shell/README.md`](impl/shell/README.md).
- `impl/css/` is planned. `docs/index.html` already shows how pills look in CSS.

## Use it from JavaScript

Pin a release straight from GitHub; it is not on npm:

```json
"devDependencies": { "lcars-design-system": "github:JawsomeJason/lcars-design-system#semver:^0.4.0" }
```

```js
const tokens = require('lcars-design-system'); // dist/tokens.json
const { theme, mode } = tokens.default;        // 'tng', 'dark'
const roles = tokens.themes[theme].modes[mode];
roles.ok;                                       // '#8899ff'
tokens.themes.voy.modes.light.display;          // '#555566'
tokens.type.capRatio;                           // 0.859375
```

Each theme has `name`, `era`, `source`, an optional `standIn`, and `modes.{dark,light,print}` (role to
hex). `minContrast` lists each role's minimum against `bg`; `type` holds typography; `state` holds
`dim`, `dimSnap` and `blinkPeriodMs`.

## Use it from a shell

```sh
LCARS_DS=${LCARS_DS:-$HOME/code/lcars-design-system}
. "$LCARS_DS/impl/shell/palette.sh"
. "$LCARS_DS/impl/shell/pill.sh"
lcars_pill accent PATH "$PWD" && printf '%s\n' "$lcars_pill_out"
```

The generated files are committed, so consumers need no build step. Keep a fallback for machines
without the repo.

## Versions

Releases are git tags (`v0.1.0`) with GitHub releases, listed in `CHANGELOG.md`. A version says what
a consumer has to do:

- **Major:** a role, theme or mode is removed or renamed, or a role's meaning changes.
- **Minor:** a new role, theme, mode or component spec, or a color value changes.
- **Patch:** descriptions, docs or metadata only.

Below 1.0, a breaking change bumps the minor version instead (0.3 to 0.4), so pin with a caret
(`^0.4.0`), which stays within one minor.

To release: update `version` in `package.json` and `CHANGELOG.md`, run the tests, commit, then
`git tag vX.Y.Z && git push --tags && gh release create vX.Y.Z --notes-from-tag` or with the changelog
entry as notes.

## Change it

Edit `tokens/` or `scripts/build.mjs`, then:

```sh
node scripts/build.mjs   # regenerate outputs
sh test/run.sh           # tests (node and zsh needed)
sh demo/pills.sh         # look at it
```

## Credit

LCARS (Library Computer Access/Retrieval System) was designed by Michael Okuda for Star Trek: The
Next Generation and is the property of Paramount. This is a fan project, not affiliated with or
endorsed by Paramount. Theme colors come from the thejase.com LCARS lab: measured from screen
captures and Blu-ray frames, or reconstructed by thelcars.com; each theme file cites its sources.
