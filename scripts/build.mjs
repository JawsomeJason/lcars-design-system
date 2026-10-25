#!/usr/bin/env node
// Generates every committed output from tokens/: dist/tokens.json, impl/shell/palette.sh,
// impl/shell/palette.zsh, docs/index.html and docs/roles.css. `node scripts/build.mjs --check` exits 1 when a committed output is stale.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './site.mjs';

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
  ...site({ themes, roles, type: resolvedType(), version: readJson('package.json').version, dimmed, blinkSeconds, dim, snap, header }),
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
