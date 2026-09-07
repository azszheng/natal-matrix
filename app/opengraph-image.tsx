import { renderBrandImage } from './og-shared';

export const alt = 'Natal Matrix — Western + Vedic Astrology';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return renderBrandImage(size);
}
