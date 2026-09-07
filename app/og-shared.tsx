import { ImageResponse } from 'next/og';

const BG = '#0c0a08';
const FG = '#ece4d3';
const FG_MUTED = '#b0a48c';
const ACCENT = '#c9a44c';
const LINE = '#3a3225';

export function renderBrandImage(size: { width: number; height: number }) {
  const ringSize = size.width * 0.85;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -ringSize * 0.32,
            right: -ringSize * 0.32,
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            border: `${Math.max(1, size.width * 0.0025)}px solid ${LINE}`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -ringSize * 0.18,
            right: -ringSize * 0.18,
            width: ringSize * 0.72,
            height: ringSize * 0.72,
            borderRadius: '50%',
            border: `${Math.max(1, size.width * 0.0025)}px solid ${ACCENT}`,
            opacity: 0.5,
            display: 'flex',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: size.height * 0.045,
            padding: `0 ${size.width * 0.08}px`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: size.height * 0.048,
              fontWeight: 600,
              letterSpacing: size.height * 0.012,
              textTransform: 'uppercase',
              color: ACCENT,
            }}
          >
            Western + Vedic Astrology
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: size.height * 0.155,
              fontWeight: 600,
              color: FG,
              letterSpacing: size.height * 0.002,
            }}
          >
            Natal Matrix
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: size.height * 0.045,
              color: FG_MUTED,
              maxWidth: size.width * 0.72,
            }}
          >
            Rigorously accurate birth charts, illuminated by AI
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

export function renderMonogramIcon(size: { width: number; height: number }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: size.width * 0.82,
            height: size.height * 0.82,
            borderRadius: '50%',
            border: `${Math.max(1, size.width * 0.035)}px solid ${ACCENT}`,
            display: 'flex',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: size.height * 0.5,
            fontWeight: 600,
            color: FG,
          }}
        >
          N
        </div>
      </div>
    ),
    { ...size },
  );
}
