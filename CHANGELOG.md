# Changelog

Versions follow the rules in the README's "Versions" section.

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
