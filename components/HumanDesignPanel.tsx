'use client';

import { useState } from 'react';
import type { HdChart, HdPlanetId } from '@/lib/astro/humandesign-constants';
import { HD_PLANET_GLYPH, HD_PLANET_ORDER, CENTER_LABEL } from '@/lib/astro/humandesign-constants';
import HumanDesignBodygraph from '@/components/charts/HumanDesignBodygraph';

// ── Derived helpers ──────────────────────────────────────────────────────────

function getCrossType(profile: string): 'Right Angle' | 'Juxtaposition' | 'Left Angle' {
  if (profile === '4/1') return 'Juxtaposition';
  const first = parseInt(profile.split('/')[0], 10);
  return first <= 3 ? 'Right Angle' : 'Left Angle';
}

// ── Content maps ──────────────────────────────────────────────────────────────

const TYPE_SIGNATURE: Record<string, string> = {
  'Generator':             'Satisfaction',
  'Manifesting Generator': 'Satisfaction',
  'Manifestor':            'Peace',
  'Projector':             'Success',
  'Reflector':             'Delight',
};

type ProfileCombo = { title: string; desc: string; phases?: string[] };
const PROFILE_COMBO: Record<string, ProfileCombo> = {
  '1/3': {
    title: 'Investigator / Martyr',
    desc: 'Security comes first — you need solid ground before you can experiment. You research deeply, then test through lived experience. Your mistakes are curriculum, not failure. You\'re building a foundation that can withstand the chaos of real learning.',
  },
  '1/4': {
    title: 'Investigator / Opportunist',
    desc: 'Your research is in service of your relationships. You need to know before sharing, and your expertise finds its home through people you trust. Your network is where your knowledge lands and grows.',
  },
  '2/4': {
    title: 'Hermit / Opportunist',
    desc: 'Your gifts emerge in solitude, but your life operates through relationships. You need time alone to let your natural talents surface — and those same talents are called out by the right people in your network. You don\'t have to reach; the right connections find you.',
  },
  '2/5': {
    title: 'Hermit / Heretic',
    desc: 'Others see practical solutions in you that you may not see in yourself. Your natural genius carries an unconscious reputation. You need solitude to ground yourself, and you\'re most effective when you\'re not trying to be universal — just genuinely yourself.',
  },
  '3/5': {
    title: 'Martyr / Heretic',
    desc: 'Your "failures" are your teaching. You learn through doing, experimenting, and discovering what doesn\'t work — then you carry that practical wisdom into situations where others need real solutions. Your credibility is earned, not inherited.',
  },
  '3/6': {
    title: 'Martyr / Role Model',
    desc: 'The bridge between experimentation and integrated wisdom. Your early life is shaped by trial, error, and unexpected endings — this is your curriculum. Over time, that lived experience becomes the authority of someone who truly knows.',
  },
  '4/1': {
    title: 'Opportunist / Investigator',
    desc: 'The Juxtaposition Cross — a fixed fate. Your path moves between knowing and connecting within a network that feels both stable and fated. You are a bridge between the individual and the collective, and your journey has a destined quality.',
  },
  '4/6': {
    title: 'Opportunist / Role Model',
    desc: 'Your intimate relationships are where wisdom takes root. After mid-life integration, you become an example within your circle — not for the world at large, but for those who truly know you. Your network is both your vehicle and your purpose.',
  },
  '5/1': {
    title: 'Heretic / Investigator',
    desc: 'The practical mystic. Your foundation makes your reputation — people project practical solutions onto you. You need to know deeply before your guidance lands with weight. When it does, it lands for everyone.',
  },
  '5/2': {
    title: 'Heretic / Hermit',
    desc: 'Natural talent under a projected spotlight. Others see universal solutions in your unconscious gifts. You need quiet and solitude to let those gifts emerge on your own terms — not from external pressure.',
  },
  '6/2': {
    title: 'Role Model / Hermit',
    desc: 'Natural talent that becomes a living example. After the three-phase arc, your unhidden genius becomes your teaching — not through effort, but through simply being fully yourself.',
  },
  '6/3': {
    title: 'Role Model / Martyr',
    desc: 'One of the rarest profiles (~2.4% of people). Your life unfolds in three distinct phases: an early period of experimentation and unexpected endings, a middle period of stepping back and integrating, and a final phase of stepping down from the roof as a living model of wisdom earned through real experience.',
    phases: [
      'Phase 1 (birth to ~30): Living like a Line 3 — experimenting, bonding, breaking away, and trying again. This period can feel chaotic and disorienting, but it\'s building the experiential foundation you\'ll teach from later. Every "this didn\'t work" is data.',
      'Phase 2 (~30–50): Stepping back from the world. You observe from a distance, integrating everything you lived in Phase 1. This isn\'t withdrawal — it\'s the necessary ripening. Relationships deepen; randomness fades. You watch, absorb, and slowly become.',
      'Phase 3 (~50+, Chiron Return): Coming down from the roof. Your lived experience becomes example. You don\'t teach through words alone — you teach through who you are. The Role Model fully emerges, and others feel it without explanation.',
    ],
  },
};

