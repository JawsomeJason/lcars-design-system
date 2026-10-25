# Changelog

Versions follow the rules in the README's "Versions" section.

## 0.4.0

Breaking (below 1.0, breaking changes bump the minor):

- Palettes become **themes**, one per era: `tng`, `pic`, `voy`, `fc`, `nem`, from the thejase.com
  LCARS lab (measured from captures, or reconstructed; each cites its sources and marks stand-ins).
  The trekcolors `tng` and `2375` palettes are gone, and so are their named colors.
- **Modes**: `dark` (default), `light` and `print`. Every theme resolves every role in every mode.
- **Roles** merge the lab's structural set (`bg`, `ink`, `frame`, `block`, `accent`, `stub`, `text`,
  `meter-on`, `meter-off`, `alert`, `focus`, `data`, `data-hi`, `display`, `alert-text`) with the
  semantic set, which now aliases it. Minimum contrast per role, enforced by the tests.
- `dist/tokens.json`: `palettes` becomes `themes[id].modes[mode]`; `default` becomes `{ theme, mode }`;
  adds `minContrast`.
- Shell: `LCARS_THEME` selects the theme (`LCARS_PALETTE` still works); dark mode only.

## 0.3.0

- Typography: `tokens/type.tokens.json` (display and body families, weights, tracking, the display cap-height ratio, six type levels) and `spec/type.md`. Resolved into `dist/tokens.json` under `type`. Minor: new tokens.

## 0.2.1

- `exports` now allows the DTCG source (`lcars-design-system/tokens/...`) and the specs (`lcars-design-system/spec/...`); 0.1.0 and 0.2.0 blocked them.

## 0.2.0

- New role `text`: body text on the background (TNG tanoi, 2375 sandy-brown). Minor: a new role.

## 0.1.0

- First release: roles and the TNG and 2375 palettes as DTCG tokens, the pill spec, the guidelines,
  the shell implementation and the reference page.
- `dist/tokens.json`: the tokens resolved to plain hex per palette, for consumers.
