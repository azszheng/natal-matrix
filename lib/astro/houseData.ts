export type HouseData = {
  number: number;
  name: string;
  nickname: string;
  keywords: string[];
  description: string;
  themes: string;
  questions: string[];
};

export const HOUSE_DATA: Record<number, HouseData> = {
  1: {
    number: 1,
    name: 'First House',
    nickname: 'The House of Self',
    keywords: ['identity', 'appearance', 'first impressions', 'the body', 'beginnings', 'self-image'],
    description: 'The First House is the lens through which you see the world and through which the world first sees you. It governs your physical appearance, the way you instinctively present yourself, and the immediate impression you make before anyone has spoken a word. Whatever sign sits on your Ascendant — the cusp of this house — colors your entire personality with its quality, often in ways that feel so natural you barely notice them yourself.\n\nThis is also the house of new beginnings: the self that initiates, that steps forward, that faces life without knowing what\'s coming. It describes the quality of your vitality and how you approach situations you haven\'t encountered before. A heavily tenanted First House — or a prominent Ascendant ruler — often produces people for whom identity is a central preoccupation: people who are working out who they are, often in public and often in striking ways.',
    themes: 'Your Ascendant sign and any planets here shape how you lead with yourself into the world.',
    questions: ['How do others perceive me at first meeting?', 'What is the quality of my physical presence?', 'How do I begin things?'],
  },

  2: {
    number: 2,
    name: 'Second House',
    nickname: 'The House of Resources',
    keywords: ['money', 'possessions', 'values', 'self-worth', 'material security', 'what you own'],
    description: 'The Second House governs your relationship to the material world — not just money, but everything that gives you a sense of security and continuity: your possessions, your talents, your physical resources, and your sense of your own value. It describes how you earn, how you spend, what you accumulate, and what you hold on to.\n\nAt a deeper level, this house speaks to your relationship with self-worth. The material and the psychological are linked here in a way that most people feel but rarely examine: a sense of being fundamentally valuable (or not) tends to play out in the physical dimension of money and resources. People with strong Second House placements often have an especially charged relationship with material security — whether as wealth-builders, as people who struggle financially, or as those who have done profound work on separating their net worth from their self-worth.',
    themes: 'What you value, what you earn, and what you believe you deserve are all Second House territory.',
    questions: ['What is my relationship with money and material security?', 'What do I value most deeply?', 'How does my sense of self-worth shape my finances?'],
  },

  3: {
    number: 3,
    name: 'Third House',
    nickname: 'The House of Communication',
    keywords: ['communication', 'siblings', 'local travel', 'the mind', 'learning', 'neighbors', 'short trips'],
    description: 'The Third House rules everything that passes between minds: speech, writing, learning, teaching, and the kind of conversation that moves so fast it feels like thinking out loud. It governs how you process and transmit information — your cognitive style, your way with words, and what happens when you sit down to explain something.\n\nThis house also governs the immediate environment: siblings, neighbors, the neighborhood itself, short journeys, and the daily rhythmic movement between the places you inhabit. There\'s a quality of proximity to everything here — close enough to touch, familiar enough to take for granted. Third House planets often describe the texture of early mental life: how you learned in school, how you communicated with siblings, and what the quality of your early intellectual environment was like. Strong Third House placements tend to produce people for whom language, information, and the act of connection through ideas are central to everything.',
    themes: 'How you think, speak, and move through your immediate world.',
    questions: ['How do I best communicate and express ideas?', 'What is my relationship to learning and information?', 'How do I relate to siblings and close neighbors?'],
  },

  4: {
    number: 4,
    name: 'Fourth House',
    nickname: 'The House of Foundations',
    keywords: ['home', 'family', 'roots', 'the past', 'private life', 'ancestry', 'inner foundation'],
    description: 'The Fourth House is the deepest and most private part of the chart — the psychological basement, the place you retreat to when the world is too much, the foundation on which the visible self is built. It governs home, family of origin, and the invisible inheritance of patterns, stories, and unresolved material passed down through generations.\n\nAt the nadir of the chart, this house represents what\'s underneath everything: the ground-level sense of security (or its absence) that shapes what you\'re able to build above it. It describes your relationship to the past, to the parents who formed you earliest, and to the idea of home — not just as a place but as a psychological state. Fourth House planets often reflect the emotional atmosphere of early life, for better and worse, and they tend to describe what people are working through in private when the public face is put away.',
    themes: 'The private self, your roots, and the emotional foundation you\'ve been given and are still building.',
    questions: ['What did my early home life feel like?', 'What do I need to feel truly at home?', 'What family patterns am I carrying or transforming?'],
  },

  5: {
    number: 5,
    name: 'Fifth House',
    nickname: 'The House of Pleasure',
    keywords: ['creativity', 'romance', 'play', 'children', 'self-expression', 'joy', 'performance'],
    description: 'The Fifth House is where you go when nothing is required of you — when you can simply be for the pleasure of it. It governs creativity in its most uninhibited form, romantic love in its early and exciting phase, play, pleasure, and all the ways you express your unique self just because expression feels good. It\'s the house of the artist, the lover, the gambler, the child, and the performer.\n\nChildren are traditionally associated with this house — both literal children and the creative "children" you send out into the world: projects, ideas, performances, pieces of art. There\'s something fundamentally generative about this house; it\'s connected to the delight of bringing something new into existence and watching it live. People with prominent Fifth House placements often have a quality of radiance when they\'re in their element — a capacity for play that doesn\'t entirely disappear in adulthood, and a romantic imagination that can make even ordinary life feel like theater.',
    themes: 'Joy, creativity, love affairs, and the authentic expression that comes when you stop performing and start playing.',
    questions: ['What do I do purely for the joy of it?', 'How do I express myself creatively?', 'What does romance and playfulness mean to me?'],
  },

  6: {
    number: 6,
    name: 'Sixth House',
    nickname: 'The House of Daily Life',
    keywords: ['health', 'work', 'service', 'routines', 'habits', 'wellness', 'day-to-day'],
    description: 'The Sixth House governs the texture of everyday life — the daily rhythms, habits, and routines through which life is actually lived rather than imagined. It rules health and the body\'s needs, the work you do on a practical level (as distinct from career or vocation), and the ways you serve: colleagues, employers, and the daily requirements of being in the world.\n\nThis is the house of craft and of the ordinary made sacred. Where the Fifth House concerns creative expression, the Sixth concerns the discipline that makes good work possible — the daily practice, the health regimen, the small adjustments that accumulate into a life well-maintained. It also governs the relationship between the mind and body, particularly in the domain of health: the ways that psychological patterns show up as physical symptoms, and the ways that physical practice shapes psychological wellbeing. Planets here often have something important to say about work ethic, the body\'s chronic issues, and the kinds of service that feel most meaningful.',
    themes: 'Your relationship to health, work, and the rituals of daily life.',
    questions: ['What daily habits support my wellbeing?', 'How do I relate to work and service?', 'What does my body ask of me?'],
  },

  7: {
    number: 7,
    name: 'Seventh House',
    nickname: 'The House of Partnership',
    keywords: ['marriage', 'partnership', 'relationships', 'contracts', 'the other', 'open enemies', 'collaboration'],
    description: 'The Seventh House is where you meet yourself through other people. It governs all significant one-on-one relationships — marriage, business partnerships, close collaborations, and even open adversaries, because both intimate partners and declared opponents occupy the same fundamental relational position: they stand across from you, directly, and reflect something back.\n\nThe sign on the Descendant (the cusp of this house) often describes qualities that you are drawn to in others but may not fully recognize in yourself — qualities that were perhaps split off or undeveloped, that you\'ve outsourced to the people you choose to be with. This is why the Seventh House is not just about what you want in a partner, but about your own psychological wholeness: what you haven\'t yet integrated tends to walk toward you wearing a relationship. Planets here can describe the quality of partnerships, patterns in relating, and the lessons that only seem to arrive through intimate encounter with another person.',
    themes: 'The people you partner with and what those partnerships ask of you.',
    questions: ['What do I seek in partnership?', 'What qualities do I attract or project onto others?', 'What do significant relationships teach me about myself?'],
  },

  8: {
    number: 8,
    name: 'Eighth House',
    nickname: 'The House of Transformation',
    keywords: ['transformation', 'death and rebirth', 'shared resources', 'sexuality', 'power', 'the occult', 'inheritance'],
    description: 'The Eighth House rules the territory that most people prefer not to think about: death, loss, endings, and the raw power that moves through all of them. It also governs shared resources and financial entanglements — money that flows between people, inheritances, taxes, debts, and the ways that intimacy creates material interdependence. Sexuality lives here too, in its deepest and most psychologically complex dimension.\n\nAt its core, the Eighth House is about transformation through surrender: the experiences that require you to let go of something you thought you were, only to discover that what remains is more essentially you than what was lost. These are never comfortable experiences, but they are often the most formative ones. People with prominent Eighth House placements tend to live at a greater intensity than average — they are drawn to depth, to what\'s hidden, to the psychic undercurrents that others don\'t notice or choose not to acknowledge. The shadow here is the temptation to use power or emotional intensity as control; the gift is the capacity for genuine, irrevocable transformation.',
    themes: 'The deep undercurrents of life: shared power, loss, intimacy, and the self that emerges from being broken open.',
    questions: ['What have my greatest losses or endings taught me?', 'How do I relate to power and shared resources?', 'What needs to die in me so something new can emerge?'],
  },

  9: {
    number: 9,
    name: 'Ninth House',
    nickname: 'The House of Expansion',
    keywords: ['philosophy', 'higher education', 'travel', 'beliefs', 'religion', 'wisdom', 'the big picture'],
    description: 'The Ninth House is where the mind stretches beyond what it already knows. It governs the search for meaning — the philosophical, spiritual, and intellectual frameworks through which life becomes interpretable rather than random. Higher education, long-distance travel, religion, and cross-cultural encounter all belong here, because each of them involves leaving behind the familiar and encountering a perspective large enough to change how you see everything else.\n\nThis is the house of the professor, the pilgrim, the long-distance wanderer, and the person who can\'t stop asking why. It describes the quality of your beliefs — how you arrived at them, how firmly you hold them, and how open or closed you are to evidence that challenges them. Planets here often reflect a need to encounter something larger than the immediate life: a philosophy, a tradition, a landscape, a way of thinking that stretches the soul. The shadow is the tendency toward dogma — taking the meaning-making frameworks so seriously that they stop expanding and start constraining.',
    themes: 'The search for meaning, wisdom, and a worldview large enough to hold your whole life.',
    questions: ['What do I believe, and how did I come to believe it?', 'How does travel or education expand my sense of what\'s possible?', 'What is my relationship to meaning and spiritual life?'],
  },

  10: {
    number: 10,
    name: 'Tenth House',
    nickname: 'The House of Vocation',
    keywords: ['career', 'public reputation', 'achievement', 'authority', 'status', 'life direction', 'legacy'],
    description: 'The Tenth House sits at the very top of the chart — the most visible, public point — and governs everything that lives in the eyes of the world: career, reputation, social status, public achievement, and the legacy you leave behind. It describes how you are known and what you will be remembered for, which is not always the same as what you secretly value most.\n\nThis house also has something to say about authority figures — often one of the parents, typically the one who was most associated with worldly expectations and the pressure to achieve. Planets here describe the quality of your public presence, the ambitions that drive you, and the relationship between your private self and the image you project outward. A prominent Tenth House doesn\'t necessarily mean fame, but it does tend to produce people for whom their place in the world — and how they\'re perceived — carries significant psychological weight. The deepest work of this house is learning to separate genuine vocation from the desire for external validation.',
    themes: 'Your public life, career path, and the way you want to leave your mark on the world.',
    questions: ['What am I here to contribute publicly?', 'What is my relationship to achievement and recognition?', 'How does my career express who I am at my core?'],
  },

  11: {
    number: 11,
    name: 'Eleventh House',
    nickname: 'The House of Community',
    keywords: ['friends', 'groups', 'hopes', 'community', 'the future', 'collective causes', 'social networks'],
    description: 'The Eleventh House governs the relationship between the individual and the collective — the communities you belong to, the friends who are chosen rather than given, the groups and movements and networks through which you participate in something larger than your personal life. It also rules your hopes: the vision of the future that motivates you, the possibilities you\'re holding open.\n\nWhere the Seventh House concerns one-on-one partnership, the Eleventh concerns belonging at scale: the experience of finding your people, of being part of something that shares your values, of contributing to a cause that will outlast your individual participation. Planets here describe the quality of your social world — whether you thrive in groups or find them difficult, what you need from community, and what you bring to it. The shadow here involves confusing belonging with conformity, or sacrificing authenticity for the safety of being liked by the group. The gift is the discovery that genuine community — the kind where you\'re known and accepted — is one of the deepest sources of meaning available.',
    themes: 'The friends, groups, and collective visions that make you feel part of something larger.',
    questions: ['Who are my people, and what do I give and receive in community?', 'What future am I working toward?', 'How do I balance individual identity with belonging?'],
  },

  12: {
    number: 12,
    name: 'Twelfth House',
    nickname: 'The House of the Hidden',
    keywords: ['the unconscious', 'solitude', 'spirituality', 'karma', 'retreat', 'hidden matters', 'dissolution'],
    description: 'The Twelfth House is the most interior and elusive part of the chart — the realm of what\'s hidden from ordinary sight, including the parts of yourself you haven\'t yet found. It governs the unconscious, solitude, retreat, spiritual practice, and the accumulated material that operates below awareness: old fears, ancestral patterns, the ways you sabotage yourself without meaning to.\n\nThis house also rules institutions of confinement or withdrawal — hospitals, prisons, monasteries — anywhere that ordinary life is suspended and something more fundamental takes over. Planets here often describe buried talents or energies that are harder to access in regular life but that emerge in solitude, in spiritual practice, or in times of crisis. The shadow of the Twelfth is the pull toward self-undoing: the patterns that repeat in the dark, the escapes that cost more than they give, the ways we disappear from our own lives. The gift is access to depth that most people never reach: the capacity for genuine compassion, for spiritual openness, for the kind of creativity that comes from listening to what\'s underneath rather than performing on the surface.',
    themes: 'The hidden, the unconscious, and the spiritual dimension that underlies ordinary life.',
    questions: ['What am I carrying beneath the surface?', 'What does my soul ask of me in solitude?', 'What unconscious patterns are shaping my life without my knowing it?'],
  },
};
