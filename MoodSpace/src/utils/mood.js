import { QUOTE_RANDOM_URL, defaultMoodIds, moods, quotes } from './data'

function readStoredValue(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch {
    return fallback
  }
}

function getDailyQuote() {
  const today = new Date()
  const dayStamp = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  const index = Math.floor(dayStamp / 86400000) % quotes.length
  return {
    ...quotes[index],
    source: 'local',
  }
}

async function fetchRemoteQuote() {
  const response = await fetch(QUOTE_RANDOM_URL)

  if (!response.ok) {
    throw new Error('Quote API request failed.')
  }

  const payload = await response.json()
  const text = typeof payload?.quote === 'string' ? payload.quote.trim() : ''
  const author = typeof payload?.author === 'string' ? payload.author.trim() : ''

  if (!text || !author) {
    throw new Error('Quote API response was missing quote data.')
  }

  return {
    text,
    author,
    source: 'dummyjson',
  }
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`))
}

function getLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getUtcDayNumber(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86400000
}

function getDateFilterStart(filter) {
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  if (filter === 'today') {
    return startDate
  }

  if (filter === 'week') {
    startDate.setDate(startDate.getDate() - 6)
    return startDate
  }

  if (filter === 'month') {
    startDate.setDate(1)
    return startDate
  }

  return null
}

function normalizeMoodLabel(label) {
  return label.trim().replace(/\s+/g, ' ')
}

function createMoodId(label) {
  const baseId = normalizeMoodLabel(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `custom-${baseId || crypto.randomUUID()}`
}

function normalizeCustomMoods(rawMoods) {
  if (!Array.isArray(rawMoods)) {
    return []
  }

  const seenIds = new Set(defaultMoodIds)

  return rawMoods.reduce((normalizedMoods, mood) => {
    const label =
      typeof mood?.label === 'string' ? normalizeMoodLabel(mood.label) : ''
    const emoji = typeof mood?.emoji === 'string' ? mood.emoji.trim() : ''
    const score = Number(mood?.score)
    const rawId =
      typeof mood?.id === 'string' && mood.id.trim()
        ? mood.id.trim()
        : createMoodId(label)

    if (!label || !emoji || Number.isNaN(score) || seenIds.has(rawId)) {
      return normalizedMoods
    }

    const safeScore = Math.max(-2, Math.min(2, Math.round(score)))
    seenIds.add(rawId)
    normalizedMoods.push({
      id: rawId,
      label,
      emoji,
      score: safeScore,
      custom: true,
    })

    return normalizedMoods
  }, [])
}

function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function getStreak(entries) {
  if (entries.length === 0) {
    return 0
  }

  const uniqueDays = [
    ...new Set(
      entries.map((entry) => getLocalDateKey(entry.createdAt)),
    ),
  ].sort((left, right) => right.localeCompare(left))

  let streak = 0
  const currentDay = new Date()

  for (let index = 0; index < uniqueDays.length; index += 1) {
    const comparisonDay = new Date(currentDay)
    comparisonDay.setHours(0, 0, 0, 0)
    comparisonDay.setDate(comparisonDay.getDate() - index)

    const expectedDay = getLocalDateKey(comparisonDay)
    if (uniqueDays[index] !== expectedDay) {
      break
    }
    streak += 1
  }

  return streak
}

function getLongestStreak(entries) {
  if (entries.length === 0) {
    return 0
  }

  const uniqueDays = [
    ...new Set(
      entries.map((entry) => getLocalDateKey(entry.createdAt)),
    ),
  ].sort()

  let best = 1
  let current = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = getUtcDayNumber(uniqueDays[index - 1])
    const currentDay = getUtcDayNumber(uniqueDays[index])
    const difference = currentDay - previous

    if (difference === 1) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }

  return best
}

function buildDailySeries(entries, days = 14) {
  const grouped = entries.reduce((accumulator, entry) => {
    const key = getLocalDateKey(entry.createdAt)
    if (!accumulator[key]) {
      accumulator[key] = { total: 0, count: 0 }
    }
    accumulator[key].total += entry.score
    accumulator[key].count += 1
    return accumulator
  }, {})

  const series = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const pointDate = new Date(today)
    pointDate.setDate(pointDate.getDate() - offset)
    const key = getLocalDateKey(pointDate)
    const dayData = grouped[key]
    const average = dayData ? dayData.total / dayData.count : null

    series.push({
      key,
      label: formatShortDate(key),
      average,
    })
  }

  return series
}

function buildLinePath(series, width, height, padding, leftPadding = padding) {
  const usableSeries = series.filter((point) => point.average !== null)
  if (usableSeries.length === 0) {
    return ''
  }

  const minScore = -2
  const maxScore = 2
  const innerWidth = width - leftPadding - padding
  const innerHeight = height - padding * 2

  return usableSeries
    .map((point, index) => {
      const originalIndex = series.findIndex((item) => item.key === point.key)
      const x =
        leftPadding +
        (series.length === 1 ? 0 : (originalIndex / (series.length - 1)) * innerWidth)
      const normalized = (point.average - minScore) / (maxScore - minScore)
      const y = height - padding - normalized * innerHeight
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function buildChartPoints(series, width, height, padding, leftPadding = padding) {
  const minScore = -2
  const maxScore = 2
  const innerWidth = width - leftPadding - padding
  const innerHeight = height - padding * 2

  return series
    .map((point, index) => {
      if (point.average === null) {
        return null
      }

      const x =
        leftPadding +
        (series.length === 1 ? 0 : (index / (series.length - 1)) * innerWidth)
      const normalized = (point.average - minScore) / (maxScore - minScore)
      const y = height - padding - normalized * innerHeight

      return { ...point, x, y }
    })
    .filter(Boolean)
}

function normalizeImportedEntries(rawEntries, availableMoods = moods) {
  if (!Array.isArray(rawEntries)) {
    return []
  }

  return rawEntries
    .map((entry) => {
      const fallbackMood =
        availableMoods.find((mood) => mood.id === entry?.moodId) ?? moods[0]
      const entryDate = new Date(entry?.createdAt)

      return {
        id:
          typeof entry?.id === 'string' && entry.id.trim()
            ? entry.id
            : crypto.randomUUID(),
        moodId: fallbackMood.id,
        moodLabel: fallbackMood.label,
        emoji: fallbackMood.emoji,
        score: fallbackMood.score,
        note: typeof entry?.note === 'string' ? entry.note : '',
        createdAt: Number.isNaN(entryDate.getTime())
          ? new Date().toISOString()
          : entryDate.toISOString(),
      }
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}


export {
  buildChartPoints,
  buildDailySeries,
  buildLinePath,
  createMoodId,
  formatDate,
  formatLongDate,
  formatShortDate,
  fetchRemoteQuote,
  getDateFilterStart,
  getDailyQuote,
  getLocalDateKey,
  getLongestStreak,
  getStreak,
  normalizeCustomMoods,
  normalizeImportedEntries,
  normalizeMoodLabel,
  readStoredValue,
}