const TYPE_CONTENT: Record<string, { tagline: string; description: string; strategyDetail: string }> = {
  'Generator': {
    tagline: 'The life-force of the world.',
    description: 'You have consistent, sustainable sacral energy — the engine the world runs on. You\'re designed to respond rather than initiate: let life bring things to you, notice what makes your gut say "yes," and dive in with full commitment. Forcing yourself to start things from scratch drains you.',
    strategyDetail: 'Before saying yes to things, check your gut first — not your head. The sacral response is pre-verbal: a rising "uh-huh" or a dropping "unh-uh" in your body. Ask yes/no questions out loud if you need to surface it.',
  },
  'Manifesting Generator': {
    tagline: 'Multi-passionate, fast-moving, built to respond then act.',
    description: 'You\'re a hybrid — Generator life-force plus a motor connected to your throat. You can initiate AND respond. You\'re wired to move fast, juggle many things, and skip steps that feel unnecessary. The catch: skipping your sacral gut-check before acting leads to frustration and backtracking.',
    strategyDetail: 'First respond (gut check — does this excite your body?), then move fast. When you backtrack, it\'s not failure — it\'s your process. You\'re also built to inform people before acting, which reduces the friction that follows when you move without warning.',
  },
  'Manifestor': {
    tagline: 'Here to initiate, not to ask permission.',
    description: 'You\'re the only type truly designed to start things independently. You have a motor connected directly to your throat — ideas translate into action without needing a response from life first. Your impact on others is significant and often felt before you\'ve said anything.',
    strategyDetail: 'Inform the people your actions will impact before you act — not to ask permission, but to reduce resistance. "I\'m going to do X" is enough. Manifestors who inform move with much less friction.',
  },
  'Projector': {
    tagline: 'Here to guide, direct, and be recognized.',
    description: 'You\'re a master at reading people and systems. You see inefficiencies and solutions others miss. But you\'re not designed to push your insights on anyone — your wisdom lands when it\'s invited. You don\'t have consistent sacral energy, so working like a Generator leads to burnout.',
    strategyDetail: 'Wait for recognition and invitation before sharing guidance — especially for big life decisions. When invited, your wisdom is received. When you push it, you\'re often met with resistance. Success (not bitterness) is your signal you\'re aligned.',
  },
  'Reflector': {
    tagline: 'A mirror for the community; open to everything.',
    description: 'You\'re rare (~1% of people) — you have no consistently defined energy centers. You sample and reflect the energy of everyone around you, making you unusually sensitive to your environment. You experience yourself differently depending on who you\'re with and where you are.',
    strategyDetail: 'For major decisions, wait a full lunar cycle (28 days). Talk to many different people, visit different environments, journal throughout. By the end of the cycle you\'ll have experienced the full range of perspectives.',
  },
};

