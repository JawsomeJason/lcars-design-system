#!/usr/bin/env node
// Generates every committed output from tokens/: dist/tokens.json, impl/shell/palette.sh,
// impl/shell/palette.zsh and docs/index.html. `node scripts/build.mjs --check` exits 1 when a committed output is stale.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT = 'tng';
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const roles = readJson('tokens/roles.tokens.json');
const type = readJson('tokens/type.tokens.json');
const tokens = (group) => Object.entries(group).filter(([k]) => !k.startsWith('$'));

const hexOf = (token, where) => {
  const v = token.$value;
  const hex = (typeof v === 'string' ? v : v?.hex)?.toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(hex ?? '')) throw new Error(`${where}: needs a 6-digit hex color`);
  if (typeof v === 'object') {
    const want = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    if (v.components.some((c, i) => Math.abs(c - want[i]) > 0.001)) throw new Error(`${where}: components disagree with hex`);
  }
  return hex;
};

const state = roles.state;
const dim = state.dim.$value;
const snap = Math.round(state['dim-snap'].$value * 255);
const period = state['blink-period'].$value;
const blinkSeconds = period.unit === 'ms' ? period.value / 1000 : period.value;
if (!Number.isInteger(blinkSeconds)) throw new Error('blink-period must be whole seconds for the shell renderer');
const dimPercent = Math.round(dim * 100);

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Themes x modes. A role resolves in layers: the theme's own value, else the role's default
// alias; light and print modes overlay their shared values, the theme's measured overrides, then
// derive what is left (display, alert text, data) by mixing toward black in OKLab.
const MODES = ['dark', 'light', 'print'];
const lightMode = readJson('tokens/modes/light.tokens.json');
const printMode = readJson('tokens/modes/print.tokens.json');
const derive = lightMode.$extensions['lcars.mode'].derive;

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const toOklab = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => srgbToLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const fromOklab = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, linearToSrgb(c))) * 255).toString(16).padStart(2, '0')).join('');
};
/** Mix a color toward black by amount (0..1) in OKLab, as CSS color-mix(in oklab, c, black N%). */
const toBlack = (hex, amount) => fromOklab(toOklab(hex).map((v, i) => (i === 0 ? v * (1 - amount) : v * (1 - amount))));

const roleNames = tokens(roles.role).map(([n]) => n);
const groupHex = (group, where) => Object.fromEntries(tokens(group ?? {}).filter(([, v]) => typeof v.$value !== 'string').map(([n, v]) => [n, hexOf(v, `${where} role.${n}`)]));
const groupAlias = (group) => Object.fromEntries(tokens(group ?? {}).filter(([, v]) => typeof v.$value === 'string').map(([n, v]) => [n, v.$value]));

function resolveTheme(id, file, mode) {
  const aliases = { ...Object.fromEntries(tokens(roles.role).map(([n, v]) => [n, v.$value])), ...groupAlias(file.role) };
  let layer = groupHex(file.role, id);
  if (mode === 'light') {
    // Shared light values, then this theme's measured ones; whatever is still missing among
    // display, alert text and data is the theme's dark source color mixed toward black.
    const dark = resolveTheme(id, file, 'dark');
    const measured = { ...groupHex(lightMode.role, 'light'), ...groupHex(file.mode?.light?.role, `${id} light`) };
    const derived = Object.fromEntries(Object.entries(derive).filter(([n]) => !measured[n]).map(([n, [from, amount]]) => [n, toBlack(dark[from], amount)]));
    layer = { ...layer, ...derived, ...measured };
  }
  if (mode === 'print') layer = { ...layer, ...groupHex(printMode.role, 'print') };
  const out = {};
  const resolve = (name, seen = []) => {
    if (out[name]) return out[name];
    if (seen.includes(name)) throw new Error(`${id} ${mode}: alias loop ${[...seen, name].join(' -> ')}`);
    if (layer[name]) return (out[name] = layer[name]);
    const v = aliases[name];
    if (v && typeof v === 'object') return (out[name] = hexOf({ $value: v }, `roles ${name}`));
    const ref = /^\{role\.([a-z0-9-]+)\}$/.exec(v ?? '')?.[1];
    if (!ref) throw new Error(`${id} ${mode}: role ${name} has no value`);
    return (out[name] = resolve(ref, [...seen, name]));
  };
  for (const n of roleNames) resolve(n);
  return Object.fromEntries(roleNames.map((n) => [n, out[n]]));
}

