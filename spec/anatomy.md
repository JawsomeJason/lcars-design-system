# Anatomy

The geometry of an LCARS frame. Every length is a multiple of the unit `u`, one point of the
reference layout, so a frame scales as one piece. Colors are roles; see `guidelines.md`.

## Lengths

| Name       | Value                         | What it is                                              |
| ---------- | ----------------------------- | ------------------------------------------------------- |
| `gap`      | 3u                            | The black between every pair of shapes. The only gap.  |
| `gap-fine` | 1u                            | Between meter segments only.                            |
| `arm`      | 36u                           | A frame's top bar: the elbow's horizontal member.       |
| `bar-section` | 22u                        | A section heading's bar, and a nested frame's arm.      |
| `row`      | 20u                           | A row label or contact row.                             |
| `sidebar`  | 112.8u                        | The elbow's leg and the sidebar below it.               |
| `overrun`  | 0.6 × arm                     | How far the arm runs past the leg, and the leg below the arm. |
| `tab`      | overrun − gap                 | The column between the sidebar and the field.           |
| `r-outer`  | 1 × arm                       | The elbow's outer sweep.                                |
| `r-inner`  | min(arm ÷ 3, overrun − 2 gaps) | The elbow's inner fillet, clamped so it never eats the leg. |
| `inset`    | 2.75u                         | A label's inset from a block's bottom and right edges.  |

## Frame

A frame is a grid with three columns, `sidebar`, `tab` and the field, and the gap between every
track. The elbow fills the sidebar and tab columns across the arm row and the tab row, so it is
`sidebar + overrun` wide and `arm + overrun` tall. The top bar fills the arm row to the right of the
elbow. The sidebar starts one gap below the elbow. The field starts below the elbow and right of
the tab column.

- **Elbow.** One painted piece: a `frame` box with `r-outer` on its outer corner, minus a cutout in
  the page color that starts `arm` down and `sidebar` across, with `r-inner` on its corner. Never
  build it from two halves or mirror it with a transform; both leave seams.
- **Top bar.** A row of segments a gap apart, starting with the title cut. One `stub` segment may
  break a long run. A run that stops ends in a separate end cap; an end that meets an elbow or a bar
  stays square.
- **Sidebar.** Blocks a gap apart, `block` color, labels bottom right inset by `inset`, in `ink`. A
  code block in `accent` may head it, reading `XX-NN`, where NN counts the rows it heads.
- **Field.** The page color. Content lives here, never on the frame.

## Cut

Where text interrupts a bar, the bar becomes text, gap, bar. The text's cap height equals the bar
(see `type.md`), its color is `display` on the page, and a gap of black separates it from the shapes
on each side. A section heading reads: a `tab`-wide `accent` square, the heading cut into a
`bar-section` bar, the bar, and an end cap `1.5 × bar-section` wide.

## End cap

The far end is a half round: its radius is half the bar height. Canon TNG caps are flatter, 0.73 to
0.85 of a half round; Voyager's free-standing pills are true half rounds.

## Canon proportions

These values are the reference layout's: a thick arm and a small fillet, which hold up at small
sizes. Screen panels pair a thin arm with a wide sidebar. Six elbows measured in three Memory Alpha
captures give a sidebar of 7.1 to 7.6 arms (TNG) or 3.8 to 4.6 (VOY), an inner radius of 0.8 to 2.2
arms (median 1.3), and an outer radius of 1.9 to 5.1 arms. To build the canon look, derive the arm
from the sidebar (about sidebar ÷ 7) and keep the inner radius clamped.

## States

Every state change is a hard cut, never a transition. A pressed or selected control takes the
`stub` role. Focus is a `focus` ring drawn in the gap around the shape.