const AUTHORITY_CONTENT: Record<string, { description: string; practice: string }> = {
  'Emotional': {
    description: 'Your Solar Plexus center is defined — you run on an emotional wave that cycles between highs and lows. Clarity only comes over time, not in the moment. A "yes" at the peak of excitement is as unreliable as a "yes" at the bottom of disappointment.',
    practice: 'Sleep on it. Then sleep on it again. Check in at different emotional moments before committing. You\'re aiming for emotional neutrality — when the initial charge has settled. The question isn\'t "how do I feel right now?" but "how do I feel about this over time?"',
  },
  'Sacral': {
    description: 'Your gut is your authority. The sacral response is a pre-verbal, body-based "uh-huh" (yes) or "unh-uh" (no) that fires before your mind gets involved. It\'s one of the most reliable decision-making systems in HD — when it\'s not overridden by the mind.',
    practice: 'Practice being asked yes/no questions out loud. Notice the body sensation before you formulate a worded response. The gut speaks first and quickly. If you find yourself analyzing your answer, you\'ve left sacral authority.',
  },
  'Splenic': {
    description: 'Your spleen carries the oldest biological intelligence — survival, intuition, immune awareness. It gives you spontaneous "knowing" in the moment. Unlike the sacral, it doesn\'t repeat itself. It speaks once, quietly.',
    practice: 'Catch the first hit. That quiet first impression is your authority. Your spleen won\'t shout or repeat — if you override it and wait, it goes silent. Practice noticing the very first sense of "off" or "right" before your mind starts building a case.',
  },
  'Ego-Manifested': {
    description: 'Your Ego/Will center is defined and connected to your throat. You\'re designed to make decisions based on what you genuinely want — what your willpower can sustain.',
    practice: 'Ask honestly: "Do I actually want this — not should I want it, but do I want it?" If you have to convince yourself, it\'s probably a no. Your willpower is real and strong, but it only works for things you truly desire.',
  },
  'Ego-Projected': {
    description: 'Your Ego/Will center is defined. Your decisions come from knowing what serves both you and others — what you can commit to from a place of genuine will.',
    practice: 'Ask: "What\'s in this for me?" It\'s not selfish — it\'s honest. Commitments that feel aligned serve you AND others. Ones that don\'t drain your willpower.',
  },
  'Self-Projected': {
    description: 'Your G Center (identity and direction) is your authority. You find your truth by talking out loud — the answer emerges in what you spontaneously say, not in what you think.',
    practice: 'Talk it through with someone you trust — not for their advice, but to hear your own voice. Notice what you say when you\'re not trying to be logical. That unfiltered expression is your truth.',
  },
  'Mental / Environmental': {
    description: 'You have no consistent inner authority. Your decisions come from your environment and your trusted sounding boards over time.',
    practice: 'Visit the physical spaces connected to a decision. Talk it through with different people (not for their opinions — to hear how you respond to different energies). Clarity emerges through exposure and time.',
  },
  'Lunar': {
    description: 'As a Reflector, you have no consistent inner authority. The moon is your clock — as it moves through the wheel each month, you sample all different qualities of energy.',
    practice: 'Wait 28 days for any major decision. Journal daily. Talk to people from different areas of your life. When the cycle completes, you\'ll know what\'s true for you.',
  },
};

const PROFILE_LINE_NAMES: Record<number, string> = {
  1: 'Investigator', 2: 'Hermit', 3: 'Martyr',
  4: 'Opportunist',  5: 'Heretic', 6: 'Role Model',
};

const PROFILE_LINE_DESC: Record<number, string> = {
  1: 'Foundation-seeker. You need solid ground under you — research, mastery, and knowing before you can feel secure. You\'re naturally drawn to investigating and building expertise.',
  2: 'Natural talent, emerging on your terms. Others see your gifts before you do. You need time alone to decompress and let your abilities surface without pressure.',
  3: 'Wisdom through experience. You learn by doing, experimenting, and sometimes failing. What looks like mistakes to others is actually your curriculum. Every "this didn\'t work" is data.',
  4: 'Your network is your foundation. The right opportunities come through relationships, not cold outreach. Intimacy and trust-building are your path to influence.',
  5: 'The practical savior (whether you like it or not). Others project their expectations onto you — they see you as having real-world solutions. Your reputation ripples wide.',
  6: 'Three acts: first ~30 years experimenting like a Line 3; then withdrawal and integration; then 50+ stepping down as a living example. You don\'t need to have it figured out yet.',
};

const DEFINITION_DESC: Record<string, string> = {
  'Single':         'All your defined centers form one continuous circuit. You project a consistent, self-contained energy field.',
  'Split':          'Your defined centers form two separate groups. You\'re drawn to people who bridge your split — they feel stabilizing, sometimes essential.',
  'Triple Split':   'Three separate circuit groups. You need varied environments and types of people to feel whole.',
  'Quadruple Split':'Four separate groups — the rarest definition. You\'re highly independent but thrive with stable community.',
  'None':           'No consistently defined centers. You\'re a Reflector — open to all energy.',
};

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'chart' | 'gates';
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview'  },
  { id: 'chart',    label: 'Bodygraph' },
  { id: 'gates',    label: 'Gates'     },
];

// ── Shared micro-components ───────────────────────────────────────────────────

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 5px', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
      {children}
    </p>
  );
}

