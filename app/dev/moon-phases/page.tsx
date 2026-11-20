import { notFound } from 'next/navigation';
import MoonPhasePreview from './MoonPhasePreview';

// Development-only preview for the NatalMoonIcon feature — not reachable
// in production.
export default function MoonPhasesDevPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <MoonPhasePreview />;
}
