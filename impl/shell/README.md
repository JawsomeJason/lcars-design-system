# Shell implementation

Draws pills in a truecolor terminal. One renderer serves both plain ANSI output (status lines,
scripts) and zsh prompts.

| File          | What it is                                                         |
| ------------- | ------------------------------------------------------------------ |
| `palette.sh`  | Generated. POSIX `lcars_<name>='R;G;B'` variables and `lcars_rgb`  |
| `palette.zsh` | Generated. `LCARS` associative array of hex, and `lcars_rgb`       |
| `pill.sh`     | The renderer, POSIX sh. Sources into sh, bash, dash and zsh        |

Both palette files come from `tokens/` through `node scripts/build.mjs`. Never edit them by hand.

## Use

```sh
LCARS_DS=${LCARS_DS:-$HOME/code/lcars-design-system}
. "$LCARS_DS/impl/shell/palette.sh"     # zsh: palette.zsh
. "$LCARS_DS/impl/shell/pill.sh"

lcars_pill accent-3 MODEL 'Opus 5'                    # lit
lcars_pill muted DIFF clean '' off                    # off
lcars_pill alert DISK '4G free' '' blink              # blink
lcars_ink added; plus=$lcars_ink_out
lcars_ink removed
lcars_pill muted DIFF "${plus}+12 ${lcars_ink_out}-3" # two colors in one value
lcars_pill accent-2 BR main '' on https://github.com/o/r/tree/main   # value is a link
printf '%s\n' "$lcars_pill_out"
```

`lcars_pill ROLE_OR_COLOR LABEL VALUE [VALUE_COLOR] [on|off|blink] [URL] [LABEL_INK]` sets
`lcars_pill_out` instead of printing, so a caller builds a row with no subshells. A color is a role
or color name, `R;G;B`, or `#rrggbb`. `lcars_ink` also takes a bare SGR code, such as `33` for the
terminal's own yellow.

| Variable        | Effect                                                              |
| --------------- | ------------------------------------------------------------------- |
| `LCARS_PALETTE` | Palette to load (`tng` default, `2375`). Set before sourcing        |
| `LCARS_TARGET`  | `ansi` (default) or `zsh`                                           |
| `LCARS_NOW`     | Epoch seconds that pick the blink phase. Set once per frame to skip a `date` call per pill |

## How the spec maps to a terminal

- **Caps** are the Nerd Font half-circle glyphs U+E0B6 (start) and U+E0B4 (end), drawn in the
  block color on the default background. A font without them shows boxes.
- **Block height** is one character cell. A cell is about half as wide as it is tall, so the
  spec's 0.5h padding and gaps are one space each.
- **Color** is 24-bit SGR: `38;2;R;G;B` for text, `48;2;R;G;B` for the block. The terminal needs
  truecolor.
- **zsh prompts** need every escape inside `%{ %}` so zsh counts the prompt's width right, and
  every literal `%` doubled. `LCARS_TARGET=zsh` does both; ANSI and zsh output carry the same
  colors byte for byte once those wrappers are removed, which `test/run.sh` checks.
- **Links** are OSC 8 hyperlinks around the value.
- **Blink** is a redraw toggle, not SGR 5. Many terminals, Ghostty among them, ignore SGR 5, and
  the spec's blink is a dimmed hue rather than a hidden one. The renderer picks lit or dimmed from
  the clock (`LCARS_NOW / lcars_blink_seconds % 2`), so blink only moves when the caller redraws at
  least once a period, such as a status line with a one-second refresh.

## Rerun

```sh
node scripts/build.mjs   # regenerate palette.sh, palette.zsh and docs/index.html
sh test/run.sh           # tests
sh demo/pills.sh         # every color in every state; --live to watch blink
```
