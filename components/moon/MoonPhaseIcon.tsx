'use client';

import { useId } from 'react';

const TEXTURE_SRC = '/assets/moon/moon-texture.png';

type Props = {
  /** 0 (new) to 1 (full) */
  illuminatedFraction: number;
  /** true = waxing (lit on the right limb), false = waning (lit on the left) — standard Northern Hemisphere view */
  isWaxing: boolean;
  /** px, 32-256 supported */
  size?: number;
  className?: string;
};

/**
 * Pure presentational renderer — takes illumination facts, not a chart.
 *
 * Terminator geometry: the illuminated silhouette is the limb half-disk
 * (left or right half of the circle, depending on waxing/waning) combined
 * with a terminator ellipse centered on the disk's own center — rx shrinks
 * from r (full disk, at Full Moon) to 0 (a line, at New Moon/quarter) as
 * illumination drops, and ry is always r. For gibbous/full phases the lit
 * region is the UNION of the half-disk and the ellipse (SVG clipPath
 * children union by spec); for crescent phases it is the INTERSECTION of
 * the half-disk and the ellipse, which a single clipPath cannot express
 * (its children only union) — intersection instead requires two separate
 * clipPaths applied via nested <g> elements, each one clipping the result
 * of the one before it.
 *
 * This is applied to the real photographic lunar texture instead of flat
 * fill colors: a dim/desaturated copy of the texture for the full disk (so
 * the unlit portion still reads as a faint dark sphere, not a void), with a
 * full-brightness copy of the SAME texture clipped to the illuminated
 * silhouette layered on top. The texture itself never changes between
 * phases — only which portion of it is shown at full brightness.
 */
export default function MoonPhaseIcon({ illuminatedFraction, isWaxing, size = 96, className }: Props) {
  const rawId = useId().replace(/[:]/g, '');
  const r = size / 2;
  const cx = r, cy = r;

  const k = Math.max(0, Math.min(1, illuminatedFraction));
  const t = 2 * k - 1; // cos(phase angle): -1 new, 0 quarter, 1 full
  const termRx = r * Math.abs(t);
  const isGibbousOrFull = k >= 0.5;
  const litRight = isWaxing;

  const diskClip  = `${rawId}-disk`;
  const unionClip = `${rawId}-union`; // gibbous/full: half-disk ∪ terminator ellipse
  const halfClip  = `${rawId}-half`;  // crescent: half-disk ∩ terminator ellipse (two clips)
  const ellClip   = `${rawId}-ell`;
  const blur      = `${rawId}-blur`;

  const halfRect = <rect x={litRight ? cx : 0} y={0} width={r} height={size} />;
  const termEllipse = <ellipse cx={cx} cy={cy} rx={termRx} ry={r} />;

  // Applies the lit-silhouette clip to `children`, using a union (one clipPath,
  // two children) for gibbous/full or an intersection (two nested clipPaths)
  // for crescent/new.
  function applyLitClip(children: React.ReactNode) {
    if (isGibbousOrFull) {
      return <g clipPath={`url(#${unionClip})`}>{children}</g>;
    }
    return (
      <g clipPath={`url(#${halfClip})`}>
        <g clipPath={`url(#${ellClip})`}>{children}</g>
      </g>
    );
  }

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} role="img" aria-label="Natal Moon phase"
    >
      <defs>
        <clipPath id={diskClip}><circle cx={cx} cy={cy} r={r - 0.5} /></clipPath>
        {isGibbousOrFull ? (
          <clipPath id={unionClip}>
            {halfRect}
            {termEllipse}
          </clipPath>
        ) : (
          <>
            <clipPath id={halfClip}>{halfRect}</clipPath>
            <clipPath id={ellClip}>{termEllipse}</clipPath>
          </>
        )}
        <filter id={blur} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={Math.max(1.4, size * 0.035)} />
        </filter>
      </defs>

      {/* Subtle illuminated-edge glow — confined to the lit silhouette, blurred outward */}
      <g filter={`url(#${blur})`} opacity={0.5}>
        {applyLitClip(<circle cx={cx} cy={cy} r={r} fill="#f4e4c4" />)}
      </g>

      {/* Dim unlit base disk — same texture, darkened (earthshine-style), always full circle */}
      <g clipPath={`url(#${diskClip})`}>
        <image
          href={TEXTURE_SRC} x={0} y={0} width={size} height={size}
          preserveAspectRatio="xMidYMid slice"
          style={{ filter: 'brightness(0.24) saturate(0.55)' }}
        />
      </g>

      {/* Bright lit region — same texture, full brightness, clipped to the illuminated silhouette */}
      <g clipPath={`url(#${diskClip})`}>
        {applyLitClip(
          <image href={TEXTURE_SRC} x={0} y={0} width={size} height={size} preserveAspectRatio="xMidYMid slice" />
        )}
      </g>

      {/* Thin rim to keep the disk crisp at small sizes */}
      <circle cx={cx} cy={cy} r={r - 0.6} fill="none" stroke="rgba(20,14,8,0.18)" strokeWidth={Math.max(0.6, size * 0.006)} />
    </svg>
  );
}
