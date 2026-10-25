# Guidelines

## Color carries meaning

| Role      | Meaning                               | TNG color        |
| --------- | ------------------------------------- | ---------------- |
| `ok`      | Healthy, approved, passing            | anakiwa #99ccff  |
| `warning` | Approaching a limit                   | atomic-tangerine #ff9900 |
| `alert`   | Wrong, or needs action now            | chestnut-rose #cc6666 |
| `muted`   | Present but unimportant; off values   | blue-bell #9999cc |
| `value`   | A plain reading                       | golden-tanoi #ffcc66 |
| `text`    | Body text: prose, not a reading       | tanoi #ffcc99    |

Identity colors (`accent` through `accent-5`) name what a pill is. Status colors say how it is.
Put status on the value when the reading is the news, and on the block when the whole pill is.

## Escalation

Escalate in steps, and only as far as the situation needs:

1. **Normal.** Lit pill, value in `value` or `ok`.
2. **Approaching.** Value turns `warning`, or the block turns `warning`.
3. **Critical.** Value or block turns `alert`.
4. **Act now.** The pill blinks. Keep blinking pills rare; more than one at a time competes.

The reverse holds too: a reading with nothing to say goes off rather than disappearing, when its
absence would itself be confusing.

## Shape

Pills end in half circles (radius half the block height) on both ends. Never square a cap off.

## No green

No LCARS era uses green for success, so `ok` is a blue in every theme. Don't add green to signal
success; it reads as a different design language.

## Themes and modes

A **theme** is one era's look: its colors assigned to every role, in every mode, with its sources.
Themes: TNG, VOY, FC, NEM, PIC and LD (Lower Decks). A **mode** cuts across
themes: `dark` (default), `light` and `print`. Every theme resolves every role in every mode, so a
component written against roles works under any combination. Each theme file cites its sources in
`$description` and marks stand-in values. Components never name a raw color.

Structural roles (`frame`, `block`, `accent`, `stub`, `text`, `meter-on`, `meter-off`, `alert`,
`focus`, `data`) describe how LCARS is built: frames never carry text, blocks carry `ink`. Semantic
roles (`ok`, `warning`, `value`, `muted`, `added`, `removed`, `accent-2` to `accent-5`) alias
structural ones, and a theme may point one elsewhere, as VOY points `ok` at its meter blue.

Canon comes first: colors are what the screen shows, measured or reconstructed, never adjusted to
meet a contrast target.
