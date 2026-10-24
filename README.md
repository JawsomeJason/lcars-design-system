# LCARS Design System

An LCARS-inspired design system: design tokens, component specs and reference implementations.
Terminal first; CSS and SVG later.

[See every palette, state and example pill](https://jawsomejason.github.io/lcars-design-system/)
(generated from the tokens into `docs/index.html`; GitHub Pages serves it from `main` `/docs` once
the repo is public).

## Layout

| Path                     | What it is                                                      |
| ------------------------ | --------------------------------------------------------------- |
| `tokens/roles.tokens.json` | Semantic roles components use, plus blink and dim settings    |
| `tokens/palettes/*.tokens.json` | Palettes: named colors and which color fills each role   |
| `spec/pill.md`           | The pill component: anatomy, states, roles                      |
| `spec/guidelines.md`     | What colors mean, escalation, shape rules                       |
| `impl/shell/`            | Terminal implementation: generated palettes and the renderer    |
| `docs/index.html`        | The generated reference page                                    |
| `scripts/build.mjs`      | Generates every committed output from the tokens                |

Tokens use the [Design Tokens Community Group format](https://www.designtokens.org/tr/drafts/format/)
(`$value`, `$type`). Palettes: `tng` (default) and `2375`, both from
[trekcolors](https://leonawicz.github.io/trekcolors/reference/lcars_colors.html).

## Implementations

The spec layer (`tokens/`, `spec/`) describes components without reference to any medium: shapes
in proportions of block height, colors as roles, blink as a period and a dim factor. Each
implementation under `impl/` maps that onto one medium and documents the mapping in its own README.
A consumer picks an implementation and never reads the tokens directly.

- `impl/shell/` draws pills in truecolor terminals and zsh prompts. See
  [`impl/shell/README.md`](impl/shell/README.md).
- `impl/css/` is planned. `docs/index.html` already shows how pills look in CSS.

## Use it from a shell

```sh
LCARS_DS=${LCARS_DS:-$HOME/code/lcars-design-system}
. "$LCARS_DS/impl/shell/palette.sh"
. "$LCARS_DS/impl/shell/pill.sh"
lcars_pill accent PATH "$PWD" && printf '%s\n' "$lcars_pill_out"
```

The generated files are committed, so consumers need no build step. Keep a fallback for machines
without the repo.

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
endorsed by Paramount. Color names and values come from Matthew Leonawicz's
[trekcolors](https://github.com/leonawicz/trekcolors).
