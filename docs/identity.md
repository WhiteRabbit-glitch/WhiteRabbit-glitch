# Identity

How this profile is put together, so the next change doesn't undo a decision that had a reason behind it.

## Direction

Alice in Wonderland by way of a corrupted screen. The handle already meant that, so the earlier alchemy-and-candles version was a layer sitting on top of a concept that didn't need it.

The Cheshire cat is the mark, because a cat that vanishes and leaves its grin behind is a rendering artifact described in 1865. Everything else follows from that: section names are Wonderland, the tone is amused rather than earnest, and the banner animates the vanish.

## Palette

Sampled from the reference painting, not invented. Contrast is measured against the `#080517` ground.

| Hex | Name | Use | Contrast |
| --- | --- | --- | --- |
| `#080517` | Ink | The ground. 42% of the reference painting by area | — |
| `#04020D` | Deep | Vignette edge | — |
| `#54193A` | Wine | Shadow, badge backgrounds | 13.3:1 with white |
| `#B52A5C` | Crimson | Shapes and badge backgrounds only | 3.3:1 — **never carries text** |
| `#D887A7` | Rose | Tagline | 7.6:1 |
| `#64A9E3` | Ice | Cold accents | — |
| `#A6C6E8` | Pale | Secondary text | 11.9:1 |
| `#EBD747` | Yellow | The cat's eyes, and one word of the wordmark | 13.7:1 |
| `#F5EDF8` | Bone | Teeth, headings | 18.2:1 |

Yellow is scarce on purpose. It appears as two eyes and the word GLITCH, nowhere else.

## Type

Chakra Petch 700 for the wordmark, IBM Plex Mono for the tagline. Both are baked into the banner image, so nothing depends on a font loading at view time.

## The banner

`assets/banner.svg` cross-fades two painted frames on a 14 second cycle: the cat, then only its eyes and grin, then back.

- `assets/cat-full.png` and `assets/cat-fading.png` are the source paintings.
- The frames were generated separately, so the head sat in a different place in each. `tools/align-frames.mjs` uses the yellow eyes as anchor points, solves the transform between them and corrects the residual. Re-run it if the art is ever regenerated, or the cat will slide sideways instead of dissolving.
- The wordmark is composited over the art, not painted into it, and sits identically in both frames — which is why no clip or seam is needed and the text holds still through the fade.
- A left-to-right scrim guarantees the text has a ground. Measured per line: white 16.2:1, yellow 13.2:1, rose 7.1:1.

### Reduced motion

Handled by `<picture>` in the README, **not** by a media query inside the SVG. Chrome does not propagate `prefers-reduced-motion` into an SVG loaded as an `<img>`, so a guard written there silently never fires. The `<source media="(prefers-reduced-motion: reduce)">` serves the still frame instead, and costs those readers 251KB rather than 595KB.

## The daily oracle

`.github/workflows/oracle.yml` runs `tools/oracle.mjs` at 14:00 UTC — 7am in Phoenix — and can be fired by hand from the Actions tab. It asks Haiku 4.5 for one line in the cat's voice and rewrites the block between `<!-- ORACLE:START -->` and `<!-- ORACLE:END -->`.

Needs the `ANTHROPIC_API_KEY` repository secret.

The voice lives in the `SYSTEM` constant at the top of the script. Edit that to change the tone.

Two properties worth keeping if you touch it:

- **Output is sanitised.** It lands on a public page. First line only, angle brackets and markdown control characters stripped, whitespace collapsed, capped at 120 characters, rejected under 10.
- **It fails safe.** A missing key, a rate limit, a refusal, or a line that doesn't survive cleaning all leave the README unchanged and exit 0. Yesterday's line stays up rather than the page breaking.

## The contribution snake

`.github/workflows/snake.yml` regenerates it daily to the `output` branch, which the README's `<picture>` block points at. If the snake image ever 404s, that branch is missing — run the workflow once by hand to recreate it.

## Things that were removed, and why

- **The github-readme-stats cards.** The shared public instance 503s regularly, and a 503 renders as a broken-image icon rather than as nothing. Self-hosting a fork would fix it if you ever want them back.
- **The palette hex list** that used to sit under the view counter. A note-to-self on a page meant for other people.
- **Alchemical emoji** in the section headings. Screen readers either skip them or announce them wrong.

## Standing rules

- Crimson never carries text.
- Verify contrast against the pixels actually behind the text, not against the nominal background.
- Check what a font size renders at, not what the source says. The banner is authored at 1760px and displays near 880px, so source units are roughly double what the reader sees.
- Third-party badge and stat services are all one shared instance away from breaking. Prefer things committed to this repo.
