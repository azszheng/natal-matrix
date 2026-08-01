// Pure data — no server-only imports. Safe for client components.

// ── Rave Mandala gate sequence ────────────────────────────────────────────────
export const GATE_SEQUENCE: readonly number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42,  3,
  27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48, 57, 32, 50,
  28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38, 54, 61, 60,
] as const;

// ── HD planets ────────────────────────────────────────────────────────────────
export type HdPlanetId =
  | 'sun' | 'earth' | 'northNode' | 'southNode'
  | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

export const HD_PLANET_ORDER: HdPlanetId[] = [
  'sun', 'earth', 'northNode', 'southNode',
  'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

export const HD_PLANET_GLYPH: Record<HdPlanetId, string> = {
  sun:       '☉', earth:     '⊕', northNode: '☊', southNode: '☋',
  moon:      '☽', mercury:   '☿', venus:     '♀', mars:      '♂',
  jupiter:   '♃', saturn:    '♄', uranus:    '♅', neptune:   '♆', pluto:     '♇',
};

// ── Centers ───────────────────────────────────────────────────────────────────
export type CenterId =
  | 'head' | 'ajna' | 'throat' | 'g' | 'heart'
  | 'sacral' | 'spleen' | 'solarPlexus' | 'root';

export const CENTER_LABEL: Record<CenterId, string> = {
  head:        'Head',
  ajna:        'Ajna',
  throat:      'Throat',
  g:           'G',
  heart:       'Heart',
  sacral:      'Sacral',
  spleen:      'Spleen',
  solarPlexus: 'Solar Plexus',
  root:        'Root',
};

export const CENTER_GATES: Record<CenterId, readonly number[]> = {
  head:        [64, 61, 63],
  ajna:        [47, 24,  4, 17, 43, 11],
  throat:      [62, 23, 56, 35, 12, 45, 33,  8, 31, 20, 16],
  g:           [ 1, 13, 25, 46,  2, 15, 10,  7],
  heart:       [21, 40, 26, 51],
  sacral:      [34,  5, 14, 29, 59,  9,  3, 42, 27],
  spleen:      [48, 57, 44, 50, 32, 28, 18],
  solarPlexus: [36, 22, 37, 55, 30, 49,  6],
  root:        [53, 60, 52, 19, 39, 41, 38, 54, 58],
};

export const GATE_CENTER: Map<number, CenterId> = new Map(
  (Object.entries(CENTER_GATES) as [CenterId, readonly number[]][])
    .flatMap(([c, gates]) => gates.map(g => [g, c] as [number, CenterId]))
);

// ── 36 Channels ──────────────────────────────────────────────────────────────
export type Channel = { a: number; b: number; name: string; description: string };

export const CHANNELS: readonly Channel[] = [
  { a: 64, b: 47, name: 'Abstraction',    description: 'Mental pressure to understand; processing memories in search of meaning; the mind busying itself with confusion' },
  { a: 61, b: 24, name: 'Awareness',      description: 'Pressure to know the unknowable; inspiration cycling with doubt; the inner truth seeking expression' },
  { a: 63, b:  4, name: 'Logic',          description: 'Pressure to find logical proof; testing what works; fear of the future driving analysis' },
  { a: 17, b: 62, name: 'Acceptance',     description: 'Organized facts and opinions; the logical mind building cases from available detail' },
  { a: 43, b: 23, name: 'Structuring',    description: 'Breakthrough individual insight seeking words; knowing that can transform or alienate depending on timing' },
  { a: 11, b: 56, name: 'Curiosity',      description: 'The storyteller; ideas becoming narratives; synthesizing experience into meaning and belief' },
  { a: 16, b: 48, name: 'Wavelength',     description: 'Talent through depth; mastery driven by fear of inadequacy; endless preparation and refinement' },
  { a: 20, b: 57, name: 'The Brainwave',  description: 'Intuitive survival intelligence expressed in the moment; direct body knowing bypassing the mind' },
  { a: 33, b: 13, name: 'The Prodigal',   description: 'Withdrawal, reflection, and return; private processing of experience shared outward as wisdom' },
  { a:  8, b:  1, name: 'Inspiration',    description: 'Individual creative contribution; inspiring others through unique self-expression and creative authenticity' },
  { a: 31, b:  7, name: 'The Alpha',      description: 'Leadership by election; the voice chosen to speak for others; the collective spokesperson' },
  { a: 20, b: 10, name: 'Awakening',      description: 'Behavior as authentic self-demonstration; living one\'s design as a waking practice in every action' },
  { a: 12, b: 22, name: 'Openness',       description: 'Social grace and perfect timing; moving through emotional waves toward the right moment to speak' },
  { a: 35, b: 36, name: 'Transitoriness', description: 'Seeking new experience; emotional burnout and renewal; the wisdom of having been there and done that' },
  { a: 45, b: 21, name: 'Money Line',     description: 'Tribal resources and territory; the manager of material goods and community assets' },
  { a: 34, b: 20, name: 'Charisma',       description: 'Power translated directly into action and expression; the Manifesting Generator circuit of doing' },
  { a:  5, b: 15, name: 'Rhythm',         description: 'Natural timing and flow; acceptance of all kinds of people; attunement to life\'s universal rhythm' },
  { a: 14, b:  2, name: 'The Beat',       description: 'Empowering others through directed resources; sacral energy guiding personal purpose and power' },
  { a: 29, b: 46, name: 'Discovery',      description: 'Commitment and perseverance; saying yes to life; being in the right place through body wisdom' },
  { a: 34, b: 10, name: 'Exploration',    description: 'Empowered individuality; following one\'s own convictions regardless of social pressure or expectation' },
  { a: 27, b: 50, name: 'Preservation',   description: 'Nurturing the tribe; altruistic care for future generations; values and responsibility for others' },
  { a: 34, b: 57, name: 'Power',          description: 'Raw survival strength in the present moment; pure intuitive power of the body meeting sacral force' },
  { a: 59, b:  6, name: 'Mating',         description: 'Sexuality and intimacy; dissolving barriers to bond; the reproductive and relational bonding circuit' },
  { a:  9, b: 52, name: 'Determination',  description: 'Concentration and focused effort; the power of repetition and single-pointed attention over time' },
  { a:  3, b: 60, name: 'Mutation',       description: 'Erratic transformation; accepting the limits of change; melancholy as the precursor to genuine mutation' },
  { a: 42, b: 53, name: 'Maturation',     description: 'Cyclical growth; natural development through complete beginnings and endings; seasonal rhythm' },
  { a: 26, b: 44, name: 'Surrender',      description: 'Memory and persuasion in service of the tribe; applying past experience to present collective needs' },
  { a: 51, b: 25, name: 'Initiation',     description: 'Shock and awakening; being singled out by unexpected challenges; the spirit warrior path' },
  { a: 40, b: 37, name: 'Community',      description: 'Bargaining and belonging; agreements within family and tribe; the cost and reward of community bonds' },
  { a: 28, b: 38, name: 'Struggle',       description: 'Finding meaning through struggle; fighting for what truly matters; purpose discovered through adversity' },
  { a: 32, b: 54, name: 'Transformation', description: 'Ambition and fear of failure; transforming material drive into lasting achievement' },
  { a: 18, b: 58, name: 'Judgment',       description: 'Mastery through correction; the joy of improving what exists; perfectionism in service of life' },
  { a: 49, b: 19, name: 'Synthesis',      description: 'Sensitivity to belonging; revolution through values; the tribal need for resources and inclusion' },
  { a: 55, b: 39, name: 'Emoting',        description: 'Spirit and provocation; mood and melancholy; the search for spirit through emotional richness' },
  { a: 30, b: 41, name: 'Recognition',    description: 'Desire and dreams; the fuel of experience-seeking; fantasy as the engine of human wanting' },
] as const;

// ── Derived types ─────────────────────────────────────────────────────────────
export type HdType =
  | 'Generator' | 'Manifesting Generator' | 'Manifestor' | 'Projector' | 'Reflector';

export type HdAuthority =
  | 'Emotional' | 'Sacral' | 'Splenic' | 'Ego-Manifested' | 'Ego-Projected'
  | 'Self-Projected' | 'Mental / Environmental' | 'Lunar';

export type HdDefinition =
  | 'Single' | 'Split' | 'Triple Split' | 'Quadruple Split' | 'None';

export type HdActivation = {
  planet:    HdPlanetId;
  longitude: number;
  gate:      number;
  line:      number;
};

export type HdChart = {
  input:           import('./types').ResolvedBirth;
  designUtc:       string;
  personality:     HdActivation[];
  design:          HdActivation[];
  definedGates:    number[];
  definedChannels: Channel[];
  definedCenters:  CenterId[];
  type:            HdType;
  authority:       HdAuthority;
  profile:         string;
  definition:      HdDefinition;
  strategy:        string;
  notSelf:         string;
  crossGates:      [number, number, number, number];
};
