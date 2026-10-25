// The docs site: docs/index.html and docs/roles.css, generated from the resolved themes by build.mjs.
// docs/lcars.css is hand-written; it draws the grammar and reads the role variables written here.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Site copy per era, in air order. Colors and sources come from the theme files.
const ERAS = {
  tng: { show: 'The Next Generation', years: '1987–1994', stardate: ['Stardate', '41153.7'], blurb: 'Okuda’s original: almond, butterscotch, violet and bluey shapes on black. No production hex values survive, so this theme is the thelcars.com Classic reconstruction.' },
  voy: { show: 'Voyager', years: '1995–2001', stardate: ['Stardate', '48315.6'], blurb: 'The same grammar, repainted in pastels: frost-blue frames, gold blocks and peach headings. Measured from screen captures, which run far softer than the fan palettes.' },
  fc: { show: 'First Contact', years: '1996', stardate: ['Stardate', '50893.5'], blurb: 'The Enterprise-E arrives with darker, film-graded panels: bronze frames, lavender blocks, pale cyan headings and a deep red alert. Measured from the 2023 Blu-ray.' },
  nem: { show: 'Nemesis', years: '2002', stardate: ['Stardate', '56844.9'], blurb: 'The Enterprise-E regraded toward blue: deep blue frames, cyan headings, a hard red alert. Measured from the 2023 Blu-ray with the blue grade cast removed.' },
  pic: { show: 'Picard, season 1', years: '2020', stardate: ['Year', '2399'], blurb: 'Slate and steel on a blue-black page. It is built on the only studio-sourced LCARS hex values found, posted by designer Andrew Jarvis; the blue, stub and text are thelcars.com extensions.' },
};
const ERA_ORDER = Object.keys(ERAS);

const SECTIONS = [
  ['primer', 'Primer'],
  ['anatomy', 'Anatomy'],
  ['eras', 'Eras'],
  ['color', 'Color'],
  ['modes', 'Modes'],
  ['type', 'Type'],
  ['pill', 'Pill'],
  ['use', 'Use it'],
  ['sources', 'Sources'],
];
const code = (i) => String(i + 1).padStart(2, '0');

const SOURCES = [
  ['Michael and Denise Okuda, Q&A, TrekToday, 1999', 'https://www.trektoday.com/interviews/okuda_qa.shtml'],
  ['Memory Alpha: Library Computer Access and Retrieval System', 'https://memory-alpha.fandom.com/wiki/Library_Computer_Access_and_Retrieval_System'],
  ['Memory Alpha: Okudagram', 'https://memory-alpha.fandom.com/wiki/Okudagram'],
  ['Memory Alpha: 47', 'https://memory-alpha.fandom.com/wiki/47'],
  ['Wikipedia: LCARS', 'https://en.wikipedia.org/wiki/LCARS'],
  ['Wrath of Dhan, Okudagrams part II: creating the 24th century', 'http://wrathofdhanprops.blogspot.com/2018/06/okudagrams-part-ii-creating-24th.html'],
  ['Wrath of Dhan, Okudagrams part 5: up close and personal', 'http://wrathofdhanprops.blogspot.com/2018/08/okudagrams-part-5-up-close-and-personal.html'],
  ['SlashFilm: what LCARS means', 'https://www.slashfilm.com/1773283/star-trek-lcars-meaning'],
  ['TrekCore: Mike McMahan on Lower Decks', 'https://blog.trekcore.com/2020/08/interview-star-trek-lower-decks-mike-mcmahan/'],
  ['thelcars.com: colors', 'https://www.thelcars.com/colors.php'],
  ['thelcars.com: fonts', 'https://www.thelcars.com/fonts.php'],
  ['Fonts In Use: Helvetica Compressed', 'https://www.fontsinuse.com/typefaces/7751/helvetica-compressed'],
  ['TrekCore: First Contact 2023 Blu-ray screencaps', 'https://movies.trekcore.com/gallery/index.php?cat=110'],
  ['TrekCore: Nemesis 2023 Blu-ray screencaps', 'https://movies.trekcore.com/gallery/index.php?cat=112'],
  ['Memory Alpha: display graphics captures', 'https://memory-alpha.fandom.com/wiki/Category:Memory_Alpha_images_(display_graphics)'],
  ['R package lcars: lcars_elbow', 'https://search.r-project.org/CRAN/refmans/lcars/html/lcars_elbow.html'],
  ['MDN: text-box', 'https://developer.mozilla.org/en-US/docs/Web/CSS/text-box'],
];

const REPO = 'https://github.com/JawsomeJason/lcars-design-system';