function Chip({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 2,
      border: `1px solid ${dim ? 'var(--line)' : 'var(--fg-glyph)'}`,
      fontFamily: 'var(--font-mono)', fontSize: 11,
      color: dim ? 'var(--fg-dim)' : 'var(--fg-glyph)',
      background: dim ? 'transparent' : 'rgba(200,160,80,0.07)',
      letterSpacing: '0.03em',
    }}>
      {label}
    </span>
  );
}

function InfoBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
      <p style={{ margin: '0 0 6px', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Expand({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--fg-dim)', padding: 0,
      }}>
        <span style={{ display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', fontSize: 9 }}>▸</span>
        {open ? 'Show less' : label}
      </button>
      {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

const monoSm: React.CSSProperties = {
  margin: 0, fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', lineHeight: 1.7,
};

const expandBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--fg-dim)', padding: 0,
};

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ chart }: { chart: HdChart }) {
  const [pLine, dLine] = chart.profile.split('/').map(Number);
  const tc = TYPE_CONTENT[chart.type];
  const ac = AUTHORITY_CONTENT[chart.authority];

  const [showType, setShowType] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProf, setShowProf] = useState(false);
  const [showDef,  setShowDef]  = useState(false);

  const definedLabels   = chart.definedCenters.map(c => CENTER_LABEL[c]);
  const undefinedLabels = (Object.keys(CENTER_LABEL) as (keyof typeof CENTER_LABEL)[])
    .filter(c => !chart.definedCenters.includes(c))
    .map(c => CENTER_LABEL[c]);
  const pad = '20px 24px';

  return (
    <div>
      {/* Type hero */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--line)' }}>
        <Lbl>Energy Type</Lbl>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 4px' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 26, color: 'var(--fg)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {chart.type}
          </p>
          <button onClick={() => setShowType(o => !o)} style={{ ...expandBtn, marginTop: 0, fontSize: 11 }}>
            <span style={{ display: 'inline-block', transition: 'transform .15s', transform: showType ? 'rotate(90deg)' : 'none', fontSize: 10 }}>▸</span>
          </button>
        </div>
        {tc && (
          <p style={{ margin: '0 0 14px', fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--fg-muted)', fontStyle: 'italic' }}>
            {tc.tagline}
          </p>
        )}

        {showType && tc && (
          <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <p style={{ ...monoSm, marginBottom: 14 }}>{tc.description}</p>
            <InfoBox label={`Strategy — ${chart.strategy}`}>
              <p style={{ ...monoSm, fontSize: 12 }}>{tc.strategyDetail}</p>
            </InfoBox>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
              <p style={{ ...monoSm, fontSize: 11.5, margin: 0 }}>
                <strong style={{ color: 'var(--fg)' }}>Not-self theme:</strong>{' '}
                {chart.notSelf} — a signal you&apos;re out of alignment.
              </p>
              {TYPE_SIGNATURE[chart.type] && (
                <p style={{ ...monoSm, fontSize: 11.5, margin: 0 }}>
                  <strong style={{ color: 'var(--fg)' }}>Signature:</strong>{' '}
                  {TYPE_SIGNATURE[chart.type]} — the feeling of living in alignment.
                </p>
              )}
            </div>
          </div>
        )}

        {!showType && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7, padding: '5px 12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>Strategy</span>
              <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{chart.strategy}</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7, padding: '5px 12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>Not-self</span>
              <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{chart.notSelf}</span>
            </div>
            {TYPE_SIGNATURE[chart.type] && (
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7, padding: '5px 12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>Signature</span>
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{TYPE_SIGNATURE[chart.type]}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key stats — 3 columns with inline expand */}
      <div style={{ borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>

          {/* Authority */}
          <div style={{ padding: '16px 20px', borderRight: '1px solid var(--line)' }}>
            <Lbl>Inner Authority</Lbl>
            <p style={{ margin: '0 0 3px', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 17, color: 'var(--fg)', lineHeight: 1.15 }}>
              {chart.authority}
            </p>
            <p style={{ margin: 0, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', lineHeight: 1.4 }}>
              Decision-making
            </p>
            <button onClick={() => setShowAuth(o => !o)} style={expandBtn}>
              <span style={{ display: 'inline-block', transition: 'transform .15s', transform: showAuth ? 'rotate(90deg)' : 'none', fontSize: 9 }}>▸</span>
              {showAuth ? 'Less' : 'What is this?'}
            </button>
          </div>

          {/* Profile */}
          <div style={{ padding: '16px 20px', borderRight: '1px solid var(--line)' }}>
            <Lbl>Profile</Lbl>
            <p style={{ margin: '0 0 3px', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 17, color: 'var(--fg)', lineHeight: 1.15 }}>
              {chart.profile}
            </p>
            <p style={{ margin: 0, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', lineHeight: 1.4 }}>
              {PROFILE_LINE_NAMES[pLine]} / {PROFILE_LINE_NAMES[dLine]}
            </p>
            <button onClick={() => setShowProf(o => !o)} style={expandBtn}>
              <span style={{ display: 'inline-block', transition: 'transform .15s', transform: showProf ? 'rotate(90deg)' : 'none', fontSize: 9 }}>▸</span>
              {showProf ? 'Less' : 'What is this?'}
            </button>
          </div>

          {/* Definition */}
          <div style={{ padding: '16px 20px' }}>
            <Lbl>Definition</Lbl>
            <p style={{ margin: '0 0 3px', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 17, color: 'var(--fg)', lineHeight: 1.15 }}>
              {chart.definition}
            </p>
            <p style={{ margin: 0, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', lineHeight: 1.4 }}>
              {DEFINITION_DESC[chart.definition]?.split('.')[0] ?? ''}
            </p>
            <button onClick={() => setShowDef(o => !o)} style={expandBtn}>
              <span style={{ display: 'inline-block', transition: 'transform .15s', transform: showDef ? 'rotate(90deg)' : 'none', fontSize: 9 }}>▸</span>
              {showDef ? 'Less' : 'What is this?'}
            </button>
          </div>
        </div>

        {/* Inline expansion panels */}
        {showAuth && ac && (
          <div style={{ padding: '16px 20px 20px', borderTop: '1px solid var(--line)', background: 'rgba(255,255,255,0.015)' }}>
            <Lbl>Inner Authority — {chart.authority}</Lbl>
            <p style={{ ...monoSm, marginBottom: 14, marginTop: 6 }}>{ac.description}</p>
            <InfoBox label="The Practice">
              <p style={{ ...monoSm, fontSize: 12 }}>{ac.practice}</p>
            </InfoBox>
          </div>
        )}

        {showProf && (
          <div style={{ padding: '16px 20px 20px', borderTop: '1px solid var(--line)', background: 'rgba(255,255,255,0.015)' }}>
            <Lbl>Profile — {chart.profile}</Lbl>
            {PROFILE_COMBO[chart.profile] ? (
              <div style={{ marginTop: 6 }}>
                <p style={{ margin: '0 0 3px', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, color: 'var(--fg)' }}>
                  {PROFILE_COMBO[chart.profile].title}
                </p>
                <p style={{ ...monoSm, marginBottom: PROFILE_COMBO[chart.profile].phases ? 16 : 0, marginTop: 8 }}>
                  {PROFILE_COMBO[chart.profile].desc}
                </p>
                {PROFILE_COMBO[chart.profile].phases && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PROFILE_COMBO[chart.profile].phases!.map((phase, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-glyph)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                          {i + 1}
                        </span>
                        <p style={{ ...monoSm, fontSize: 11.5, margin: 0 }}>{phase}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                  <p style={{ ...monoSm, fontSize: 11, marginBottom: 8, color: 'var(--fg-dim)' }}>
                    Line {pLine} is conscious (how you see yourself) · Line {dLine} is unconscious (what others experience in you)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <InfoBox label={`Line ${pLine} · ${PROFILE_LINE_NAMES[pLine]} — Conscious`}>
                      <p style={{ ...monoSm, fontSize: 11.5 }}>{PROFILE_LINE_DESC[pLine]}</p>
                    </InfoBox>
                    <InfoBox label={`Line ${dLine} · ${PROFILE_LINE_NAMES[dLine]} — Unconscious`}>
                      <p style={{ ...monoSm, fontSize: 11.5 }}>{PROFILE_LINE_DESC[dLine]}</p>
                    </InfoBox>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 6 }}>
                <p style={{ ...monoSm, marginBottom: 14 }}>
                  Your profile comes from the I Ching line of your Personality Sun ({pLine}) and your Design Sun ({dLine}).
                  The first number is your conscious role — how you see yourself. The second is unconscious — what others experience in you.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoBox label={`Line ${pLine} · ${PROFILE_LINE_NAMES[pLine]} — Conscious`}>
                    <p style={{ ...monoSm, fontSize: 12 }}>{PROFILE_LINE_DESC[pLine]}</p>
                  </InfoBox>
                  <InfoBox label={`Line ${dLine} · ${PROFILE_LINE_NAMES[dLine]} — Unconscious`}>
                    <p style={{ ...monoSm, fontSize: 12 }}>{PROFILE_LINE_DESC[dLine]}</p>
                  </InfoBox>
                </div>
              </div>
            )}
          </div>
        )}

        {showDef && (
          <div style={{ padding: '16px 20px 20px', borderTop: '1px solid var(--line)', background: 'rgba(255,255,255,0.015)' }}>
            <Lbl>Definition — {chart.definition}</Lbl>
            <p style={{ ...monoSm, marginTop: 6 }}>{DEFINITION_DESC[chart.definition] ?? ''}</p>
          </div>
        )}
      </div>

      {/* Centers */}
      <div style={{ padding: pad, borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <Lbl>Defined Centers ({chart.definedCenters.length}/9)</Lbl>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {definedLabels.map(l => <Chip key={l} label={l} />)}
          </div>
        </div>
        {undefinedLabels.length > 0 && (
          <div>
            <Lbl>Open / Undefined</Lbl>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {undefinedLabels.map(l => <Chip key={l} label={l} dim />)}
            </div>
          </div>
        )}
      </div>

      {/* Channels */}
      {chart.definedChannels.length > 0 && (
        <div style={{ padding: pad, borderBottom: '1px solid var(--line)' }}>
          <Lbl>Defined Channels ({chart.definedChannels.length})</Lbl>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {chart.definedChannels.map(ch => (
              <div key={`${ch.a}-${ch.b}`}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-glyph)', fontWeight: 600, minWidth: 44 }}>
                    {ch.a}–{ch.b}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg)', fontWeight: 500 }}>
                    {ch.name}
                  </span>
                </div>
                {ch.description && (
                  <p style={{ margin: '0 0 0 56px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
                    {ch.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incarnation Cross */}
      <div style={{ padding: pad }}>
        <Lbl>Incarnation Cross</Lbl>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 4px' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--fg)' }}>
            Gates {chart.crossGates[0]} · {chart.crossGates[1]} / {chart.crossGates[2]} · {chart.crossGates[3]}
          </p>
          <span style={{
            fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)',
            border: '1px solid var(--line)', padding: '2px 7px',
          }}>
            {getCrossType(chart.profile)}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
          Personality Sun · Earth &nbsp;/&nbsp; Design Sun · Earth — your life purpose context
        </p>
      </div>
    </div>
  );
}

// ── Bodygraph tab ─────────────────────────────────────────────────────────────

function ChartTab({ chart }: { chart: HdChart }) {
  const definedLabels   = chart.definedCenters.map(c => CENTER_LABEL[c]);
  const undefinedLabels = (Object.keys(CENTER_LABEL) as (keyof typeof CENTER_LABEL)[])
    .filter(c => !chart.definedCenters.includes(c))
    .map(c => CENTER_LABEL[c]);

  return (
    <div>
      {/* Compact visual legend */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)' }}>
        <Lbl>Chart Key</Lbl>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
              <rect x="2" y="2" width="28" height="28" rx="3"
                fill="var(--fg-glyph)" fillOpacity="0.22"
                stroke="var(--fg-glyph)" strokeWidth="1.5" />
              <text x="16" y="20" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="var(--fg-glyph)" fontWeight="700">CTR</text>
            </svg>
            <div>
              <p style={{ margin: '0 0 1px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)', fontWeight: 600 }}>Defined Center</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-dim)', lineHeight: 1.4 }}>Consistent energy — always yours</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
              <rect x="2" y="2" width="28" height="28" rx="3"
                fill="transparent" stroke="var(--fg-dim)" strokeWidth="1" strokeOpacity="0.45" />
            </svg>
            <div>
              <p style={{ margin: '0 0 1px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)', fontWeight: 600 }}>Undefined Center</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-dim)', lineHeight: 1.4 }}>Open — absorbs others' energy</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
              <rect x="1" y="4" width="12" height="8" rx="2" fill="var(--fg-glyph)" fillOpacity="0.22" stroke="var(--fg-glyph)" strokeWidth="1.2" />
              <line x1="13" y1="8" x2="19" y2="8" stroke="var(--fg-glyph)" strokeWidth="2.5" strokeOpacity="0.9" />
              <rect x="19" y="4" width="12" height="8" rx="2" fill="var(--fg-glyph)" fillOpacity="0.22" stroke="var(--fg-glyph)" strokeWidth="1.2" />
              <text x="7" y="9.5" textAnchor="middle" fontSize="4.5" fontFamily="monospace" fill="var(--fg-glyph)" fontWeight="700">34</text>
              <text x="25" y="9.5" textAnchor="middle" fontSize="4.5" fontFamily="monospace" fill="var(--fg-glyph)" fontWeight="700">20</text>
              <text x="16" y="26" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="var(--fg-glyph)" fontWeight="600">34–20</text>
            </svg>
            <div>
              <p style={{ margin: '0 0 1px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)', fontWeight: 600 }}>Defined Channel</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-dim)', lineHeight: 1.4 }}>Active circuit; gate numbers at each end</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
              <rect x="1" y="4" width="12" height="8" rx="2" fill="transparent" stroke="var(--fg-dim)" strokeWidth="1" strokeOpacity="0.35" />
              <line x1="13" y1="8" x2="19" y2="8" stroke="var(--fg-dim)" strokeWidth="1" strokeOpacity="0.35" />
              <rect x="19" y="4" width="12" height="8" rx="2" fill="transparent" stroke="var(--fg-dim)" strokeWidth="1" strokeOpacity="0.35" />
              <text x="16" y="26" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="var(--fg-dim)" opacity="0.4">inactive</text>
            </svg>
            <div>
              <p style={{ margin: '0 0 1px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)', fontWeight: 600 }}>Potential Channel</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-dim)', lineHeight: 1.4 }}>Pathway exists but not activated</p>
            </div>
          </div>

        </div>
      </div>

      {/* The bodygraph */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'center' }}>
        <HumanDesignBodygraph chart={chart} />
      </div>

      {/* Channels + Centers side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--line)' }}>
        <div style={{ padding: '18px 20px', borderRight: '1px solid var(--line)' }}>
          <Lbl>Defined Centers ({chart.definedCenters.length}/9)</Lbl>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {definedLabels.map(l => <Chip key={l} label={l} />)}
          </div>
          {undefinedLabels.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <Lbl>Open</Lbl>
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {undefinedLabels.map(l => <Chip key={l} label={l} dim />)}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '18px 20px' }}>
          <Lbl>Defined Channels</Lbl>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chart.definedChannels.map(ch => (
              <div key={`${ch.a}-${ch.b}`} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-glyph)', fontWeight: 600, minWidth: 38 }}>
                  {ch.a}–{ch.b}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-muted)' }}>
                  {ch.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9 Centers reference */}
      <div style={{ padding: '18px 24px' }}>
        <Expand label="9 Centers reference">
          <div style={{ border: '1px solid var(--line)', overflow: 'hidden' }}>
            {([
              ['head',        'Head',         'Inspiration · pressure to think'],
              ['ajna',        'Ajna',          'Conceptualization · opinions'],
              ['throat',      'Throat',        'Communication · action · manifestation'],
              ['g',           'G Center',      'Identity · direction · love'],
              ['heart',       'Heart / Will',  'Willpower · ego · resources'],
              ['solarPlexus', 'Solar Plexus',  'Emotions · feelings · desire'],
              ['sacral',      'Sacral',        'Life-force · sexuality · response'],
              ['spleen',      'Spleen',        'Intuition · survival · immune system'],
              ['root',        'Root',          'Pressure · stress · adrenaline'],
            ] as [string, string, string][]).map(([id, name, domain]) => {
              const defined = chart.definedCenters.includes(id as never);
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--line)', background: defined ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, flexShrink: 0, background: defined ? 'var(--fg-glyph)' : 'transparent', border: `1px solid ${defined ? 'var(--fg-glyph)' : 'var(--fg-dim)'}`, opacity: defined ? 0.85 : 0.35 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: defined ? 'var(--fg)' : 'var(--fg-dim)', fontWeight: defined ? 600 : 400, minWidth: 88 }}>{name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' }}>{domain}</span>
                  {defined && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--fg-glyph)', textTransform: 'uppercase' }}>defined</span>}
                </div>
              );
            })}
          </div>
        </Expand>
      </div>
    </div>
  );
}

// ── Gates tab ─────────────────────────────────────────────────────────────────

function GatesTab({ chart }: { chart: HdChart }) {
  const [side, setSide] = useState<'both' | 'personality' | 'design'>('both');
  const activations = side === 'personality' ? chart.personality : side === 'design' ? chart.design : null;
  const designDate = new Date(chart.designUtc).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

  function planetCell(planet: HdPlanetId, list: typeof chart.personality, isDesign: boolean) {
    const a = list.find(x => x.planet === planet)!;
    const isActive = chart.definedGates.includes(a.gate);
    return (
      <td key={planet} style={{
        padding: '6px 8px', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: isActive ? 'var(--fg-glyph)' : 'var(--fg-dim)',
        borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
        background: isDesign ? 'rgba(100,80,40,0.08)' : 'transparent',
      }}>
        {a.gate}<span style={{ fontSize: 9, opacity: 0.65 }}>.{a.line}</span>
      </td>
    );
  }

  return (
    <div>
      {/* Intro */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <Lbl>Gate Activations</Lbl>
        <p style={{ ...monoSm, marginTop: 6 }}>
          Each planet activates a specific Gate (I Ching hexagram 1–64) and Line (1–6).
          <strong style={{ color: 'var(--fg)' }}> Highlighted gates</strong> form complete Channels in your chart.
          Personality (●) = conscious; Design (◆) = unconscious.
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {(['both', 'personality', 'design'] as const).map(s => (
            <button key={s} onClick={() => setSide(s)} style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
              letterSpacing: '0.07em', background: 'none', borderRadius: 1,
              border: `1px solid ${side === s ? 'var(--fg-glyph)' : 'var(--line)'}`,
              color: side === s ? 'var(--fg-glyph)' : 'var(--fg-muted)',
              padding: '4px 10px', cursor: 'pointer',
            }}>
              {s === 'both' ? 'Both' : s === 'personality' ? 'Personality ●' : 'Design ◆'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderBottom: '1px solid var(--line)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-dim)', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)' }}>
                Side
              </th>
              {HD_PLANET_ORDER.map(p => (
                <th key={p} style={{ padding: '7px 4px', textAlign: 'center', fontSize: 14, color: 'var(--fg-muted)', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)', fontWeight: 'normal' }}>
                  {HD_PLANET_GLYPH[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(activations
              ? [{ label: side === 'design' ? 'Design ◆' : 'Personality ●', list: activations, isDesign: side === 'design' }]
              : [
                  { label: 'Personality ●', list: chart.personality, isDesign: false },
                  { label: 'Design ◆',      list: chart.design,      isDesign: true  },
                ]
            ).map(({ label, list, isDesign }) => (
              <tr key={label}>
                <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDesign ? 'var(--accent)' : 'var(--fg-muted)', borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', background: isDesign ? 'rgba(100,80,40,0.08)' : 'transparent' }}>
                  {label}
                </td>
                {HD_PLANET_ORDER.map(p => planetCell(p, list, isDesign))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cross + design date */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Lbl>Incarnation Cross</Lbl>
          <p style={{ margin: '4px 0 3px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--fg)' }}>
            Gates {chart.crossGates[0]} · {chart.crossGates[1]} / {chart.crossGates[2]} · {chart.crossGates[3]}
          </p>
          <p style={{ ...monoSm, fontSize: 11.5 }}>
            The four gates at your Personality Sun/Earth and Design Sun/Earth. Together they describe your overarching life purpose — the context in which your Type and Authority express.
          </p>
        </div>
        <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <Lbl>Design Crystal imprinted</Lbl>
          <p style={{ ...monoSm, marginTop: 4, fontSize: 12 }}>
            {designDate} — calculated at 88° of solar arc before birth (~3 months).
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function HumanDesignPanel({ chart }: { chart: HdChart }) {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div style={{ background: 'var(--bg-raised)', display: 'flex', flexDirection: 'column' }}>

      {/* Sticky tab bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 2,
        background: 'var(--bg-raised)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
      }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '12px 6px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === id ? 'var(--fg-glyph)' : 'transparent'}`,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: tab === id ? 'var(--fg)' : 'var(--fg-dim)',
              transition: 'color .15s, border-color .15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab chart={chart} />}
      {tab === 'chart'    && <ChartTab    chart={chart} />}
      {tab === 'gates'    && <GatesTab    chart={chart} />}

    </div>
  );
}