const themes = readdirSync(join(root, 'tokens/themes'))
  .filter((f) => f.endsWith('.tokens.json'))
  .map((f) => {
    const id = f.replace('.tokens.json', '');
    const file = readJson(`tokens/themes/${f}`);
    const meta = file.$extensions?.['lcars.theme'] ?? {};
    const modes = Object.fromEntries(MODES.map((m) => [m, resolveTheme(id, file, m)]));
    return {
      id,
      title: meta.name ?? id,
      era: meta.era,
      standIn: meta.standIn,
      description: file.$description,
      modes,
      roles: Object.entries(modes.dark).map(([n, h]) => [n, h, /^\{role\.([a-z0-9-]+)\}$/.exec(roles.role[n].$value)?.[1] ?? '']),
      colors: Object.entries(modes.dark),
      hex: modes.dark,
    };
  })
  .sort((a, b) => (a.id === DEFAULT ? -1 : b.id === DEFAULT ? 1 : a.id.localeCompare(b.id)));
const palettes = themes;

const dimmed = (hex) =>
  '#' + rgb(hex).map((c) => (Math.floor((2 * c * dimPercent + 100 * snap) / (200 * snap)) * snap).toString(16).padStart(2, '0')).join('');
// case arms: the default goes last, as the catch-all
const shellOrder = () => [...palettes.slice(1), palettes[0]];
const varName = (name) => 'lcars_' + name.replaceAll('-', '_');
const header = (c) => `${c} Generated by scripts/build.mjs from tokens/. Do not edit; run \`node scripts/build.mjs\`.`;

function paletteSh() {
  const lines = [
    '# shellcheck shell=sh',
    header('#'),
    `# Selects the theme named by LCARS_THEME (or the older LCARS_PALETTE; default ${DEFAULT}), dark mode, and sets lcars_<name>='R;G;B' for each`,
    '# of its colors and roles, lcars_colors and lcars_roles (the names), and lcars_rgb NAME, which sets',
    '# lcars_rgb_out to the R;G;B of a color or role name, or returns 1.',
    `lcars_dim_percent=${dimPercent} lcars_dim_step=${snap} lcars_blink_seconds=${blinkSeconds}`,
    `lcars_themes='${palettes.map((p) => p.id).join(' ')}' lcars_palettes=$lcars_themes`,
    'case ${LCARS_THEME:-${LCARS_PALETTE:-' + DEFAULT + '}} in',
  ];
  for (const p of shellOrder()) {
    const entries = Object.entries(p.hex);
    lines.push(`  ${p.id === DEFAULT ? '*' : p.id})`);
    lines.push(`    lcars_theme=${p.id} lcars_palette=${p.id}`);
    lines.push(`    lcars_colors='${p.colors.map(([n]) => n).join(' ')}'`);
    lines.push(`    lcars_roles='${p.roles.map(([n]) => n).join(' ')}'`);
    for (const [n, h] of entries) lines.push(`    ${varName(n)}='${rgb(h).join(';')}'`);
    lines.push('    lcars_rgb() {');
    lines.push('      case $1 in');
    for (const [n, h] of entries) lines.push(`        ${n}) lcars_rgb_out='${rgb(h).join(';')}' ;;`);
    lines.push('        *) return 1 ;;', '      esac', '    }', '    ;;');
  }
  lines.push('esac', '');
  return lines.join('\n');
}

