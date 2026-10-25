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

The TNG palette has no green, so `ok` is a light blue. Don't add green to signal success; that
breaks the palette and reads as a different design language.

## Palettes

Every palette restates every role, so a component written against roles works under any palette.
Each palette file cites its source in `$description`. Components never name a raw color.
