import type { SignId } from './types';

export type SignEvolution = {
  symbol: string;
  label:  string;
  description: string;
};

export type SignData = {
  id: SignId;
  name: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  modality: 'cardinal' | 'fixed' | 'mutable';
  ruler: string;
  keywords: string[];
  evolutions: [SignEvolution, SignEvolution, SignEvolution];
  positive: string[];
  shadow: string[];
  essence: string;
};

export const SIGN_DATA: Record<SignId, SignData> = {
  aries: {
    id: 'aries', name: 'Aries',
    element: 'fire', modality: 'cardinal', ruler: 'Mars',
    keywords: ['initiative', 'courage', 'independence', 'urgency', 'identity'],
    evolutions: [
      {
        symbol: '🐏',
        label: 'The Ram',
        description: 'At this stage, Aries is pure unchecked impulse — charging headfirst at whatever catches its attention without pausing to consider consequences. Every slight becomes a battle, every obstacle a personal challenge. The Ram acts first and deals with the fallout later, burning through relationships and opportunities with restless aggression. It mistakes reaction for strength and confuses being loud with being right.',
      },
      {
        symbol: '⚔️',
        label: 'The Knight',
        description: 'The evolved Aries learns to aim its fire at something worth fighting for. The Knight still possesses all of the Ram\'s raw courage, but now channels it outward in service of others rather than purely for the self. It develops a sense of honor — an understanding that being first matters less than being right, that strength only means something when it protects rather than demolishes. This is Aries discovering that courage has a moral dimension.',
      },
      {
        symbol: '🔥',
        label: 'The Hero',
        description: 'At its highest expression, Aries achieves true self-mastery — not by suppressing its fire, but by learning when to ignite and when to hold back. The Hero acts from a place of clarity rather than reaction, initiating change that serves the larger whole. It inspires others not through force but through the sheer contagious quality of its conviction. This is the Aries that starts movements, not fights — the one whose urgency everyone else finally understands.',
      },
    ],
    positive: ['Bold and courageous', 'Pioneering and original', 'Energetic and passionate', 'Direct and honest', 'Natural leader', 'Quick to act and decide'],
    shadow:   ['Impulsive and reckless', 'Self-centered', 'Easily frustrated', 'Short temper', 'Struggles to finish what it starts', 'Competitive to a fault'],
    essence: 'Aries is the spark that starts the fire — pure unfiltered will to exist. At its best, that urgency becomes courage that moves the world. At its worst, it burns everything around it chasing its own momentum.',
  },

  taurus: {
    id: 'taurus', name: 'Taurus',
    element: 'earth', modality: 'fixed', ruler: 'Venus',
    keywords: ['stability', 'beauty', 'patience', 'sensuality', 'persistence'],
    evolutions: [
      {
        symbol: '🐂',
        label: 'The Bull',
        description: 'At this stage, Taurus relates to the material world through fear rather than appreciation. It accumulates — money, possessions, routines, relationships — not out of genuine enjoyment but out of a deep anxiety about scarcity. The Bull is possessive because it believes security can be hoarded, and it resists change so fiercely that it misses out on the very richness it craves. Stubbornness here is not strength; it\'s a refusal to let life move.',
      },
      {
        symbol: '🏗️',
        label: 'The Builder',
        description: 'The evolved Taurus understands that patience is a form of power. The Builder creates with intention — whether it\'s a home, a business, a garden, a piece of art, or a long friendship. It has learned to value the process as much as the product, to find genuine pleasure in craft and in the slow accumulation of something that lasts. This is Taurus discovering that its greatest talent isn\'t holding things, it\'s making them real.',
      },
      {
        symbol: '🌱',
        label: 'The Earth Keeper',
        description: 'At its highest expression, Taurus becomes a steward — of beauty, of resources, of the living world. The Earth Keeper gives as freely as it receives, having understood that abundance flows through rather than stops at the self. It is fully present in the body, genuinely delighting in the physical world without grasping at it. This Taurus teaches everyone around it how to slow down, to savor, and to recognize that presence itself — unhurried, embodied, grateful — is the greatest wealth.',
      },
    ],
    positive: ['Loyal and dependable', 'Patient and steadfast', 'Sensually aware', 'Practical and grounded', 'Artistic eye', 'Deeply committed'],
    shadow:   ['Stubborn and inflexible', 'Possessive', 'Materialistic', 'Resistant to change', 'Prone to overindulgence', 'Slow to forgive'],
    essence: 'Taurus knows that real things take time. It builds slowly, savors completely, and holds on — sometimes beautifully, sometimes too tightly. Its deepest gift is teaching the world that presence itself is wealth.',
  },

  gemini: {
    id: 'gemini', name: 'Gemini',
    element: 'air', modality: 'mutable', ruler: 'Mercury',
    keywords: ['curiosity', 'communication', 'adaptability', 'wit', 'duality'],
    evolutions: [
      {
        symbol: '🃏',
        label: 'The Trickster',
        description: 'At this stage, Gemini\'s duality is a liability. It says one thing and means another, starts ten projects and finishes none, collects information the way others collect objects — not to understand but to feel stimulated. The Trickster is easily bored and allergic to depth, mistaking novelty for intelligence and busyness for purpose. Its charm makes it easy to forgive, which is exactly why it keeps getting away with the same patterns.',
      },
      {
        symbol: '📡',
        label: 'The Messenger',
        description: 'The evolved Gemini discovers the real power of its nature: it can move between worlds — between disciplines, between people, between ideas — and make connections that others simply cannot see. The Messenger becomes a translator, not just of language but of concepts, carrying insight from one domain and depositing it in another where it\'s desperately needed. Its restlessness is no longer an escape from depth; it\'s the engine of genuine discovery.',
      },
      {
        symbol: '📚',
        label: 'The Teacher',
        description: 'At its highest expression, Gemini synthesizes everything it has gathered into something it can offer. The Teacher doesn\'t just accumulate knowledge — it transforms it, distills it, and hands it back in a form that others can use. This is the Gemini who writes the book, builds the bridge between two communities, or explains the difficult thing in a way that finally makes it land. Its duality becomes its greatest gift: it can hold two truths at once and help others do the same.',
      },
    ],
    positive: ['Quick and versatile', 'Intellectually curious', 'Charming and witty', 'Excellent communicator', 'Adaptable', 'Brings people together'],
    shadow:   ['Inconsistent', 'Superficial', 'Restless and scattered', 'Can be duplicitous', 'Avoids depth', 'Overthinks everything'],
    essence: 'Gemini lives where two things meet — ideas collide, people connect, and nothing stays still for long. Its restlessness can look like unreliability, but at its core it is an insatiable love of how minds work and how words create worlds.',
  },

  cancer: {
    id: 'cancer', name: 'Cancer',
    element: 'water', modality: 'cardinal', ruler: 'Moon',
    keywords: ['nurturing', 'intuition', 'memory', 'protection', 'belonging'],
    evolutions: [
      {
        symbol: '🦀',
        label: 'The Crab',
        description: 'At this stage, Cancer\'s sensitivity is turned defensively inward. The Crab retreats into its shell at the first sign of emotional threat, emerging only when it\'s sure the environment is safe — which it almost never is. It clings to people and to the past, because both feel safer than the uncertainty of the present. Its moods can be overwhelming to those around it, and it communicates indirectly, hurt that no one can read its mind without ever having let anyone in.',
      },
      {
        symbol: '🏡',
        label: 'The Nurturer',
        description: 'The evolved Cancer turns its profound emotional attunement outward and discovers that its greatest power is the ability to make others feel genuinely safe. The Nurturer creates containers — homes, friendships, families, spaces — where people can soften their defenses and be themselves. It still feels deeply, but it has learned to process emotion rather than be swept away by it, to offer care without losing itself in the giving.',
      },
      {
        symbol: '🌊',
        label: 'The Mystic',
        description: 'At its highest expression, Cancer\'s sensitivity becomes a form of direct access to the deeper currents running beneath ordinary life. The Mystic moves through the world with one ear tuned to what is unsaid, what is unresolved, what is crying out for acknowledgment. It can hold space for the most difficult emotional terrain — grief, fear, longing — without flinching or needing to fix. This is Cancer as a healer, a guardian of memory, a keeper of the invisible things that hold communities together.',
      },
    ],
    positive: ['Deeply empathic', 'Loyal and protective', 'Intuitive', 'Emotionally intelligent', 'Nurturing and warm', 'Strong memory and sense of history'],
    shadow:   ['Moody and withdrawn', 'Overly sensitive', 'Clingy or smothering', 'Holds grudges', 'Indirect communication', 'Struggles to let go'],
    essence: 'Cancer feels everything first and thinks about it later. Its sensitivity is both its superpower and its wound — it can read a room in seconds and build the warmest home imaginable, but it needs to learn that not every feeling is a prophecy.',
  },

  leo: {
    id: 'leo', name: 'Leo',
    element: 'fire', modality: 'fixed', ruler: 'Sun',
    keywords: ['radiance', 'creativity', 'pride', 'generosity', 'performance'],
    evolutions: [
      {
        symbol: '🐱',
        label: 'The Cub',
        description: 'At this stage, Leo\'s hunger for recognition is insatiable and exhausting. The Cub performs constantly — crafting an image, managing perceptions, measuring its worth by whether the room is watching. Any absence of applause registers as rejection, and it will sulk spectacularly until attention is restored. The tragedy is that underneath all this need is a genuinely warm heart; the Cub has just confused love with validation, and doesn\'t yet know how to offer one without demanding the other.',
      },
      {
        symbol: '🦁',
        label: 'The Lion',
        description: 'The evolved Leo discovers that confidence doesn\'t need to compete. The Lion has earned its authority through genuine generosity — it gives warmth, praise, encouragement, and loyalty without keeping score. It still loves to be admired, but it no longer needs admiration to function. It leads by example, radiating a calm certainty that draws people toward it not because it demands attention, but because it makes everyone around it feel seen and valued.',
      },
      {
        symbol: '☀️',
        label: 'The Sun',
        description: 'At its highest expression, Leo creates not for recognition but because creation is its nature — as natural and effortless as the sun casting light. The Sun has nothing left to prove and nothing left to fear, so it gives freely and completely: warmth, creativity, inspiration, joy. It doesn\'t shine to be noticed; it shines because that\'s what it does. In this evolution, Leo becomes a force that genuinely lights up the lives of everyone in its orbit, making the world more alive simply by being fully itself.',
      },
    ],
    positive: ['Warm and generous', 'Natural leader', 'Creative and expressive', 'Loyal', 'Confident and magnetic', 'Playful and theatrical'],
    shadow:   ['Prideful and arrogant', 'Needs constant validation', 'Domineering', 'Can be dramatic', 'Struggles to share the spotlight', 'Stubborn'],
    essence: 'Leo is the sun asking permission to shine — and slowly realizing it doesn\'t need to. Its deepest work is learning that true radiance comes from giving rather than receiving, and that the most magnetic thing it can do is be completely, unapologetically itself.',
  },

  virgo: {
    id: 'virgo', name: 'Virgo',
    element: 'earth', modality: 'mutable', ruler: 'Mercury',
    keywords: ['precision', 'service', 'analysis', 'improvement', 'health'],
    evolutions: [
      {
        symbol: '🔍',
        label: 'The Critic',
        description: 'At this stage, Virgo\'s analytical mind becomes a weapon turned inward as much as outward. The Critic can see exactly what\'s wrong with any situation, any person, any plan — including itself. It gets stuck in loops of analysis, always refining but never quite arriving, always preparing but never quite ready. Anxiety hums underneath everything. It serves, but from a place of inadequacy rather than genuine care, and its nitpicking exhausts both itself and the people who love it.',
      },
      {
        symbol: '⚕️',
        label: 'The Healer',
        description: 'The evolved Virgo turns its diagnostic precision into a genuine gift. The Healer understands systems — the body, the workplace, the relationship, the process — well enough to identify exactly where the friction is and how to ease it. It still notices imperfection, but now with a kind of compassionate pragmatism rather than judgment. Service becomes meaningful rather than obligatory, and the attention to detail that once paralyzed becomes the thing people come to rely on.',
      },
      {
        symbol: '🌿',
        label: 'The Sage',
        description: 'At its highest expression, Virgo integrates the intelligence of the mind with the wisdom of the body and arrives at something quietly profound. The Sage has made peace with imperfection — not by lowering standards, but by understanding that wholeness includes the flaws. It serves from a place of genuine fullness rather than compulsive need, finding the sacred in small daily acts: the well-made meal, the carefully tended garden, the conversation that leaves someone feeling truly heard.',
      },
    ],
    positive: ['Analytical and precise', 'Reliable and hardworking', 'Detail-oriented', 'Service-minded', 'Practical problem-solver', 'Deeply observant'],
    shadow:   ['Overcritical — of self and others', 'Prone to anxiety', 'Perfectionism that paralyzes', 'Overthinks', 'Can be nitpicky', 'Difficulty with uncertainty'],
    essence: 'Virgo came here to make things better — the world, the body, the process, the relationship. Its restlessness with imperfection is a form of love. The shadow is that it turns that same ruthless eye on itself and forgets that wholeness includes the flaws.',
  },

  libra: {
    id: 'libra', name: 'Libra',
    element: 'air', modality: 'cardinal', ruler: 'Venus',
    keywords: ['balance', 'relationship', 'justice', 'beauty', 'harmony'],
    evolutions: [
      {
        symbol: '⚖️',
        label: 'The Scales (tipped)',
        description: 'At this stage, Libra is so terrified of conflict that it has essentially outsourced its sense of self to whoever it\'s with. The Scales are never at rest — there\'s always the anxiety of not knowing what the other person wants, of having said the wrong thing, of somehow tipping the balance. Decisions are agony. Disagreement is crisis. What looks like diplomacy is often just people-pleasing dressed up as consideration, and over time the accumulated unspoken preferences curdle into quiet resentment.',
      },
      {
        symbol: '🕊️',
        label: 'The Diplomat',
        description: 'The evolved Libra discovers that genuine harmony requires honesty, not just agreeableness. The Diplomat has learned to hold its own position while remaining genuinely open to others\', to advocate for fairness without being servile, to create beauty and peace in relationships as an active practice rather than a passive avoidance of friction. It becomes the person in any room who can hold opposing views with grace and help people find common ground they couldn\'t locate on their own.',
      },
      {
        symbol: '🏛️',
        label: 'The Judge',
        description: 'At its highest expression, Libra embodies true justice — not as an abstract principle but as a lived practice rooted in genuine inner equilibrium. The Judge has developed enough self-knowledge and inner security that its decisions no longer depend on who\'s watching or whose feelings might be hurt. It can see clearly, weigh carefully, and act with integrity. This is the Libra that builds lasting things — lasting relationships, lasting institutions, lasting beauty — because it has learned to create from its own center rather than from other people\'s expectations.',
      },
    ],
    positive: ['Fair and impartial', 'Charming and gracious', 'Relationship-oriented', 'Aesthetic sensibility', 'Diplomatic', 'Sees multiple perspectives'],
    shadow:   ['Indecisive', 'Conflict-avoidant', 'People-pleasing at the expense of authenticity', 'Can be superficial', 'Passive-aggressive', 'Struggles to be alone'],
    essence: 'Libra experiences itself through others — mirroring, harmonizing, weighing. Its gift is the rare ability to hold two truths at once. Its wound is forgetting that it is also one of the truths on the scale.',
  },

  scorpio: {
    id: 'scorpio', name: 'Scorpio',
    element: 'water', modality: 'fixed', ruler: 'Pluto',
    keywords: ['depth', 'transformation', 'power', 'intensity', 'truth'],
    evolutions: [
      {
        symbol: '🦂',
        label: 'The Scorpion',
        description: 'At this stage, Scorpio\'s power turns in on itself. The Scorpion is reactive and secretive, collecting information about others while revealing nothing of itself, keeping meticulous tabs on every perceived betrayal. When it feels threatened — which is often — it stings, sometimes destroying what it most values in the process. Control is its primary language. Beneath the intensity is an enormous fear of vulnerability, and the Scorpion has concluded that the safest thing to do is to strike first.',
      },
      {
        symbol: '🦅',
        label: 'The Eagle',
        description: 'The evolved Scorpio rises above the emotional underworld it once inhabited and gains genuine perspective. The Eagle still sees everything — it misses nothing about human nature, nothing about what people are really feeling, nothing about the hidden currents beneath any situation — but now it uses that perception as a gift rather than a weapon. It has transformed its own pain into hard-won wisdom, and it applies that wisdom with a surgeon\'s precision: when to cut, when to hold, when to descend and when to soar.',
      },
      {
        symbol: '🔥',
        label: 'The Phoenix',
        description: 'At its highest expression, Scorpio has died and been reborn — not metaphorically but through lived experience that dismantled its old self and rebuilt it from the ground up. The Phoenix carries no illusions about the darkness in the world or in the self, and it fears none of it, because it has passed through the worst and emerged changed. It lives with a kind of radical authenticity that is rare and unmistakable. This Scorpio doesn\'t just survive — it transforms, and in doing so, it becomes a living proof that the most devastating experiences can become the source of the deepest power.',
      },
    ],
    positive: ['Deeply perceptive', 'Intensely loyal', 'Psychologically sharp', 'Resilient', 'Magnetic', 'Capable of profound transformation'],
    shadow:   ['Jealous and possessive', 'Controlling', 'Holds grudges deeply', 'Secretive and suspicious', 'Can be manipulative', 'All-or-nothing thinking'],
    essence: 'Scorpio descends where others won\'t go. It knows that the deepest truths live in the places people are afraid to look — grief, desire, death, power. The wound is that intensity can become a weapon. The gift is that nothing real scares it.',
  },

  sagittarius: {
    id: 'sagittarius', name: 'Sagittarius',
    element: 'fire', modality: 'mutable', ruler: 'Jupiter',
    keywords: ['expansion', 'philosophy', 'freedom', 'truth', 'adventure'],
    evolutions: [
      {
        symbol: '🏇',
        label: 'The Centaur',
        description: 'At this stage, Sagittarius is half-tamed and half-wild, and it hasn\'t figured out which half is in charge. The Centaur chases the horizon impulsively — overcommitting, overpromising, and leaving a trail of unfinished plans behind it. It tells the truth, but without consideration for timing or impact. It philosophizes loudly from a position of experience it hasn\'t yet earned. Its optimism is genuine but untested, and its freedom matters so much that it will sabotage anything that threatens to pin it down.',
      },
      {
        symbol: '🏹',
        label: 'The Archer',
        description: 'The evolved Sagittarius learns to aim. The Archer has developed the discipline to distinguish between genuine philosophical exploration and restless escapism, between honest directness and careless tactlessness. It still loves freedom, but now understands that real freedom comes from having something worth striving toward. Its truth-telling becomes more precise — it speaks not just what it believes but what genuinely needs to be heard. It travels, learns, expands, and brings back something of value each time.',
      },
      {
        symbol: '🌏',
        label: 'The Sage',
        description: 'At its highest expression, Sagittarius has accumulated not just experience but genuine wisdom — the kind that can only come from having lived through many different realities and sat long enough with each of them to understand something true. The Sage no longer runs toward the horizon; it carries the horizon within it. It teaches not by pronouncing but by embodying, not by instructing but by demonstrating through the way it lives that a large, curious, generous life is possible. This is Sagittarius as a lantern for others: here is what\'s possible, here is what I found, here is the way.',
      },
    ],
    positive: ['Optimistic and enthusiastic', 'Philosophical and open-minded', 'Adventurous', 'Honest and direct', 'Generous', 'Inspires others'],
    shadow:   ['Tactless and blunt', 'Overcommits and underdelivers', 'Avoids depth or responsibility', 'Restless and commitment-shy', 'Self-righteous', 'Exaggerates'],
    essence: 'Sagittarius is always aiming for something larger than what\'s in front of it — and that\'s both the beauty and the problem. Its fire is expansive, its honesty can be brutal, and its optimism genuine. Its work is learning that freedom without rootedness is just running.',
  },

  capricorn: {
    id: 'capricorn', name: 'Capricorn',
    element: 'earth', modality: 'cardinal', ruler: 'Saturn',
    keywords: ['ambition', 'discipline', 'structure', 'mastery', 'legacy'],
    evolutions: [
      {
        symbol: '🐠',
        label: 'The Sea-Goat',
        description: 'At this stage, Capricorn\'s ambition is driven by fear rather than purpose. The Sea-Goat climbs because stillness feels like failure, accumulates credentials and status because they seem like proof against the vulnerability of being ordinary. Emotions are inconvenient; relationships are instrumental; the future is always the place where life will finally feel secure. The mountain is being climbed, but no one has stopped to ask whether it\'s the right mountain.',
      },
      {
        symbol: '🐐',
        label: 'The Mountain Goat',
        description: 'The evolved Capricorn brings its extraordinary discipline to bear on something that genuinely matters. The Mountain Goat has stopped performing productivity and started building with real intention — understanding that its greatest power lies not in moving fast but in moving consistently, in creating structures that serve the people who depend on them. It still works hard, but now its work is an expression of values rather than a hedge against inadequacy. The patience it once turned toward achievement it now also offers to relationships.',
      },
      {
        symbol: '👴',
        label: 'The Elder',
        description: 'At its highest expression, Capricorn becomes a vessel for earned authority — not the kind that demands respect but the kind that quietly commands it through demonstrated integrity over time. The Elder has built something real and lasting, has made peace with the limits that Saturn imposes, and now brings the full weight of its experience to the service of others. It mentors, guides, and holds structure not as a form of control but as an act of love — creating the conditions in which other people can do their best work and live their fullest lives.',
      },
    ],
    positive: ['Disciplined and responsible', 'Ambitious with follow-through', 'Patient and strategic', 'Reliable', 'Excellent at long-term planning', 'Natural authority'],
    shadow:   ['Emotionally cold', 'Workaholic tendencies', 'Status-obsessed', 'Pessimistic', 'Rigid and controlling', 'Difficulty with vulnerability'],
    essence: 'Capricorn knows that anything worth having requires work and time — and it is willing to pay that price. The shadow is when achievement becomes a substitute for feeling. The gift is when the same discipline that built the career is turned toward building a life.',
  },

  aquarius: {
    id: 'aquarius', name: 'Aquarius',
    element: 'air', modality: 'fixed', ruler: 'Uranus',
    keywords: ['innovation', 'community', 'freedom', 'vision', 'individuality'],
    evolutions: [
      {
        symbol: '⚡',
        label: 'The Outcast',
        description: 'At this stage, Aquarius wears its difference as armor. The Outcast rebels because rebellion feels like identity, not because it has a better alternative in mind. It keeps people at arm\'s length, confusing emotional distance for independence and intellectual superiority for genuine insight. Its ideas are often genuinely original, but they\'re deployed as weapons rather than contributions — look how strange I am, look how far I\'ve seen, look how little I need you. Underneath is a longing for belonging so intense it terrifies.',
      },
      {
        symbol: '🔬',
        label: 'The Inventor',
        description: 'The evolved Aquarius starts directing its exceptional vision outward with genuine purpose. The Inventor works from a real commitment to human possibility rather than from a need to differentiate itself. It has learned to stay in the room long enough to make its ideas actionable, to collaborate without losing its perspective, to hold the long view without abandoning the people standing right in front of it. This is the Aquarius that builds tools, systems, and communities that make the future possible.',
      },
      {
        symbol: '🌐',
        label: 'The World Server',
        description: 'At its highest expression, Aquarius transcends the personal entirely — not by becoming cold, but by becoming genuinely spacious. The World Server no longer needs to be the most interesting person in the room because it has stopped thinking of the room in those terms. Its individuality is fully intact, but it now functions as a contribution to something collective rather than a contrast against it. This Aquarius works quietly and consistently toward a vision of how things could be — not because it will be recognized for it, but because it has seen what\'s possible and can\'t unsee it.',
      },
    ],
    positive: ['Original and visionary', 'Humanitarian', 'Independent thinker', 'Community-minded', 'Inventive', 'Accepts others as they are'],
    shadow:   ['Emotionally detached', 'Contrarian', 'Can be cold or aloof', 'Stubborn about ideas', 'Avoids intimacy', 'Can seem superior'],
    essence: 'Aquarius arrived early from a future no one else can see yet. It carries ideas that won\'t make sense for a decade, and it knows it. The wound is mistaking difference for superiority. The gift is that when it stops performing rebellion and starts living its vision, it genuinely changes things.',
  },

  pisces: {
    id: 'pisces', name: 'Pisces',
    element: 'water', modality: 'mutable', ruler: 'Neptune',
    keywords: ['compassion', 'imagination', 'spirituality', 'dissolution', 'transcendence'],
    evolutions: [
      {
        symbol: '🐟',
        label: 'The Drowning Fish',
        description: 'At this stage, Pisces has no container for the vastness of what it feels. The Drowning Fish absorbs everything — other people\'s moods, the suffering of the world, unnamed anxieties that seem to come from nowhere — and has no reliable way to process or release any of it. Reality is overwhelming, so it escapes: into fantasy, into substances, into relationships where it can disappear into someone else\'s life. It is endlessly compassionate toward others and ruthlessly self-neglecting, which it mistakes for spirituality.',
      },
      {
        symbol: '🎨',
        label: 'The Dreamer',
        description: 'The evolved Pisces discovers that its porousness is not a vulnerability but a gift — once it learns to work with it rather than be swept away by it. The Dreamer channels the oceanic quality of its inner life into creativity, into genuine compassion, into the ability to see beauty and meaning in places others have given up on. It has begun to develop boundaries, not walls, and with those boundaries comes the ability to actually receive the depth it has always tried to give. Art, service, and spiritual practice become its languages.',
      },
      {
        symbol: '✨',
        label: 'The Mystic',
        description: 'At its highest expression, Pisces doesn\'t dissolve — it surrenders, which is an entirely different thing. The Mystic has done enough inner work to know which parts of it are genuinely its own and which are the accumulated debris of everything it has absorbed, and it can finally move between worlds with intention rather than helplessness. It serves not from depletion but from a well that continually refills. This Pisces is a channel for something larger than personality — a presence so open and so still that people feel inexplicably met when they\'re in its company.',
      },
    ],
    positive: ['Deeply compassionate', 'Imaginative and creative', 'Spiritually attuned', 'Empathic', 'Selfless', 'Access to the unconscious'],
    shadow:   ['Escapist', 'Difficulty with boundaries', 'Victim mentality', 'Prone to delusion or confusion', 'Avoids conflict', 'Can be self-sacrificing to a fault'],
    essence: 'Pisces experiences where the self ends and everything else begins — and often can\'t find the line. That porousness is its greatest gift (feeling the whole ocean of human experience) and its deepest wound (drowning in it). Its work is learning to be in the world without disappearing into it.',
  },
};

export const ELEMENT_COLOR: Record<string, string> = {
  fire:  'var(--aspect-dynamic)',
  earth: '#7a9c6a',
  air:   'var(--aspect-harmonious)',
  water: '#5a7ad8',
};
