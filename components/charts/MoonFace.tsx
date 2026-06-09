// Moon phase icon — flat illustrative style matching timeanddate.com aesthetic.
// Lit side: flat light grey-blue. Dark side: flat steel grey. Clean terminator.
// Phase 0=new moon, 90=first quarter, 180=full, 270=last quarter.

const MOON_MARIA = [
  { x: -0.30, y: -0.38, rx: 0.28, ry: 0.22 },
  { x:  0.05, y: -0.26, rx: 0.17, ry: 0.16 },
  { x:  0.30, y: -0.04, rx: 0.18, ry: 0.22 },
  { x:  0.48, y: -0.40, rx: 0.08, ry: 0.08 },
  { x: -0.48, y:  0.06, rx: 0.12, ry: 0.32 },
  { x: -0.16, y:  0.36, rx: 0.18, ry: 0.14 },
];

const LIT  = '#cdd8e8';  // flat silver-grey (lit side)
const DARK = '#4a5c72';  // flat steel blue-grey (dark side)
const MARIA = '#8fa4bc'; // slightly darker blobs

type Props = { phase: number; size: number; uid: string };

export default function MoonFace({ phase, size, uid }: Props) {
  const r = size / 2, cx = r, cy = r;
  const isWaxing  = phase < 180;
  const norm      = isWaxing ? phase / 180 : (phase - 180) / 180;
  const termRx    = r * Math.abs(Math.cos(norm * Math.PI));
  const isGibbous = phase >= 90 && phase < 270;
  const litRight  = isWaxing;

  // Build the lit-side clip path (same geometry as the old mask, no blur)
  const litClipId = `${uid}lc`;
  const baseClipId = `${uid}bc`;

  return (
    <>
      <defs>
        {/* Clip to circle boundary */}
        <clipPath id={baseClipId}><circle cx={cx} cy={cy} r={r - 0.5} /></clipPath>

        {/* Lit portion clip — the illuminated region */}
        <clipPath id={litClipId}>
          {isGibbous ? (
            // More than half lit: start with the lit half, expand with ellipse
            <>
              <rect x={litRight ? cx : 0} y={0} width={r} height={size} />
              <ellipse cx={cx + (litRight ? -termRx : termRx)} cy={cy} rx={termRx} ry={r} />
            </>
          ) : (
            // Less than half lit: narrow crescent using ellipse intersection
            // Use a rect for the lit half side, clip with the terminator ellipse complement
            // Achieved by defining the crescent region directly
            <ellipse cx={cx + (litRight ? termRx : -termRx)} cy={cy} rx={termRx} ry={r} />
          )}
        </clipPath>
      </defs>

      {/* Base circle — dark side colour */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill={DARK} clipPath={`url(#${baseClipId})`} />

      {/* Lit side */}
      <g clipPath={`url(#${baseClipId})`}>
        <g clipPath={`url(#${litClipId})`}>
          <circle cx={cx} cy={cy} r={r} fill={LIT} />
          {/* Maria blobs on lit surface */}
          {MOON_MARIA.map((m, i) => (
            <ellipse key={i}
              cx={cx + m.x * r} cy={cy + m.y * r}
              rx={m.rx * r} ry={m.ry * r}
              fill={MARIA} opacity={0.55}
            />
          ))}
        </g>
      </g>

      {/* Thin border */}
      <circle cx={cx} cy={cy} r={r - 0.7} fill="none" stroke="#1a2535" strokeOpacity={0.18} strokeWidth={0.8} />
    </>
  );
}