export function site({ themes, roles, type, version, dimmed, blinkSeconds, dim, snap, header }) {
  const byId = Object.fromEntries(themes.map((t) => [t.id, t]));
  const eras = [...ERA_ORDER.filter((id) => byId[id]), ...themes.map((t) => t.id).filter((id) => !ERAS[id])].map((id) => byId[id]);
  const def = themes[0];
  const roleNames = Object.keys(def.modes.dark);
  const roleDoc = (n) => roles.role[n];
  const aliasOf = (n) => /^\{role\.([a-z0-9-]+)\}$/.exec(roleDoc(n).$value)?.[1];
  const structural = roleNames.filter((n) => !aliasOf(n) && n !== 'unlit');
  const semantic = roleNames.filter((n) => aliasOf(n));

  // --- roles.css ---------------------------------------------------------------------------------
  function rolesCss() {
    const out = [`/* ${header('').trim()} */`, '/* Every theme in every mode: --lcars-<role> and its blink dim, --lcars-<role>-dim. */', '[data-theme] { --blink: ' + blinkSeconds * 2 + 's; }'];
    for (const t of themes) {
      for (const [mode, hex] of Object.entries(t.modes)) {
        out.push(`[data-theme="${t.id}"][data-mode="${mode}"] {`, `  color-scheme: ${mode === 'dark' ? 'dark' : 'light'};`);
        for (const [n, h] of Object.entries(hex)) out.push(`  --lcars-${n}: ${h}; --lcars-${n}-dim: ${dimmed(h)};`);
        out.push('}');
      }
    }
    return out.join('\n') + '\n';
  }

  // --- pieces ------------------------------------------------------------------------------------
  const pill = (label, value, { c = 'accent', v, state, ink } = {}) => {
    const vars = [`--c:var(--lcars-${c})`, `--cd:var(--lcars-${c}-dim)`];
    if (v) vars.push(`--vc:var(--lcars-${v})`);
    if (ink) vars.push(`--pi:var(--lcars-${ink})`);
    return `<span class="pill${state ? ' ' + state : ''}" style="${vars.join(';')}"><span class="label">${esc(label)}</span><span class="value">${value}</span><span class="end"></span></span>`;
  };
  const span = (role, text) => `<span style="color:var(--lcars-${role})">${esc(text)}</span>`;
  const sh = (i) => `<h2 class="sh"><span class="cut">${esc(SECTIONS[i][1])}</span><span class="seg"></span><span class="seg cap"><span>${code(i)}</span></span></h2>`;
  const h3 = (text) => `<h3><span>${text}</span></h3>`;
  const hexCell = (t, role) => `<td data-theme="${t.id}" data-mode="dark" data-follow="mode"><span class="chip" style="--c:var(--lcars-${role})"></span><code class="hx">${Object.entries(t.modes).map(([m, h]) => `<span data-m="${m}">${h[role]}</span>`).join('')}</code></td>`;
  const meter = (on, of) => `<div class="meter" aria-hidden="true">${'<i></i>'.repeat(on)}${'<i class="off"></i>'.repeat(of - on)}</div>`;

  const miniPanel = (t, title, attrs) => {
    const era = ERAS[t.id] ?? { stardate: ['Stardate', '—'] };
    return `<div class="panel" ${attrs}>
      <div class="elbow"></div>
      <div class="top bar"><span class="cut">${esc(title)}</span><span class="seg"></span><span class="seg stub"></span><span class="seg cap"><span>47</span></span></div>
      <div class="side"><span class="block accent"><span>OP-04</span></span><span class="block"><span>Ops</span></span><span class="block grow"><span>Aux</span></span></div>
      <div class="field">
        <dl class="read"><dt>${era.stardate[0]}</dt><dd>${era.stardate[1]}</dd><dt>Warp core</dt><dd class="hi">98.6%</dd><dt>Hull</dt><dd>Nominal</dd><dt>Shields</dt><dd class="al">Down</dd></dl>
        ${meter(8, 12)}
      </div>
    </div>`;
  };

  // The anatomy diagram, in u. Arm 36, sidebar 112.8, overrun 21.6, gap 3, radii 36 and 12.
  const anatomySvg = `<svg class="dia" viewBox="-6 -44 640 330" role="img" aria-labelledby="dia-t">
  <title id="dia-t">An LCARS frame with every piece labeled: elbow, title cut, bar, stub, end cap, gap, inner radius, code block, sidebar blocks, section heading, meter and field.</title>
  <path class="f-frame" d="M0 57.6V36A36 36 0 0 1 36 0H134.4V36H124.8A12 12 0 0 0 112.8 48V57.6Z"/>
  <text class="f-display t-title" x="137.4" y="36" textLength="92" lengthAdjust="spacingAndGlyphs">TITLE</text>
  <rect class="f-frame" x="232.4" y="0" width="188" height="36"/>
  <rect class="f-stub" x="423.4" y="0" width="45" height="36"/>
  <rect class="f-frame" x="471.4" y="0" width="88" height="36"/>
  <path class="f-frame" d="M562.4 0H598.4A18 18 0 0 1 598.4 36H562.4Z"/>
  <rect class="f-accent" x="0" y="60.6" width="112.8" height="30"/>
  <text class="f-ink t-label" x="107" y="87.8" text-anchor="end">02-14</text>
  <rect class="f-block" x="0" y="93.6" width="112.8" height="56"/>
  <text class="f-ink t-label" x="107" y="146.8" text-anchor="end">BLOCK</text>
  <rect class="f-block" x="0" y="152.6" width="112.8" height="84"/>
  <text class="f-ink t-label" x="107" y="233.8" text-anchor="end">BLOCK</text>
  <rect class="f-block" x="0" y="239.6" width="112.8" height="40"/>
  <rect class="f-accent" x="137.4" y="96" width="18.6" height="22"/>
  <text class="f-display t-head" x="159" y="118" textLength="74" lengthAdjust="spacingAndGlyphs">SECTION</text>
  <rect class="f-frame" x="236" y="96" width="323.4" height="22"/>
  <path class="f-frame" d="M562.4 96H584.4A11 11 0 0 1 584.4 118H562.4Z"/>
  <g class="f-text">${[0, 1, 2, 3, 4].map((i) => `<rect x="400" y="${136 + i * 12}" width="${[196, 180, 192, 120, 170][i]}" height="4"/>`).join('')}</g>
  <g>${Array.from({ length: 12 }, (_, i) => `<rect class="${i < 8 ? 'f-meter-on' : 'f-meter-off'}" x="${400 + i * 16.4}" y="212" width="15.4" height="11.6"/>`).join('')}</g>
  <g class="lead">
    <path d="M18 -26V12M182 -26V-2M326 -26V-2M446 -26V-2M582 -26V-2M422 38V58M118 42L150 56M114 75H148M114 195H148M232 128L232 140M398 218H300"/>
  </g>
  <g class="f-muted t-note">
    <text x="0" y="-32">ELBOW · OUTER R = ARM</text>
    <text x="160" y="-32">TITLE CUT</text>
    <text x="300" y="-32">BAR · 36<tspan class="lc">u</tspan> ARM</text>
    <text x="430" y="-32">STUB</text>
    <text x="548" y="-32">END CAP</text>
    <text x="380" y="70">GAP · 3<tspan class="lc">u</tspan></text>
    <text x="154" y="60">INNER R = ARM ÷ 3</text>
    <text x="154" y="79">CODE BLOCK</text>
    <text x="154" y="199">SIDEBAR · BLOCKS A GAP APART</text>
    <text x="210" y="152">SECTION HEADING · 22<tspan class="lc">u</tspan> BAR</text>
    <text x="206" y="222">METER · 1<tspan class="lc">u</tspan> APART</text>
    <text x="400" y="262">FIELD · CONTENT ON BLACK</text>
  </g>
</svg>`;

  const pillSvg = `<svg class="dia sm" viewBox="0 0 400 120" role="img" aria-label="Pill anatomy: start cap, label block, value, end cap">
  <rect class="f-accent" x="20" y="40" width="40" height="40" rx="20"/>
  <rect class="f-accent" x="40" y="40" width="120" height="40"/>
  <text class="f-ink t-pill" x="60" y="68" font-weight="700">LABEL</text>
  <text class="f-value t-pill" x="180" y="68">VALUE</text>
  <path class="f-accent" d="M260 40A20 20 0 0 1 260 80Z"/>
  <g class="f-muted t-note"><text x="14" y="28">START CAP</text><text x="80" y="104">LABEL BLOCK</text><text x="182" y="28">VALUE</text><text x="246" y="104">END CAP</text><text x="300" y="64">h = block height</text></g>
</svg>`;

  const levelSample = (name, l) => {
    const style = `font-family:${l.fontFamily.map((f) => (f.includes(' ') ? `'${f}'` : f)).join(',')};font-weight:${l.fontWeight};letter-spacing:${l.letterSpacing};text-transform:${l.case === 'upper' ? 'uppercase' : 'none'};font-size:${{ title: '2.2rem', 'row-label': '1.5rem', heading: '1.6rem', label: '1.1rem', body: '1rem', meta: '0.95rem' }[name] ?? '1rem'};line-height:1.2`;
    const text = { title: 'Enterprise NCC-1701-D', 'row-label': 'Main engineering', heading: 'Sensor analysis', label: 'Deflector array', body: 'Running text reads as written, in Lato.', meta: 'SD 41153.7 · 47-B' }[name] ?? name;
    return `<tr><th scope="row"><code>${name}</code></th><td><span style="${style};color:var(--lcars-${l.case === 'upper' && name !== 'meta' ? 'display' : 'text'})">${esc(text)}</span></td><td>${l.fontWeight}</td><td>${l.letterSpacing}</td><td>${l.fit}</td></tr>`;
  };

  const tng = byId.tng ?? def;
  const sample = Object.fromEntries(['frame', 'block', 'accent', 'ok', 'warning', 'alert'].map((n) => [n, tng.modes.dark[n]]));

  // --- sections ----------------------------------------------------------------------------------
  const primer = `<section id="primer">${sh(0)}
  <p class="lede">LCARS is the computer interface of Starfleet in the Next Generation era: black screens, colored bars bent into elbows, and labels in tall, condensed capitals. This site explains how it is built, era by era, and gives you the tokens to build it yourself.</p>
  ${h3('The name')}
  <p>LCARS stands for Library Computer Access/Retrieval System. Michael Okuda designed it for <cite>Star Trek: The Next Generation</cite> in 1987, and it carried on through <cite>Deep Space Nine</cite>, <cite>Voyager</cite>, the four TNG films and the series since. The crew nicknamed the screens Okudagrams, after him.</p>
  ${h3('Film, not screens')}
  <p>Most panels on set were not screens at all. They were sheets of black film with shapes cut out of them, colored by hand with gels and lit from behind by fluorescent tubes under a diffusion sheet. That is where the look comes from: a pure black ground, flat opaque shapes, and no gradients, glows or shadows. The black never changed; the colors could.</p>
  ${h3('Okuda’s rules')}
  <p>Gene Roddenberry asked for a ship that was extremely user-friendly. Asked what that meant for LCARS, the Okudas answered:</p>
  <blockquote><p>“I interpreted this to mean that there should be extremely clear organization of very complicated information.”</p><footer>Michael and Denise Okuda, TrekToday Q&amp;A, 1999</footer></blockquote>
  <p>So every panel groups something. A frame holds one subject, and its sidebar indexes it.</p>
  <blockquote><p>“I was not particularly concerned with matching colors closely because of the notion that the panel could reconfigure itself based on the software.”</p><footer>Michael Okuda, quoted by Wrath of Dhan</footer></blockquote>
  <p>He said it of the bridge backlits, which were remade as they wore out and never matched exactly. This system reads it as a license: geometry and black are fixed, and the hues belong to the era.</p>
  <p>Roddenberry also asked, as Wikipedia puts it, that the panels not have a great deal of activity on them. So motion is a garnish: a blink is a hard step, never a fade.</p>
  <div class="note"><span class="block accent"><span>47</span></span><div>
    ${h3('Codes and 47')}
    <p>The small print on LCARS is codes, not prose: section numbers, readings, crew initials. Many are in-jokes, and the number 47 most of all: writer Joe Menosky started it, and the staff and art department spread it across the franchise. This site numbers its sections the way the screens do, and its sidebar code, DS-09, counts the rows it heads.</p>
  </div></div>
  ${h3('What this system is')}
  <p>A design system distilled from those screens, in three layers:</p>
  <ul>
    <li><strong>Tokens.</strong> Every color role for every era and mode, and the type, in the Design Tokens Community Group format, plus <code>dist/tokens.json</code>, the same values resolved to plain hex.</li>
    <li><strong>Specs.</strong> <a href="${REPO}/blob/main/spec/anatomy.md">Anatomy</a>, <a href="${REPO}/blob/main/spec/type.md">type</a>, the <a href="${REPO}/blob/main/spec/pill.md">pill</a> and the <a href="${REPO}/blob/main/spec/guidelines.md">guidelines</a>, written without reference to any medium.</li>
    <li><strong>Implementations.</strong> Terminal pills in <code>impl/shell</code>, the CSS behind this page, and an Obsidian theme in <a href="https://jawsomejason.github.io/lcars-mainframe/">LCARS Mainframe</a>.</li>
  </ul>
  <p><strong>Canon comes first.</strong> Every color is what the screen shows, measured from frames or reconstructed from them. None is adjusted to meet a contrast target. Where a value is a stand-in, its theme says so.</p>
</section>`;

  const anatomy = `<section id="anatomy">${sh(1)}
  <p class="lede">LCARS has a small grammar. Learn these pieces and you can read a panel from any era. This page is built from them: the elbow at the top left, the title cut into the top bar, the sidebar of blocks, and a heading cut into a bar at every section.</p>
  <figure><div class="scroll">${anatomySvg}</div><figcaption>The pieces of a frame, drawn to scale in units of u. Every color in it is a role, so it repaints with the era.</figcaption></figure>
  ${h3('The pieces')}
  <div class="scroll"><table>
    <tbody>
      <tr><th scope="row">Unit, <span class="lc">u</span></th><td>One point of the reference layout. Every length is a whole multiple of it, so a panel scales as one piece.</td></tr>
      <tr><th scope="row">Gap</th><td>3u of black between every pair of shapes. There is one gap, and it never varies. Meter segments, 1u apart, are the only exception.</td></tr>
      <tr><th scope="row">Bar</th><td>A thick solid shape: 36u for a frame’s top bar (its arm), 22u for a section heading, 20u for a row.</td></tr>
      <tr><th scope="row">Elbow</th><td>The corner that joins the top bar to the sidebar. One painted piece with two radii: an outer sweep equal to the arm, and an inner fillet a third of it. Never a sharp inner corner.</td></tr>
      <tr><th scope="row">Sidebar</th><td>The elbow’s leg, 112.8u wide (about 3.1 arms), carried on below the elbow as a stack of blocks a gap apart.</td></tr>
      <tr><th scope="row">Overrun</th><td>How far the arm runs past the leg, and the leg below the arm: 0.6 of the arm.</td></tr>
      <tr><th scope="row">Cut</th><td>Where a title interrupts a bar. The text’s cap height equals the bar, a gap of black sits on each side, and the bar runs on.</td></tr>
      <tr><th scope="row">Stub</th><td>A short segment in a counter color, breaking up a long bar.</td></tr>
      <tr><th scope="row">End cap</th><td>A run that stops ends in a separate half-round cap, a gap away. An end that meets an elbow or another bar stays square.</td></tr>
      <tr><th scope="row">Block</th><td>A sidebar block or button. Its label sits bottom right, in dark ink.</td></tr>
      <tr><th scope="row">Field</th><td>The black area the frame encloses. Content lives here, never on the frame.</td></tr>
    </tbody>
  </table></div>
  ${h3('Color on shape')}
  <p>Dark ink on color; color on black. Text on a bar or block is set in the page’s own black, and text on the page is colored. Never white text on a bar. The frame itself carries no text: titles cut into it instead.</p>
  ${h3('Canon proportions')}
  <p>Screen panels pair a thin arm with a wide sidebar. This system defaults to the reference layout, with a thick arm and a small fillet, which holds up at small sizes. The canon ranges below come from edge-fitting six elbows in three Memory Alpha captures (<cite>Descent, Part II</cite>, <cite>Yesterday’s Enterprise</cite> and <cite>Equinox, Part II</cite>).</p>
  <div class="scroll"><table>
    <thead><tr><th scope="col">Measure</th><th scope="col">This system</th><th scope="col">TNG captures</th><th scope="col">VOY captures</th></tr></thead>
    <tbody>
      <tr><th scope="row">Sidebar ÷ arm</th><td>3.1</td><td>7.1 to 7.6</td><td>3.8 to 4.6</td></tr>
      <tr><th scope="row">Inner radius</th><td>arm ÷ 3</td><td colspan="2">0.8 to 2.2 × arm, median 1.3</td></tr>
      <tr><th scope="row">Outer radius</th><td>1 × arm</td><td colspan="2">1.9 to 5.1 × arm</td></tr>
      <tr><th scope="row">End caps</th><td>half round</td><td>flatter, 0.73 to 0.85 of a half round</td><td>true half round</td></tr>
    </tbody>
  </table></div>
  <p>The full geometry, with the rules for building an elbow in code, is in <a href="${REPO}/blob/main/spec/anatomy.md"><code>spec/anatomy.md</code></a>.</p>
</section>`;

  const eraCard = (t) => {
    const e = ERAS[t.id] ?? { show: t.title, years: '', blurb: '' };
    return `<article class="era">
      ${miniPanel(t, t.title, `data-theme="${t.id}" data-mode="dark" data-follow="mode"`)}
      ${h3(`${esc(e.show)} · ${esc(e.years)}`)}
      <p>${esc(e.blurb)}</p>
      <div class="strip" data-theme="${t.id}" data-mode="dark" data-follow="mode" aria-hidden="true">${structural.filter((n) => !['bg', 'ink', 'data-hi'].includes(n)).map((n) => `<span style="--c:var(--lcars-${n})"></span>`).join('')}</div>
      <p class="muted"><strong>Source:</strong> ${esc(t.era && t.description.startsWith(t.era + '. ') ? t.description.slice(t.era.length + 2) : t.description)}${t.standIn ? ` <strong>Stand-in:</strong> ${esc(t.standIn)}` : ''}</p>
      <button class="btn" type="button" data-set-theme="${t.id}" aria-pressed="${t.id === def.id}"><span>Show this page in ${esc(t.title)}</span></button>
    </article>`;
  };
  const erasSection = `<section id="eras">${sh(2)}
  <p class="lede">Okuda imagined panels that reconfigure themselves, so each era repainted the same grammar. A theme is one era’s colors, assigned to every role. Choose one and the whole page repaints.</p>
  <div class="panels">${eras.map(eraCard).join('\n')}
    <article class="era">
      ${h3('Lower Decks · planned')}
      <p>Mike McMahan calls Lower Decks “our version” of the TNG era, hand drawn. It joins once its frames are measured.</p>
      ${h3('Deep Space Nine · open')}
      <p>The station was built by Cardassians and its Ops screens keep their look. No sourced palette exists yet for the show’s Starfleet panels.</p>
    </article>
  </div>
</section>`;

  const color = `<section id="color">${sh(3)}
  <p class="lede">Components never name a color. They name a role, and the theme fills it in. Structural roles say how LCARS is built; semantic roles say what a reading means. The tables follow the page’s mode.</p>
  ${h3('Structural roles')}
  <div class="scroll"><table>
    <thead><tr><th scope="col">Role</th><th scope="col">Duty</th>${eras.map((t) => `<th scope="col">${esc(t.title)}</th>`).join('')}</tr></thead>
    <tbody>${[...structural, 'unlit'].map((n) => `<tr><th scope="row"><code>${n}</code></th><td>${esc(roleDoc(n).$description)}</td>${eras.map((t) => hexCell(t, n)).join('')}</tr>`).join('\n')}</tbody>
  </table></div>
  ${h3('Semantic roles')}
  <p>Each points at a structural role by default, and an era may point it elsewhere: Voyager points <code>ok</code> at its meter blue.</p>
  <div class="scroll"><table>
    <thead><tr><th scope="col">Role</th><th scope="col">Meaning</th><th scope="col">Default</th>${eras.map((t) => `<th scope="col">${esc(t.title)}</th>`).join('')}</tr></thead>
    <tbody>${semantic.map((n) => `<tr><th scope="row"><code>${n}</code></th><td>${esc(roleDoc(n).$description)}</td><td><code>${aliasOf(n)}</code></td>${eras.map((t) => hexCell(t, n)).join('')}</tr>`).join('\n')}</tbody>
  </table></div>
  ${h3('No green')}
  <p>No LCARS era uses green for success, so <code>ok</code> is a blue in every theme. Green would read as a different design language. Red appears only for alerts, and an alert always comes with words.</p>
  ${h3('Escalation')}
  <p>Like a ship going from normal operations to red alert, escalate in steps, and only as far as the situation needs. Identity colors (<code>accent</code> to <code>accent-5</code>) say what a pill is; status colors say how it is.</p>
  <div class="scroll"><table><tbody>
    <tr><th scope="row">1 · Normal</th><td>${pill('Shields', '100%', { c: 'accent', v: 'ok' })}</td><td>Lit, value in <code>value</code> or <code>ok</code>.</td></tr>
    <tr><th scope="row">2 · Approaching</th><td>${pill('Shields', '38%', { c: 'accent', v: 'warning' })}</td><td>The value turns <code>warning</code>, or the block does.</td></tr>
    <tr><th scope="row">3 · Critical</th><td>${pill('Shields', '9%', { c: 'alert', v: 'alert-text', ink: 'emphasis-ink' })}</td><td>The value or the block turns <code>alert</code>.</td></tr>
    <tr><th scope="row">4 · Act now</th><td>${pill('Shields', 'down', { c: 'alert', v: 'alert-text', ink: 'emphasis-ink', state: 'blink' })}</td><td>The pill blinks. Keep blinking pills rare; two at once compete.</td></tr>
  </tbody></table></div>
  <p>The reverse holds too: a reading with nothing to say goes off rather than disappearing, when its absence would itself confuse.</p>
</section>`;

  const modes = `<section id="modes">${sh(4)}
  <p class="lede">A mode cuts across themes. Every theme resolves every role in every mode, so anything written against roles works in any combination.</p>
  <div class="scroll"><table><tbody>
    <tr><th scope="row">Dark</th><td>The screen: the default, and the only canon mode.</td></tr>
    <tr><th scope="row">Light</th><td>A pale page with dark text, for reading in daylight. Headings, alert text and data take the era’s dark colors mixed toward black in OKLab (45%, 40% and 45%), unless the era measured its own.</td></tr>
    <tr><th scope="row">Print</th><td>Ink on paper. Printing this page switches it to print mode on its own.</td></tr>
  </tbody></table></div>
  <div class="panels">${['dark', 'light', 'print'].map((m) => `<figure>${miniPanel(def, m[0].toUpperCase() + m.slice(1), `data-theme="${def.id}" data-mode="${m}" data-follow="theme"`)}<figcaption>${m[0].toUpperCase() + m.slice(1)} mode, in the page’s era.</figcaption></figure>`).join('')}</div>
</section>`;

  const typeSection = `<section id="type">${sh(5)}
  <p class="lede">LCARS reads through its type: tall, condensed capitals, packed tight.</p>
  ${h3('Two faces')}
  <p>Okuda has said he mostly used Helvetica Ultra Compressed, and Letraset Compacta besides. Bitstream’s digital cut of the Helvetica is Swiss 911 Ultra Compressed. Both are commercial, so this system sets display text in <strong>Antonio</strong>, an open-licensed condensed face, and running text in <strong>Lato</strong>. Never set display text in a regular-width face; LCARS reads through its condensed caps.</p>
  <p style="font:700 clamp(2rem,7vw,4rem)/1 var(--display);letter-spacing:-0.06em;text-transform:uppercase;color:var(--lcars-display);margin:0.5em 0">USS Enterprise NCC-1701-D</p>
  ${h3('Cap height equals the bar')}
  <p>When display text sits in a bar, the bar sets the size: <code>font-size = bar ÷ ${type.capRatio}</code>, Antonio’s cap height. Trim the line box to the cap height above and the baseline below, with <code>text-box: trim-both cap alphabetic</code>, and the caps fill the bar exactly: cap tops meet its top edge, the baseline sits on its bottom edge. A 36px bar takes ${(36 / type.capRatio).toFixed(2)}px type.</p>
  <div class="typedemo">
    <div class="sh" style="margin:var(--bar-s) 0"><span class="cut trimbox">Trimmed</span><span class="seg"></span><span class="seg cap"><span>OK</span></span></div>
    <div class="sh untrim" style="margin:var(--bar-s) 0"><span class="cut trimbox">Untrimmed</span><span class="seg"></span><span class="seg cap"><span>NO</span></span></div>
  </div>
  <p class="muted">The dashed box is the text’s line box. Untrimmed, it carries the font’s ascent and descent, and the caps float off the bar’s edges.</p>
  ${h3('Levels')}
  <div class="scroll"><table>
    <thead><tr><th scope="col">Level</th><th scope="col">Sample</th><th scope="col">Weight</th><th scope="col">Tracking</th><th scope="col">Fit</th></tr></thead>
    <tbody>${Object.entries(type.level).map(([n, l]) => levelSample(n, l)).join('\n')}</tbody>
  </table></div>
  <p><code>bar</code> levels take their size from the bar they sit in; <code>free</code> levels use the medium’s reading size. Negative tracking also lands after the last letter, which narrows the black after a title, so pad the end by the tracking to even it out.</p>
</section>`;

  const pillSection = `<section id="pill">${sh(6)}
  <p class="lede">The pill is this system’s own component, built from LCARS parts: one labeled reading, for status lines, readouts and navigation. Pills sit in a row and wrap as whole units.</p>
  <figure>${pillSvg}</figure>
  <div class="scroll"><table><tbody>
    <tr><th scope="row">Start cap</th><td>Half circle, radius 0.5h, block color.</td></tr>
    <tr><th scope="row">Label block</th><td>Block color, label in <code>label-ink</code>, uppercase, 0.5h padding after the label.</td></tr>
    <tr><th scope="row">Value</th><td>On the page, in the value color, 0.5h gap each side.</td></tr>
    <tr><th scope="row">End cap</th><td>Half circle, radius 0.5h, block color, standing alone.</td></tr>
  </tbody></table></div>
  ${h3('States')}
  <div class="row">${pill('Lit', 'value')}${pill('Off', 'value', { state: 'off' })}${pill('Blink', 'value', { state: 'blink' })}</div>
  <p class="muted">Off is an unlit button: present, readable and quiet. Blink alternates lit and dimmed every ${blinkSeconds}s, where dimmed is each channel × ${dim}, snapped to the 0x${snap.toString(16)} grid. With reduced motion it holds lit and marks the end cap with a dashed outline.</p>
  ${h3('In use')}
  <p class="muted">A system readout:</p>
  <div class="row">${pill('CTX', '42%', { c: 'accent-4', v: 'ok' })}${pill('5H', '8%')}${pill('7D', '91% ↻Tue', { v: 'alert', state: 'blink' })}${pill('Disk', '▓▓▓▓▓▓░░░░ 120G free', { c: 'ok' })}${pill('Model', 'Opus', { c: 'accent-3' })}${pill('BR', 'main', { c: 'accent-2' })}${pill('Diff', 'clean', { c: 'muted', state: 'off' })}</div>
  <p class="muted">A navigation row with an alert indicator:</p>
  <div class="row">${pill('Path', '~/code/lcars')}${pill('BR', 'feature', { c: 'accent-2' })}${pill('PR', '#12 APPR', { c: 'accent-4', v: 'ok' })}${pill('Diff', `${span('added', '+12')} ${span('removed', '-3')}`, { c: 'muted' })}${pill('Err', '1', { c: 'alert', ink: 'emphasis-ink' })}</div>
  <p>Terminals draw the caps with the Nerd Font half-circle glyphs U+E0B6 and U+E0B4; see <a href="${REPO}/blob/main/impl/shell/README.md"><code>impl/shell</code></a>.</p>
</section>`;

  const jsonSample = JSON.stringify(sample, null, 2).replace(/\n/g, '\n  ');
  const use = `<section id="use">${sh(7)}
  ${h3('From JavaScript')}
  <p>Pin a release straight from GitHub; the package is not on npm.</p>
  <pre><code>"devDependencies": {
  "lcars-design-system": "github:JawsomeJason/lcars-design-system#semver:^${version.split('.').slice(0, 2).join('.')}.0"
}</code></pre>
  <pre><code>const tokens = require('lcars-design-system'); // dist/tokens.json
const { theme, mode } = tokens.default;        // '${def.id}', 'dark'
const roles = tokens.themes[theme].modes[mode];
roles.ok;                                       // '${def.modes.dark.ok}'
tokens.type.capRatio;                           // ${type.capRatio}</code></pre>
  <p>Every theme lists every role as plain hex in each mode. TNG in dark mode, in part:</p>
  <pre><code>tokens.themes.tng.modes.dark = ${esc(jsonSample)}</code></pre>
  <p>The DTCG source is exported too (<code>lcars-design-system/tokens/*</code>), but read the resolved file: it has no aliases to follow.</p>
  ${h3('From CSS')}
  <p>This page runs on two stylesheets you can copy: <a href="roles.css"><code>roles.css</code></a>, generated, sets <code>--lcars-&lt;role&gt;</code> for any element with <code>data-theme</code> and <code>data-mode</code>; <a href="lcars.css"><code>lcars.css</code></a> draws frames, elbows, cut headings, blocks and pills from them. Both ship in the package under <code>docs/</code>.</p>
  <pre><code>&lt;html data-theme="voy" data-mode="dark"&gt;
  &lt;div class="frame"&gt;&lt;div class="elbow"&gt;&lt;/div&gt;…&lt;/div&gt;</code></pre>
  ${h3('From a shell')}
  <pre><code>LCARS_DS=\${LCARS_DS:-$HOME/code/lcars-design-system}
. "$LCARS_DS/impl/shell/palette.sh"
. "$LCARS_DS/impl/shell/pill.sh"
lcars_pill accent PATH "$PWD" &amp;&amp; printf '%s\\n' "$lcars_pill_out"</code></pre>
  <p>Set <code>LCARS_THEME</code> to choose an era.</p>
  ${h3('Versions')}
  <p>Releases are git tags with GitHub releases, listed in the <a href="${REPO}/blob/main/CHANGELOG.md">changelog</a>. A major version removes or renames a role, theme or mode; a minor adds one, adds a spec, or changes a color; a patch changes words only. Below 1.0 a breaking change bumps the minor instead, so pin with a caret.</p>
  ${h3('Built with it')}
  <ul>
    <li><a href="https://jawsomejason.github.io/lcars-mainframe/">LCARS Mainframe</a>: an installable Obsidian vault with an LCARS theme in every era.</li>
    <li><a href="${REPO}/tree/main/impl/shell">impl/shell</a>: pills for truecolor terminals and zsh prompts.</li>
  </ul>
</section>`;

  const sources = `<section id="sources">${sh(8)}
  <p>The history and measurements on this page come from these sources, gathered in the thejase.com LCARS lab. Each theme file cites its own.</p>
  <ul>${SOURCES.map(([t, u]) => `<li><a href="${u}">${esc(t)}</a></li>`).join('')}</ul>
  <p class="muted">LCARS was designed by Michael Okuda for <cite>Star Trek: The Next Generation</cite> and is the property of Paramount. This is a fan project, not affiliated with or endorsed by Paramount. Antonio and Lato are under the SIL Open Font License.</p>
</section>`;

  const themeIds = themes.map((t) => t.id);
  const indexHtml = `<!doctype html>
<!-- ${header('').trim()} -->
<html lang="en" data-theme="${def.id}" data-mode="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>LCARS Design System</title>
<meta name="description" content="Learn how LCARS, the Star Trek computer interface, is built, era by era, with design tokens and specs to build it yourself.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23ea9c72' d='M0 32V12A12 12 0 0 1 12 0H32V10H18A4 4 0 0 0 14 14V32Z'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&family=Lato:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="roles.css">
<link rel="stylesheet" href="lcars.css">
<style>
  .dia { width: 100%; height: auto; max-width: 52rem; overflow: visible; }
  .dia .f-frame { fill: var(--lcars-frame); } .dia .f-block { fill: var(--lcars-block); } .dia .f-accent { fill: var(--lcars-accent); }
  .dia .f-stub { fill: var(--lcars-stub); } .dia .f-text { fill: var(--lcars-text); } .dia .f-ink { fill: var(--lcars-ink); }
  .dia .f-display { fill: var(--lcars-display); } .dia .f-muted { fill: var(--lcars-muted); } .dia .f-value { fill: var(--lcars-value); }
  .dia .f-meter-on { fill: var(--lcars-meter-on); } .dia .f-meter-off { fill: var(--lcars-meter-off); }
  .dia text { font-family: var(--display); text-transform: uppercase; }
  .dia .t-title { font-size: 41.9px; font-weight: 700; } .dia .t-head { font-size: 25.6px; } .dia .t-label { font-size: 11px; }
  .dia .t-note { font-size: 10.5px; letter-spacing: 0.02em; } .dia .t-pill { font-size: 24px; }
  .dia.sm { max-width: 30rem; } .scroll > .dia { min-width: 34rem; } .lc { text-transform: none; }
  .dia .lead { stroke: var(--lcars-muted); stroke-width: 0.75; fill: none; }
  .typedemo .trimbox { outline: 1px dashed var(--lcars-focus); }
  .typedemo .untrim .cut { text-box: normal; margin-block: 0; align-self: center; }
</style>
</head>
<body>
<div class="frame">
  <div class="elbow"></div>
  <header class="top bar"><h1 class="cut">LCARS Design System</h1><span class="seg"></span><span class="seg stub"></span><span class="seg"></span><span class="seg cap"><span>V${esc(version)}</span></span></header>
  <div class="side"><div class="side-inner">
    <span class="block accent"><span>DS-${String(SECTIONS.length).padStart(2, '0')}</span></span>
    <nav aria-label="Sections">${SECTIONS.map(([id, label], i) => `<a class="block" href="#${id}"><span>${code(i)} ${esc(label)}</span></a>`).join('')}</nav>
    <span class="block grow"><span>47</span></span>
  </div></div>
  <main>
    <div class="controls">
      <div role="group" aria-label="Era"><span class="k">Era</span>${eras.map((t) => `<button class="btn" type="button" data-set-theme="${t.id}" aria-pressed="${t.id === def.id}"><span>${esc(t.title)}</span></button>`).join('')}</div>
      <div role="group" aria-label="Mode"><span class="k">Mode</span>${['dark', 'light', 'print'].map((m) => `<button class="btn" type="button" data-set-mode="${m}" aria-pressed="${m === 'dark'}"><span>${m}</span></button>`).join('')}</div>
    </div>
    <nav class="mnav" aria-label="Sections">${SECTIONS.map(([id, label], i) => `<a class="btn right" href="#${id}"><span>${code(i)} ${esc(label)}</span></a>`).join('')}</nav>
    ${[primer, anatomy, erasSection, color, modes, typeSection, pillSection, use, sources].join('\n')}
  </main>
</div>
<script>
(() => {
  const root = document.documentElement;
  const valid = { theme: ${JSON.stringify(themeIds)}, mode: ['dark', 'light', 'print'] };
  const load = (k) => { try { return localStorage.getItem('lcars-' + k); } catch { return null; } };
  const save = (k, v) => { try { localStorage.setItem('lcars-' + k, v); } catch {} };
  function set(key, value, keep = true) {
    if (!valid[key].includes(value)) return;
    root.dataset[key] = value;
    for (const el of document.querySelectorAll('[data-follow~="' + key + '"]')) el.dataset[key] = value;
    for (const b of document.querySelectorAll('[data-set-' + key + ']')) b.setAttribute('aria-pressed', String(b.getAttribute('data-set-' + key) === value));
    if (keep) save(key, value);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set-theme], [data-set-mode]');
    if (!b) return;
    for (const k of ['theme', 'mode']) { const v = b.getAttribute('data-set-' + k); if (v) set(k, v); }
  });
  for (const k of ['theme', 'mode']) { const v = load(k); if (v) set(k, v, false); }
  let before;
  addEventListener('beforeprint', () => { before = root.dataset.mode; set('mode', 'print', false); });
  addEventListener('afterprint', () => { if (before) set('mode', before, false); });
  // Light the sidebar block of the section in view, as the stub.
  const links = new Map([...document.querySelectorAll('.side-inner nav a')].map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      for (const a of links.values()) a.removeAttribute('aria-current');
      links.get(en.target.id)?.setAttribute('aria-current', 'location');
    }
  }, { rootMargin: '-15% 0px -75% 0px' });
  for (const id of links.keys()) { const s = document.getElementById(id); if (s) io.observe(s); }
})();
</script>
</body>
</html>
`;

  return { 'docs/index.html': indexHtml, 'docs/roles.css': rolesCss() };
}