function paletteZsh() {
  const lines = [
    header('#'),
    `# Selects the theme named by LCARS_THEME (or LCARS_PALETTE; default ${DEFAULT}), dark mode. LCARS maps every role name`,
    "# to its hex; lcars_rgb NAME sets lcars_rgb_out to its R;G;B, the contract pill.sh reads.",
    `typeset -g lcars_dim_percent=${dimPercent} lcars_dim_step=${snap} lcars_blink_seconds=${blinkSeconds}`,
    'typeset -gA LCARS',
    'case ${LCARS_THEME:-${LCARS_PALETTE:-' + DEFAULT + '}} in',
  ];
  for (const p of shellOrder()) {
    lines.push(`  ${p.id === DEFAULT ? '*' : p.id})`);
    lines.push(`    typeset -g lcars_theme=${p.id} lcars_palette=${p.id}`);
    lines.push('    LCARS=(');
    for (const [n, h] of Object.entries(p.hex)) lines.push(`      ${n} '${h}'`);
    lines.push('    ) ;;');
  }
  lines.push(
    'esac',
    'lcars_rgb() {',
    '  local h=${LCARS[$1]#\\#}',
    '  [[ -n $h ]] || return 1',
    '  lcars_rgb_out="$((16#${h[1,2]}));$((16#${h[3,4]}));$((16#${h[5,6]}))"',
    '}',
    '',
  );
  return lines.join('\n');
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function pillHtml(p, color, label, value, { state = 'on', valueColor = 'value', ink = 'label-ink' } = {}) {
  const lit = p.hex[color];
  const bg = state === 'off' ? p.hex.unlit : lit;
  const vc = state === 'off' ? p.hex.muted : p.hex[valueColor] ?? valueColor;
  const fg = state === 'off' ? p.hex['label-ink'] : p.hex[ink];
  const vars = `--bg:${bg};--lit:${lit};--dim:${dimmed(lit)};--ink:${fg};--vc:${vc}`;
  return `<span class="pill${state === 'blink' ? ' blink' : ''}" style="${vars}"><span class="label">${esc(label)}</span><span class="value">${value}</span><span class="end"></span></span>`;
}

function paletteSection(p) {
  const swatches = p.colors
    .filter(([n]) => !['bg', 'ink', 'label-ink', 'data-hi'].includes(n))
    .map(
      ([n, h]) => `<tr><th scope="row"><code>${n}</code><span class="hex">${h}</span></th>
        <td>${pillHtml(p, n, n.split('-')[0].slice(0, 6), 'lit')}</td>
        <td>${pillHtml(p, n, n.split('-')[0].slice(0, 6), 'off', { state: 'off' })}</td>
        <td>${pillHtml(p, n, n.split('-')[0].slice(0, 6), 'blink', { state: 'blink' })}</td></tr>`,
    )
    .join('\n');
  const roleRows = p.roles
    .map(([n, h, ref]) => `<li><span class="chip" style="background:${h}"></span><code>${n}</code> <span class="muted">${ref} ${h}</span></li>`)
    .join('\n');
  const span = (role, text) => `<span style="color:${p.hex[role]}">${esc(text)}</span>`;
  return `<section id="${p.id}">
  <h2>${esc(p.title)} theme</h2>
  <p class="desc">${esc(p.description)}</p>
  <h3>Roles</h3>
  <ul class="roles">${roleRows}</ul>
  <h3>Roles by state</h3>
  <div class="scroll"><table>
    <thead><tr><th scope="col">Role</th><th scope="col">Lit</th><th scope="col">Off</th><th scope="col">Blink</th></tr></thead>
    <tbody>${swatches}</tbody>
  </table></div>
  <h3>Examples</h3>
  <p class="muted">A system readout:</p>
  <div class="row">
    ${pillHtml(p, 'accent-4', 'CTX', '42%', { valueColor: 'ok' })}
    ${pillHtml(p, 'accent', '5H', '8%')}
    ${pillHtml(p, 'accent', '7D', '91% ↻Tue', { valueColor: 'alert', state: 'blink' })}
    ${pillHtml(p, 'ok', 'DISK', '▓▓▓▓▓▓░░░░ 120G free')}
    ${pillHtml(p, 'accent-3', 'MODEL', 'Opus')}
    ${pillHtml(p, 'accent-2', 'BR', 'main')}
    ${pillHtml(p, 'muted', 'DIFF', 'clean', { state: 'off' })}
  </div>
  <p class="muted">A navigation row with an alert indicator:</p>
  <div class="row">
    ${pillHtml(p, 'accent', 'PATH', '~/code/lcars')}
    ${pillHtml(p, 'accent-2', 'BR', 'feature')}
    ${pillHtml(p, 'accent-4', 'PR', '#12 APPR', { valueColor: 'ok' })}
    ${pillHtml(p, 'muted', 'DIFF', `${span('added', '+12')} ${span('removed', '-3')}`)}
    ${pillHtml(p, 'alert', 'ERR', '1', { ink: 'emphasis-ink' })}
  </div>
</section>`;
}

function indexHtml() {
  const tng = palettes[0];
  return `<!doctype html>
<!-- ${header('').trim()} -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>LCARS Design System</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: dark;
    --h: 1.6rem;
    --page: #000;
    --text: ${tng.hex.text};
    --muted: ${tng.hex.muted};
    --rule: ${tng.hex.accent};
    --blink: ${blinkSeconds * 2}s;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--page);
    color: var(--text);
    font: 1rem/1.5 Antonio, "Arial Narrow", "Roboto Condensed", "Helvetica Neue", sans-serif;
    padding-inline: max(16px, env(safe-area-inset-left));
    padding-block: 2rem 4rem;
  }
  main { max-width: 70rem; margin-inline: auto; }
  h1, h2, h3 { text-transform: uppercase; letter-spacing: 0.06em; text-wrap: balance; margin-block: 2rem 0.75rem; }
  h1 { color: ${tng.hex.accent}; font-size: clamp(2rem, 6vw, 3.5rem); margin-top: 0; }
  h2 { color: ${tng.hex.value}; border-bottom: 0.4rem solid var(--rule); border-radius: 0 0 0 1rem; padding-bottom: 0.2rem; }
  h3 { color: ${tng.hex.block}; font-size: 1.1rem; }
  p, li { text-wrap: pretty; }
  a { color: ${tng.hex['accent-4']}; }
  code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.85em; }
  .muted, .desc { color: var(--muted); }
  .hex { display: block; color: var(--muted); font-family: ui-monospace, Menlo, monospace; font-size: 0.75rem; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; }
  th, td { padding: 0.35rem 1rem 0.35rem 0; text-align: left; vertical-align: middle; font-weight: 400; }
  thead th { color: ${tng.hex.block}; text-transform: uppercase; letter-spacing: 0.06em; }
  .roles { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.25rem 1rem; }
  .chip { display: inline-block; width: 1.4rem; height: 0.8rem; border-radius: 0.4rem; margin-right: 0.5rem; vertical-align: middle; }
  .row { display: flex; flex-wrap: wrap; gap: calc(var(--h) * 0.5); align-items: center; }

  /* Pill: start cap and label block share the block color; the value sits on the page; the end cap
     stands alone. Every size is a proportion of the block height --h, per spec/pill.md. */
  .pill { display: inline-flex; align-items: center; height: var(--h); font-size: calc(var(--h) * 0.62); line-height: 1; white-space: nowrap; }
  .pill .label {
    display: inline-flex; align-items: center; height: 100%;
    background: var(--bg); color: var(--ink);
    padding-inline: calc(var(--h) * 0.5) calc(var(--h) * 0.5);
    border-radius: calc(var(--h) * 0.5) 0 0 calc(var(--h) * 0.5);
    text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700;
  }
  .pill .value { color: var(--vc); padding-inline: calc(var(--h) * 0.5); }
  .pill .end { width: calc(var(--h) * 0.5); height: 100%; background: var(--bg); border-radius: 0 calc(var(--h) * 0.5) calc(var(--h) * 0.5) 0; }
  .pill.blink { animation: blink var(--blink) steps(1, end) infinite; }
  @keyframes blink { 0% { --bg: var(--lit); } 50% { --bg: var(--dim); } }
  @property --bg { syntax: "<color>"; inherits: true; initial-value: #333; }
  @media (prefers-reduced-motion: reduce) {
    .pill.blink { animation: none; }
    .pill.blink .end { outline: 2px dashed var(--dim); outline-offset: 2px; }
  }

  .anatomy { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); align-items: start; }
  .anatomy svg { width: 100%; max-width: 32rem; height: auto; }
  .anatomy dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; }
  .anatomy dt { color: ${tng.hex.value}; text-transform: uppercase; }
  .anatomy dd { margin: 0; }
  nav a { margin-right: 1rem; text-transform: uppercase; letter-spacing: 0.06em; }
</style>
</head>
<body>
<main>
  <h1>LCARS Design System</h1>
  <p>An LCARS-inspired design system: tokens, component specs and reference implementations. This page is generated from <code>tokens/</code>. Terminal first; CSS and SVG later.</p>
  <nav>${palettes.map((p) => `<a href="#${p.id}">${esc(p.title)}</a>`).join('')}<a href="#anatomy">Anatomy</a></nav>

  <section id="anatomy">
    <h2>Pill anatomy</h2>
    <div class="anatomy">
      <svg viewBox="0 0 400 120" role="img" aria-label="Pill anatomy: start cap, label block, value, end cap">
        <rect x="20" y="40" width="40" height="40" rx="20" fill="${tng.hex.accent}"/>
        <rect x="40" y="40" width="120" height="40" fill="${tng.hex.accent}"/>
        <text x="60" y="68" font-family="Antonio, Arial Narrow, sans-serif" font-weight="700" font-size="24" fill="#000">LABEL</text>
        <text x="180" y="68" font-family="Antonio, Arial Narrow, sans-serif" font-size="24" fill="${tng.hex.value}">VALUE</text>
        <path d="M 260 40 A 20 20 0 0 1 260 80 Z" fill="${tng.hex.accent}"/>
        <g fill="${tng.hex.muted}" font-family="Antonio, Arial Narrow, sans-serif" font-size="13">
          <text x="14" y="28">START CAP</text>
          <text x="80" y="104">LABEL BLOCK</text>
          <text x="182" y="28">VALUE</text>
          <text x="246" y="104">END CAP</text>
          <text x="300" y="64">h = block height</text>
        </g>
      </svg>
      <dl>
        <dt>Start cap</dt><dd>Half-circle, radius 0.5h, block color.</dd>
        <dt>Label block</dt><dd>Block color, label in label-ink, uppercase, 0.5h padding after the label.</dd>
        <dt>Value</dt><dd>On the page background, value color, 0.5h gap each side.</dd>
        <dt>End cap</dt><dd>Half-circle, radius 0.5h, block color, standing alone.</dd>
      </dl>
    </div>
    <p class="muted">Here the caps are CSS border radii. Terminals draw them with the Nerd Font half-circle glyphs U+E0B6 and U+E0B4; see <code>impl/shell/README.md</code>.</p>
    <h3>States</h3>
    <div class="row">
      ${pillHtml(tng, 'accent', 'LIT', 'value')}
      ${pillHtml(tng, 'accent', 'OFF', 'value', { state: 'off' })}
      ${pillHtml(tng, 'accent', 'BLINK', 'value', { state: 'blink' })}
    </div>
    <p class="muted">Blink alternates lit and the dimmed hue (×${dim}, snapped to the 0x${snap.toString(16)} grid) every ${blinkSeconds}s. With reduced motion it holds lit and marks the end cap with a dashed outline.</p>
  </section>

  ${palettes.map(paletteSection).join('\n')}

  <p class="muted">LCARS was designed by Michael Okuda and belongs to Paramount. This is a fan project, not affiliated with or endorsed by Paramount.</p>
</main>
</body>
</html>
`;
}

// Type tokens resolved: aliases replaced, dimensions as CSS-ready strings ('-0.05em').
function resolvedType() {
  const lookup = (ref) => {
    const path = /^\{([a-z0-9.-]+)\}$/.exec(ref)?.[1];
    if (!path) return ref;
    const token = path.split('.').reduce((o, k) => o?.[k], type);
    if (!token) throw new Error(`type.tokens.json: unknown reference ${ref}`);
    return plain(token.$value);
  };
  const plain = (v) => (v && typeof v === 'object' && 'unit' in v ? `${v.value}${v.unit}` : typeof v === 'string' ? lookup(v) : v);
  const group = (g) => Object.fromEntries(tokens(g).map(([k, t]) => [k, plain(t.$value)]));
  return {
    font: group(type.font),
    weight: group(type.weight),
    tracking: group(type.tracking),
    capRatio: type.metric['cap-ratio'].$value,
    bodyLeading: type.metric['body-leading'].$value,
    level: Object.fromEntries(tokens(type.level).map(([k, t]) => [k, Object.fromEntries(Object.entries(t.$value).map(([p, v]) => [p, plain(v)]))])),
  };
}

// The tokens resolved for consumers: no aliases, no $value objects, one plain hex per color and role.
function tokensJson() {
  const out = {
    $description: header('').trim() + ' Resolved from the DTCG tokens: every theme lists every role as hex in each mode.',
    default: { theme: DEFAULT, mode: 'dark' },
    state: { dim, dimSnap: state['dim-snap'].$value, blinkPeriodMs: blinkSeconds * 1000 },
    type: resolvedType(),
    themes: Object.fromEntries(themes.map((p) => [p.id, {
      name: p.title,
      era: p.era,
      source: p.description,
      ...(p.standIn ? { standIn: p.standIn } : {}),
      modes: p.modes,
    }])),
  };
  return JSON.stringify(out, null, 2) + '\n';
}

const outputs = {
  'dist/tokens.json': tokensJson(),
  'impl/shell/palette.sh': paletteSh(),
  'impl/shell/palette.zsh': paletteZsh(),
  'docs/index.html': indexHtml(),
};

const check = process.argv.includes('--check');
let stale = 0;
for (const [path, body] of Object.entries(outputs)) {
  const full = join(root, path);
  let current = null;
  try { current = readFileSync(full, 'utf8'); } catch {}
  if (current === body) continue;
  if (check) { console.error(`stale: ${path}`); stale++; }
  else { mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, body); console.log(`wrote ${path}`); }
}
process.exit(stale ? 1 : 0);
