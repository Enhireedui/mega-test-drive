/**
 * The pass, drawn as elevation contours.
 *
 * This is the page's one bold gesture, and it is not ornament. The event is
 * named for a place — Морингийн даваа, a mountain pass — and sold on terrain, so
 * the page's only graphic is that terrain surveyed: nested contour rings with a
 * saddle between two high points, which is what a pass *is* on a map. The reading
 * of "OFF-ROAD EDITION" and the reading of this drawing are the same reading.
 *
 * Inline SVG rather than an image: it is a dozen paths, it scales without a
 * second asset, it costs no request, and its stroke colour comes from the same
 * token as the rest of the page.
 *
 * ── The geometry ─────────────────────────────────────────────────────────
 * Each ring is one closed path over a fixed set of control points — two lobes
 * either side of a waist. `spread` pushes the lobes apart and lifts the waist as
 * the rings step outward, so the shape opens the way a real contour interval
 * does instead of looking like a scaled copy of itself. Nothing here is random:
 * random contours read as noise, and noise is not a survey.
 *
 * Every ring's opacity falls as it moves outward, so the field dissolves at its
 * edges and needs no mask to stop cleanly.
 */

/** How many rings. Eight reads as a survey; twelve reads as a moiré. */
const RINGS = 8;

/**
 * One contour at step `i`, as an SVG path over a 400×260 box.
 *
 * The waist is what makes it a pass rather than a hill: the two lobes are joined
 * by a pinch at the centre that stays pinched at every interval.
 */
function contour(i: number): string {
  const spread = 1 + i * 0.26;
  const cx = 200;
  const cy = 150;

  // Lobe centres walk outward; the western one sits slightly higher, as ridges do.
  const lobeX = 62 * spread;
  const lobeW = 46 + i * 15;
  const lobeH = 30 + i * 11;
  const waist = 12 + i * 9;

  const wx = cx - lobeX;
  const ex = cx + lobeX;
  const wy = cy - 8;
  const ey = cy + 4;

  return [
    // west lobe, over the top
    `M ${wx - lobeW} ${wy}`,
    `C ${wx - lobeW} ${wy - lobeH}, ${wx + lobeW * 0.45} ${wy - lobeH * 1.15}, ${cx - waist * 0.6} ${cy - waist}`,
    // the saddle
    `C ${cx} ${cy - waist * 0.75}, ${cx} ${cy - waist * 0.75}, ${cx + waist * 0.6} ${cy - waist}`,
    // east lobe, over the top
    `C ${ex - lobeW * 0.45} ${ey - lobeH * 1.15}, ${ex + lobeW} ${ey - lobeH}, ${ex + lobeW} ${ey}`,
    // east lobe, underneath
    `C ${ex + lobeW} ${ey + lobeH}, ${ex - lobeW * 0.45} ${ey + lobeH * 1.15}, ${cx + waist * 0.6} ${cy + waist}`,
    // the saddle, underneath
    `C ${cx} ${cy + waist * 0.75}, ${cx} ${cy + waist * 0.75}, ${cx - waist * 0.6} ${cy + waist}`,
    // west lobe, underneath
    `C ${wx + lobeW * 0.45} ${wy + lobeH * 1.15}, ${wx - lobeW} ${wy + lobeH}, ${wx - lobeW} ${wy}`,
    "Z",
  ].join(" ");
}

interface ContourFieldProps {
  className?: string;
}

export function ContourField({ className = "" }: ContourFieldProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 260"
      fill="none"
      /* `visibleFill` would clip the outermost strokes; the field is composed to
         run past its own box and dissolve, so overflow stays visible. */
      className={`pointer-events-none overflow-visible ${className}`}
    >
      {Array.from({ length: RINGS }, (_, i) => (
        <path
          key={i}
          d={contour(i)}
          stroke="var(--color-amber)"
          strokeWidth={i === 0 ? 1.1 : 0.7}
          /* Innermost ring reads as the summit and is held brightest; the rest
             fall away so the field ends without an edge. */
          strokeOpacity={0.5 - i * 0.055}
          className="trace"
          style={{ "--trace-delay": `${0.5 + i * 0.11}s` } as React.CSSProperties}
        />
      ))}

      {/*
       * The survey mark on the saddle — the low point between the two lobes, which
       * is the pass itself and the reason the road goes there. A crosshair, not a
       * pin: this is a field record, not a map app.
       */}
      <g
        stroke="var(--color-amber)"
        strokeOpacity="0.75"
        strokeWidth="1"
        className="trace"
        style={{ "--trace-delay": "1.5s" } as React.CSSProperties}
      >
        <path d="M200 138v24M188 150h24" />
      </g>
    </svg>
  );
}
