// Realistic moon: limb-darkened sphere, near-side maria + craters,
// soft blurred terminator, earthshine on dark side. Phase 0=new, 180=full.

const MOON_MARIA = [
  { x: -0.34, y: -0.40, rx: 0.34, ry: 0.27 }, // Imbrium
  { x:  0.04, y: -0.30, rx: 0.21, ry: 0.20 }, // Serenitatis
  { x:  0.34, y: -0.04, rx: 0.23, ry: 0.27 }, // Tranquillitatis / Foecunditatis
  { x:  0.52, y: -0.44, rx: 0.10, ry: 0.10 }, // Crisium
  { x: -0.52, y:  0.04, rx: 0.16, ry: 0.40 }, // Procellarum
  { x: -0.20, y:  0.40, rx: 0.23, ry: 0.18 }, // Nubium / Humorum
  { x:  0.16, y:  0.34, rx: 0.12, ry: 0.12 },
];

const MOON_CRATERS = [
  { x: -0.04, y:  0.60, r: 0.055 }, // Tycho
  { x: -0.12, y: -0.04, r: 0.045 }, // Copernicus
  { x:  0.22, y:  0.48, r: 0.03  },
];

type Props = { phase: number; size: number; uid: string };

export default function MoonFace({ phase, size, uid }: Props) {
  const r = size / 2, cx = r, cy = r;
  const isWaxing  = phase < 180;
  const norm      = isWaxing ? phase / 180 : (phase - 180) / 180;
  const termRx    = r * Math.abs(Math.cos(norm * Math.PI));
  const isGibbous = phase >= 90 && phase < 270;
  const litRight  = isWaxing;

  return (
    <>
      <defs>
        <clipPath id={`${uid}c`}><circle cx={cx} cy={cy} r={r - 0.5} /></clipPath>
        <radialGradient id={`${uid}g`} cx="42%" cy="38%" r="64%">
          <stop offset="0%"   stopColor="#eae7dd" />
          <stop offset="68%"  stopColor="#cdc8b9" />
          <stop offset="100%" stopColor="#a6a08f" />
        </radialGradient>
        {/* blur for maria texture */}
        <filter id={`${uid}bt`}><feGaussianBlur stdDeviation={size * 0.022} /></filter>
        {/* blur for soft terminator edge */}
        <filter id={`${uid}bm`}><feGaussianBlur stdDeviation={Math.max(0.3, size * 0.014)} /></filter>
        <mask id={`${uid}m`}>
          <g filter={`url(#${uid}bm)`}>
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

      {/* dark side — faint earthshine blue */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill="#191c2a" clipPath={`url(#${uid}c)`} />

      {/* lit side — textured + maria + craters */}
      <g mask={`url(#${uid}m)`} clipPath={`url(#${uid}c)`}>
        <circle cx={cx} cy={cy} r={r - 0.5} fill={`url(#${uid}g)`} />
        <g filter={`url(#${uid}bt)`} opacity={0.5}>
          {MOON_MARIA.map((m, i) => (
            <ellipse key={i}
              cx={cx + m.x * r} cy={cy + m.y * r}
              rx={m.rx * r} ry={m.ry * r}
              fill="#8d8676"
            />
          ))}
        </g>
        {MOON_CRATERS.map((c, i) => (
          <circle key={i}
            cx={cx + c.x * r} cy={cy + c.y * r} r={c.r * r}
            fill="#d6d1c2" stroke="#8b8678" strokeWidth={size * 0.006} opacity={0.45}
          />
        ))}
      </g>

      {/* limb shadow ring */}
      <circle cx={cx} cy={cy} r={r - 0.7} fill="none" stroke="#000" strokeOpacity={0.22} strokeWidth={0.8} />
    </>
  );
}
