// Moon phase icon — cool grey-blue style (lit side silver-white, dark side steel grey,
// flat maria blobs on lit side, crisp terminator). Phase 0=new, 180=full.

const MOON_MARIA = [
  { x: -0.34, y: -0.40, rx: 0.30, ry: 0.24 },
  { x:  0.04, y: -0.28, rx: 0.19, ry: 0.18 },
  { x:  0.32, y: -0.04, rx: 0.20, ry: 0.24 },
  { x:  0.50, y: -0.42, rx: 0.09, ry: 0.09 },
  { x: -0.50, y:  0.06, rx: 0.14, ry: 0.36 },
  { x: -0.18, y:  0.38, rx: 0.20, ry: 0.16 },
  { x:  0.14, y:  0.32, rx: 0.10, ry: 0.10 },
];

type Props = { phase: number; size: number; uid: string };

export default function MoonFace({ phase, size, uid }: Props) {
  const r = size / 2, cx = r, cy = r;
  const isWaxing  = phase < 180;
  const norm      = isWaxing ? phase / 180 : (phase - 180) / 180;
  const termRx    = r * Math.abs(Math.cos(norm * Math.PI));
  const isGibbous = phase >= 90 && phase < 270;
  const litRight  = isWaxing;
  const blurSd    = Math.max(0.4, size * 0.008); // crisp terminator

  return (
    <>
      <defs>
        <clipPath id={`${uid}c`}><circle cx={cx} cy={cy} r={r - 0.5} /></clipPath>

        {/* Lit-side radial gradient — cool silver-white */}
        <radialGradient id={`${uid}g`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#e4eaf4" />
          <stop offset="65%"  stopColor="#c8d4e4" />
          <stop offset="100%" stopColor="#a2b2c8" />
        </radialGradient>

        {/* Slight blur on terminator for smooth edge */}
        <filter id={`${uid}bt`}><feGaussianBlur stdDeviation={blurSd} /></filter>

        {/* Phase mask */}
        <mask id={`${uid}m`}>
          <g filter={`url(#${uid}bt)`}>
            <circle cx={cx} cy={cy} r={r} fill="#fff" />
            {!isGibbous && (
              <ellipse cx={cx + (litRight ? termRx : -termRx)} cy={cy} rx={termRx} ry={r} fill="#000" />
            )}
            <rect x={litRight ? 0 : cx} y={0} width={r} height={size} fill="#000" />
            {isGibbous && (
              <ellipse cx={cx + (litRight ? -termRx : termRx)} cy={cy} rx={termRx} ry={r} fill="#fff" />
            )}
          </g>
        </mask>
      </defs>

      {/* Dark side — steel grey-blue */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill="#4e607a" clipPath={`url(#${uid}c)`} />

      {/* Lit side — gradient sphere + flat maria blobs */}
      <g mask={`url(#${uid}m)`} clipPath={`url(#${uid}c)`}>
        <circle cx={cx} cy={cy} r={r - 0.5} fill={`url(#${uid}g)`} />
        {MOON_MARIA.map((m, i) => (
          <ellipse key={i}
            cx={cx + m.x * r} cy={cy + m.y * r}
            rx={m.rx * r} ry={m.ry * r}
            fill="#8aa0bc" opacity={0.52}
          />
        ))}
      </g>

      {/* Subtle limb shadow */}
      <circle cx={cx} cy={cy} r={r - 0.7} fill="none" stroke="#000" strokeOpacity={0.14} strokeWidth={0.8} />
    </>
  );
}
