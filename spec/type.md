# Type

Two faces. **Display** (Antonio, standing in for Swiss 911 Ultra Compressed) sets every label,
heading, readout and code in uppercase. **Body** (Lato) sets running text as written.

## Display text in a bar

When display text sits in a bar (a heading bar, a row, a pill's label block), the bar sets the
size: `font-size = bar height / metric.cap-ratio`. Trim the line box to the cap height on top and
the alphabetic baseline below (CSS `text-box: trim-both cap alphabetic`), so the caps meet the bar
top and the baseline sits on the bar bottom. Descenders hang outside the box. Where trimming is not
available, center the untrimmed box and accept the extra space above the caps.

## Levels

| Level       | Face    | Weight | Tracking  | Fit  | Use                                   |
| ----------- | ------- | ------ | --------- | ---- | ------------------------------------- |
| `title`     | display | 700    | -0.06em   | bar  | The largest line: a name, a page title |
| `row-label` | display | 400    | -0.05em   | bar  | A label filling a row                 |
| `heading`   | display | 400    | -0.05em   | bar  | A section heading in its bar          |
| `label`     | display | 400    | -0.04em   | free | Names and titles beside content       |
| `body`      | body    | 400    | 0         | free | Running text, line height 14/9        |
| `meta`      | display | 400    | -0.025em  | free | Codes, dates, contact values          |

`fit: bar` levels take their size from the bar; `free` levels use the medium's reading size.

## Fonts

Both faces are under the SIL Open Font License. Implementations ship their own copies. Never
substitute a regular-width face for display text: LCARS reads through its condensed caps.
