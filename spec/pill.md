# Pill

A pill shows one labeled reading: a colored label block followed by a value. Use it for a system
readout, a navigation button, or an alert indicator. Pills sit in a row and wrap as whole units.

## Anatomy

All sizes are proportions of the block height, `h`.

| Part        | Shape and size                                          | Color                      |
| ----------- | ------------------------------------------------------- | -------------------------- |
| Start cap   | Half circle, radius 0.5h, flat side toward the label    | Block color                |
| Label block | Rectangle, height h; label then 0.5h padding at the end | Block color                |
| Label       | Uppercase text, set inside the label block              | `label-ink`                |
| Value       | Text on the background, 0.5h gap on each side           | `value` unless set         |
| End cap     | Half circle, radius 0.5h, flat side toward the value    | Block color                |

The start cap joins the label block. The value sits on the background between the label block and
the end cap, and the end cap stands alone. Separate neighboring pills by 0.5h. Text height is about
0.6h.

The block color is the pill's identity: a role such as `accent`, `accent-2` or `alert`. A value may
change color part-way, as when a count of additions in `added` sits next to removals in `removed`.

## States

| State | Block      | Label       | Value                      |
| ----- | ---------- | ----------- | -------------------------- |
| Lit   | Its color  | `label-ink` | Its value color            |
| Off   | `unlit`    | `label-ink` | `muted`                    |
| Blink | Alternates | `label-ink` | Its value color, unchanged |

- **Lit** is the default.
- **Off** is an unlit button: present, readable, and quiet. Use it for a reading that exists but
  carries no news, such as "no changes".
- **Blink** alternates the block between lit and dimmed every `state.blink-period` (one period lit,
  the next dimmed). Dimmed is the lit color with each channel multiplied by `state.dim` (0.4), then
  rounded to the nearest multiple of `state.dim-snap` (0.2 of full range), so a dimmed color stays
  on the palette grid. Both caps dim with the block. Reserve blink for alerts that need action now.
  Where the reader has asked for reduced motion, hold the lit state and mark the pill another way.

## Roles used

| Part        | Role                                              |
| ----------- | ------------------------------------------------- |
| Block, caps | Any color role; `unlit` when off                  |
| Label       | `label-ink`; `emphasis-ink` on an `alert` block   |
| Value       | `value` by default; `ok`, `warning` or `alert` when the value itself carries the meaning; `muted` when off |
