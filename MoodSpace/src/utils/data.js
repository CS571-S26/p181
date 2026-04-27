export const STORAGE_KEY = 'moodspace.entries'
export const FAVORITES_KEY = 'moodspace.favoriteQuotes'
export const THEME_KEY = 'moodspace.theme'
export const CUSTOM_MOODS_KEY = 'moodspace.customMoods'
export const QUOTE_CACHE_KEY = 'moodspace.remoteQuote'
export const QUOTE_RANDOM_URL = 'https://dummyjson.com/quotes/random'

export const themes = [
  {
    id: 'soft-light',
    label: 'Soft Light',
    description: 'Airy peach, teal, and sky tones.',
    swatches: ['#fffaf6', '#3f8f86', '#6d97c7'],
  },
  {
    id: 'moonlight',
    label: 'Moonlight',
    description: 'A quieter dark theme for late check-ins.',
    swatches: ['#172332', '#8fb6d8', '#f0b77f'],
  },
  {
    id: 'warm-sunset',
    label: 'Warm Sunset',
    description: 'Gentle coral and golden evening colors.',
    swatches: ['#fff4e8', '#c96f4d', '#8b7bb8'],
  },
  {
    id: 'sage-garden',
    label: 'Sage Garden',
    description: 'Leafy greens with a quiet cream backdrop.',
    swatches: ['#f4f8ee', '#6f956f', '#d7a75f'],
  },
  {
    id: 'berry-cloud',
    label: 'Berry Cloud',
    description: 'Soft lavender, berry, and misty blue.',
    swatches: ['#f7f0fb', '#9b6aa3', '#73a8b9'],
  },
  {
    id: 'sea-glass',
    label: 'Sea Glass',
    description: 'Cool aqua, navy, and clean foam tones.',
    swatches: ['#eefbfa', '#247c8f', '#284d77'],
  },
  {
    id: 'citrus-pop',
    label: 'Citrus Pop',
    description: 'Fresh lemon, leafy green, and bright coral.',
    swatches: ['#fffbe6', '#2f7d4f', '#e85d4f'],
  },
  {
    id: 'graphite',
    label: 'Graphite',
    description: 'A crisp grayscale theme with electric blue.',
    swatches: ['#f4f6f8', '#2f3742', '#2f80ed'],
  },
  {
    id: 'rose-ink',
    label: 'Rose Ink',
    description: 'Blush paper, deep plum, and rose accents.',
    swatches: ['#fff1f4', '#6f3155', '#d6567f'],
  },
  {
    id: 'morning-fog',
    label: 'Morning Fog',
    description: 'Quiet gray-blue, pine, and pale mist.',
    swatches: ['#f2f6f5', '#4f6f68', '#6f89a3'],
  },
  {
    id: 'orchid-night',
    label: 'Orchid Night',
    description: 'Deep violet, orchid, and soft gold.',
    swatches: ['#24172f', '#b070c7', '#f0c66f'],
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'Clear paper, cobalt, and precise cyan.',
    swatches: ['#f2f7ff', '#2458b8', '#00a7c7'],
  },
]

export const moods = [
  { id: 'happy', label: 'Happy', emoji: '\u{1F60A}', score: 2 },
  { id: 'calm', label: 'Calm', emoji: '\u{1F60C}', score: 1 },
  { id: 'tired', label: 'Tired', emoji: '\u{1F634}', score: -1 },
  { id: 'sad', label: 'Sad', emoji: '\u{1F622}', score: -2 },
  { id: 'angry', label: 'Angry', emoji: '\u{1F620}', score: -2 },
  { id: 'stressed', label: 'Stressed', emoji: '\u{1F635}', score: -1 },
]

export const emojiCategories = [
  {
    id: 'bright',
    label: 'Bright',
    emojis: [
      '\u{1F60A}',
      '\u{1F604}',
      '\u{1F603}',
      '\u{1F601}',
      '\u{1F929}',
      '\u{1F970}',
      '\u{1F60D}',
      '\u{1F917}',
      '\u{1F973}',
      '\u{1F60E}',
      '\u{1F642}',
      '\u{1F917}',
    ],
  },
  {
    id: 'calm',
    label: 'Calm',
    emojis: [
      '\u{1F60C}',
      '\u{1F607}',
      '\u{1F917}',
      '\u{1F979}',
      '\u{1F642}',
      '\u{1F60A}',
      '\u{1F9D8}',
      '\u{1F343}',
      '\u{1F31E}',
      '\u{1F319}',
      '\u{2728}',
      '\u{1F64F}',
    ],
  },
  {
    id: 'low',
    label: 'Low',
    emojis: [
      '\u{1F614}',
      '\u{1F615}',
      '\u{1F61E}',
      '\u{1F622}',
      '\u{1F62D}',
      '\u{1F97A}',
      '\u{1F634}',
      '\u{1F971}',
      '\u{1F613}',
      '\u{1F629}',
      '\u{1F62B}',
      '\u{1FAE5}',
    ],
  },
  {
    id: 'intense',
    label: 'Intense',
    emojis: [
      '\u{1F620}',
      '\u{1F621}',
      '\u{1F624}',
      '\u{1F630}',
      '\u{1F631}',
      '\u{1F628}',
      '\u{1F635}',
      '\u{1F92F}',
      '\u{1F62E}\u{200D}\u{1F4A8}',
      '\u{1F975}',
      '\u{1F976}',
      '\u{1F92C}',
    ],
  },
  {
    id: 'mixed',
    label: 'Mixed',
    emojis: [
      '\u{1F914}',
      '\u{1F928}',
      '\u{1F610}',
      '\u{1F611}',
      '\u{1F636}',
      '\u{1FAE0}',
      '\u{1F633}',
      '\u{1F644}',
      '\u{1F62C}',
      '\u{1F922}',
      '\u{1F912}',
      '\u{1F974}',
    ],
  },
]

export const quotes = [
  {
    text: 'You do not have to carry the whole week at once. Just this moment.',
    author: 'MoodSpace',
  },
  {
    text: 'Small reflections, repeated often, can change the way a life feels.',
    author: 'MoodSpace',
  },
  {
    text: 'Rest is not falling behind. It is part of moving forward.',
    author: 'MoodSpace',
  },
  {
    text: 'Naming a feeling is already a step toward understanding it.',
    author: 'MoodSpace',
  },
  {
    text: 'Even difficult days become clearer when you give them language.',
    author: 'MoodSpace',
  },
]

export const defaultMoodIds = new Set(moods.map((mood) => mood.id))

export const homeHighlights = [
  {
    title: 'Check in softly',
    copy: 'Choose the feeling that fits without needing to explain everything.',
  },
  {
    title: 'Keep tiny notes',
    copy: 'Short reflections make the app feel personal instead of just functional.',
  },
  {
    title: 'Notice your rhythm',
    copy: 'Your memory wall and trend view start to tell a story over time.',
  },
]
