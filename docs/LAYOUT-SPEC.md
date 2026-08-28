# Layout spec — Format "gallery" theme (justincookcamera.com/home)

Measured from the live page at a 1126px viewport. These are the numbers to hit;
the TSX files in this folder are one implementation of them.

## Page shell

| Property | Value |
|---|---|
| Body background | `#ffffff` |
| Body text | `#404040` |
| Accent (nav links) | `#f80034` |
| Content gutter | `50px` left and right, **no max-width** — the grid is fully fluid |
| Content width @1126 viewport | 1026px |

The whole site is one centered column with 50px side margins. There is no
`max-w-7xl` anywhere — the images grow with the window. That fluidity is a big
part of why it reads as a photo site and not a marketing page.

## Header (HeroSection)

```
padding: 30px 0 50px;      /* top 30, bottom 50 */
text-align: center;
```

- **Logo**: an image wordmark, 533 × 100px, centered. Two lines: a smaller
  script/serif "Photography by" over a large display "Justin Cook".
- **Gap logo → nav**: 15px.
- **Nav**: a single centered `ul` of `inline-block` items.
  - item padding: `0 20px 10px` → 40px between item centers, 10px below text
  - font: Raleway 700, `14px`, uppercase, normal letter-spacing
  - color: `#f80034` (red) for every item, active and inactive alike
  - active item: 1px underline in the same red, sitting on that 10px padding
  - "PORTFOLIO" opens a hover dropdown: MUSIC / EDITORIAL + FASHION /
    COMMERCIAL / HOSPITALITY + EVENTS
- Header block total height: **226px**. Grid starts immediately at 226 — no
  extra top padding on the gallery.

## Gallery grid (PortfolioSection)

This is the part that's easy to get wrong.

| Property | Value |
|---|---|
| Columns | 2 (desktop and tablet), 1 below 768px |
| Column width @1126 viewport | 508px |
| Horizontal gutter | **10px** |
| Vertical gutter | **10px** |
| Item widths | always full column width; heights vary with aspect ratio |
| Image treatment | full-bleed, no border, no radius, no shadow, no caption |

Measured item stack (top offsets, in px, at 508px column width):

```
col 1:  0 → 772   |  col 2:  0 → 772
      772 → 1290  |        772 → 1121
     1290 → 1639  |       1121 → 1470
     1639 → ...   |       1470 → 2242
```

Two things to notice:

1. It is **true masonry**, not a row grid. Each image keeps its own aspect
   ratio and the next image is placed in whichever column is currently
   shorter. The columns end at different heights.
2. Order flows left, right, left, right by *placement*, not by column. A CSS
   `columns-2` will fill column 1 top-to-bottom first and give you a different
   reading order — see `lib/masonry.ts` for the shortest-column version.

Roughly half the images are portrait 2:3 (772px tall) and half are landscape
3:2 (349px tall) at this width, which is what produces the staggered rhythm.

## Footer

```
padding: 80px 0 60px;
text-align: center;
font-size: 14px;
line-height: 16.8px;   /* 1.2 */
color: #000;
```

- Instagram glyph, ~16px, `currentColor`, with `margin: 14px 0 30px`
- Two centered lines below it: copyright, then a one-line "X is a photographer
  in Y" descriptor
- 254px of whitespace between the last image and the footer's first pixel

## Breakpoints

The theme only has three:

- `max-width: 767px` — mobile: 1 column, hamburger menu, smaller side gutters
- `768px – 1024px` — tablet: still 2 columns, everything else scales
- `1025px+` — desktop

## Type

The live site uses licensed Format-hosted faces — "Nobel Bold" for the logo
and "Planet Light" for body. You will need substitutes:

- Logo/display: any heavy geometric or retro display face. The wordmark is an
  *image* on the original, so you could also just export yours as SVG.
- Nav: **Raleway 700** (free on Google Fonts, exact match)
- Body: a light grotesque — Jost Light, Poppins Light, or Inter at 300

## What actually makes this layout work

- 50px gutters and 10px image gaps. The images nearly touch; the page breathes
  at the edges instead. Most portfolio attempts invert this.
- No cards, no rounded corners, no hover captions, no visible section headers.
- The only color on the page is the red nav — everything else is the photos.
