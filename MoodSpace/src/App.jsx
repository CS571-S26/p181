import { useEffect, useMemo, useRef, useState } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { ConfirmDeleteDialog, HeaderDashboard, HomePage, SettingsPage, TrendsPage } from './pages/MoodSpacePages'
import { CUSTOM_MOODS_KEY, FAVORITES_KEY, QUOTE_CACHE_KEY, STORAGE_KEY, THEME_KEY, moods, themes } from './utils/data'
import { createMoodId, fetchRemoteQuote, formatLongDate, getDailyQuote, getDateFilterStart, getLocalDateKey, getLongestStreak, getStreak, normalizeCustomMoods, normalizeImportedEntries, normalizeMoodLabel, readStoredValue } from './utils/mood'

function AppShell() {
  const importInputRef = useRef(null)
  const [entries, setEntries] = useState(() => readStoredValue(STORAGE_KEY, []))
  const [favoriteQuotes, setFavoriteQuotes] = useState(() =>
    readStoredValue(FAVORITES_KEY, []),
  )
  const [customMoods, setCustomMoods] = useState(() =>
    normalizeCustomMoods(readStoredValue(CUSTOM_MOODS_KEY, [])),
  )
  const [selectedMood, setSelectedMood] = useState(moods[0].id)
  const [historyFilter, setHistoryFilter] = useState('all')
  const [historyDateFilter, setHistoryDateFilter] = useState('all')
  const [historySearch, setHistorySearch] = useState('')
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editingMoodId, setEditingMoodId] = useState(moods[0].id)
  const [editingNote, setEditingNote] = useState('')
  const [entryPendingDelete, setEntryPendingDelete] = useState(null)
  const [activeChartPoint, setActiveChartPoint] = useState(null)
  const [note, setNote] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [historyMessage, setHistoryMessage] = useState('')
  const [importMessage, setImportMessage] = useState({ text: '', kind: 'info' })
  const [customMoodMessage, setCustomMoodMessage] = useState('')
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(() => getDailyQuote())
  const [customMoodDraft, setCustomMoodDraft] = useState({
    emoji: '',
    label: '',
    score: '1',
  })
  const [selectedTheme, setSelectedTheme] = useState(() =>
    readStoredValue(THEME_KEY, themes[0].id),
  )

  const moodsList = useMemo(() => [...moods, ...customMoods], [customMoods])
  const selectedMoodDetails =
    moodsList.find((mood) => mood.id === selectedMood) ?? moods[0]

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteQuotes))
  }, [favoriteQuotes])

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_MOODS_KEY, JSON.stringify(customMoods))
  }, [customMoods])

  useEffect(() => {
    const themeExists = themes.some((theme) => theme.id === selectedTheme)
    const nextTheme = themeExists ? selectedTheme : themes[0].id

    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem(THEME_KEY, JSON.stringify(nextTheme))
  }, [selectedTheme])

  useEffect(() => {
    let ignoreRequest = false
    const todayKey = getLocalDateKey()
    const cachedQuote = readStoredValue(QUOTE_CACHE_KEY, null)

    if (
      cachedQuote?.dateKey === todayKey &&
      cachedQuote?.quote?.text &&
      cachedQuote.quote.source === 'dummyjson'
    ) {
      setQuoteOfTheDay(cachedQuote.quote)
      return undefined
    }

    fetchRemoteQuote()
      .then((quote) => {
        if (ignoreRequest) {
          return
        }

        const cachedPayload = { dateKey: todayKey, quote }
        window.localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(cachedPayload))
        setQuoteOfTheDay(quote)
      })
      .catch(() => {
        if (!ignoreRequest) {
          setQuoteOfTheDay(getDailyQuote())
        }
      })

    return () => {
      ignoreRequest = true
    }
  }, [])

  const stats = useMemo(() => {
    const totalEntries = entries.length
    const averageScore =
      totalEntries === 0
        ? 0
        : entries.reduce((sum, entry) => sum + entry.score, 0) / totalEntries

    return {
      totalEntries,
      streak: getStreak(entries),
      averageLabel:
        averageScore >= 1
          ? 'Sunny lately'
          : averageScore <= -1
            ? 'Needs extra care'
            : 'A little mixed',
    }
  }, [entries])

  const trendInsights = useMemo(() => {
    if (entries.length === 0) {
      return {
        lastSevenDaysCount: 0,
        topMood: null,
        latestEntry: null,
        longestStreak: 0,
        moodBreakdown: moodsList.map((mood) => ({
          ...mood,
          count: 0,
          percentage: 0,
        })),
      }
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const lastSevenDaysCount = entries.filter(
      (entry) => new Date(entry.createdAt) >= sevenDaysAgo,
    ).length

    const counts = entries.reduce((accumulator, entry) => {
      accumulator[entry.moodId] = (accumulator[entry.moodId] || 0) + 1
      return accumulator
    }, {})

    const moodBreakdown = moodsList.map((mood) => {
      const count = counts[mood.id] || 0
      return {
        ...mood,
        count,
        percentage: entries.length === 0 ? 0 : Math.round((count / entries.length) * 100),
      }
    })

    const topMood = [...moodBreakdown].sort((left, right) => right.count - left.count)[0]

    return {
      lastSevenDaysCount,
      topMood: topMood?.count ? topMood : null,
      latestEntry: entries[0] ?? null,
      longestStreak: getLongestStreak(entries),
      moodBreakdown,
    }
  }, [entries, moodsList])

  const filteredEntries = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase()
    const dateFilterStart = getDateFilterStart(historyDateFilter)

    return entries.filter((entry) => {
      const matchesMood =
        historyFilter === 'all' || entry.moodId === historyFilter
      const matchesSearch =
        !normalizedSearch ||
        entry.note.toLowerCase().includes(normalizedSearch) ||
        entry.moodLabel.toLowerCase().includes(normalizedSearch)
      const matchesDate =
        !dateFilterStart || new Date(entry.createdAt) >= dateFilterStart

      return matchesMood && matchesSearch && matchesDate
    })
  }, [entries, historyDateFilter, historyFilter, historySearch])

  useEffect(() => {
    if (!moodsList.some((mood) => mood.id === selectedMood)) {
      setSelectedMood(moods[0].id)
    }
  }, [moodsList, selectedMood])

  useEffect(() => {
    if (
      historyFilter !== 'all' &&
      !moodsList.some((mood) => mood.id === historyFilter)
    ) {
      setHistoryFilter('all')
    }
  }, [historyFilter, moodsList])

  function handleSubmit(event) {
    event.preventDefault()

    const newEntry = {
      id: crypto.randomUUID(),
      moodId: selectedMoodDetails.id,
      moodLabel: selectedMoodDetails.label,
      emoji: selectedMoodDetails.emoji,
      score: selectedMoodDetails.score,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    }

    setEntries((currentEntries) => [newEntry, ...currentEntries])
    setNote('')
    setSaveMessage(`Saved your ${selectedMoodDetails.label.toLowerCase()} check-in.`)
    setHistoryMessage('')
  }

  function toggleFavoriteQuote() {
    const quoteKey = `${quoteOfTheDay.text}-${quoteOfTheDay.author}`

    setFavoriteQuotes((currentFavorites) => {
      const alreadySaved = currentFavorites.some(
        (quote) => `${quote.text}-${quote.author}` === quoteKey,
      )

      if (alreadySaved) {
        return currentFavorites.filter(
          (quote) => `${quote.text}-${quote.author}` !== quoteKey,
        )
      }

      return [...currentFavorites, quoteOfTheDay]
    })
  }

  function requestDeleteEntry(entryId) {
    const entryToDelete = entries.find((entry) => entry.id === entryId)
    setEntryPendingDelete(entryToDelete ?? null)
  }

  function confirmDeleteEntry() {
    if (!entryPendingDelete) {
      return
    }

    const entryId = entryPendingDelete.id
    if (editingEntryId === entryId) {
      setEditingEntryId(null)
      setEditingMoodId(moodsList[0].id)
      setEditingNote('')
    }
    setEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId),
    )
    setEntryPendingDelete(null)
    setHistoryMessage('Entry deleted from your memory wall.')
    setSaveMessage('')
  }

  function updateEntry(entryId) {
    const chosenMood = moodsList.find((mood) => mood.id === editingMoodId) ?? moods[0]

    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              moodId: chosenMood.id,
              moodLabel: chosenMood.label,
              emoji: chosenMood.emoji,
              score: chosenMood.score,
              note: editingNote.trim(),
            }
          : entry,
      ),
    )

    setEditingEntryId(null)
    setEditingMoodId(moodsList[0].id)
    setEditingNote('')
    setHistoryMessage('Entry updated.')
    setSaveMessage('')
  }

  function addCustomMood(event) {
    event.preventDefault()

    const label = normalizeMoodLabel(customMoodDraft.label)
    const emoji = customMoodDraft.emoji.trim()
    const score = Number(customMoodDraft.score)

    if (!emoji || !label) {
      setCustomMoodMessage('Add both an emoji and a label for the new mood.')
      return
    }

    const duplicateLabel = moodsList.some(
      (mood) => mood.label.toLowerCase() === label.toLowerCase(),
    )

    if (duplicateLabel) {
      setCustomMoodMessage('That mood already exists.')
      return
    }

    let moodId = createMoodId(label)
    let suffix = 2
    while (moodsList.some((mood) => mood.id === moodId)) {
      moodId = `${createMoodId(label)}-${suffix}`
      suffix += 1
    }

    const normalizedMood = {
      id: moodId,
      label,
      emoji,
      score: Math.max(-2, Math.min(2, Math.round(score))),
      custom: true,
    }

    setCustomMoods((currentMoods) => [...currentMoods, normalizedMood])
    setSelectedMood(normalizedMood.id)
    setCustomMoodDraft({ emoji: '', label: '', score: '1' })
    setCustomMoodMessage(`Added ${normalizedMood.emoji} ${normalizedMood.label}.`)
  }

  function deleteCustomMood(moodId) {
    const moodInUse = entries.some((entry) => entry.moodId === moodId)

    if (moodInUse) {
      setCustomMoodMessage('Custom moods with saved entries cannot be deleted yet.')
      return
    }

    setCustomMoods((currentMoods) =>
      currentMoods.filter((mood) => mood.id !== moodId),
    )
    setCustomMoodMessage('Custom mood deleted.')
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      entries,
      favoriteQuotes,
      customMoods,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)

    link.href = objectUrl
    link.download = `moodspace-backup-${stamp}.json`
    link.click()
    URL.revokeObjectURL(objectUrl)
    setImportMessage({ text: 'Backup downloaded.', kind: 'info' })
  }

  function triggerImport() {
    importInputRef.current?.click()
  }

  async function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const rawText = await file.text()
      const parsed = JSON.parse(rawText)
      const importedCustomMoods = normalizeCustomMoods(parsed?.customMoods)
      const importedEntries = normalizeImportedEntries(parsed?.entries, [
        ...moods,
        ...importedCustomMoods,
      ])
      const importedQuotes = Array.isArray(parsed?.favoriteQuotes)
        ? parsed.favoriteQuotes.filter(
            (quote) =>
              typeof quote?.text === 'string' && typeof quote?.author === 'string',
          )
        : []

      setEntries(importedEntries)
      setFavoriteQuotes(importedQuotes)
      setCustomMoods(importedCustomMoods)
      setEditingEntryId(null)
      setEditingMoodId(moodsList[0].id)
      setEditingNote('')
      setSelectedMood(moods[0].id)
      setHistoryFilter('all')
      setHistoryDateFilter('all')
      setHistorySearch('')
      setImportMessage({
        text: `Imported ${importedEntries.length} entries, ${importedQuotes.length} saved quotes, and ${importedCustomMoods.length} custom moods.`,
        kind: 'info',
      })
      setHistoryMessage('Your MoodSpace data was restored.')
      setSaveMessage('')
    } catch {
      setImportMessage({
        text: 'That file could not be imported. Please choose a valid MoodSpace backup.',
        kind: 'error',
      })
    } finally {
      event.target.value = ''
    }
  }

  const quoteIsSaved = favoriteQuotes.some(
    (quote) =>
      quote.text === quoteOfTheDay.text && quote.author === quoteOfTheDay.author,
  )
  const todayLabel = formatLongDate()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-orbit" aria-hidden="true">
          <span className="orbit-dot orbit-dot-large"></span>
          <span className="orbit-dot orbit-dot-small"></span>
          <span className="orbit-ring"></span>
        </div>
        <div className="header-topline">
          <span className="sticker">little feelings diary</span>
          <span className="sparkle" aria-hidden="true">
            *
          </span>
        </div>
        <div className="app-header-row">
          <div>
            <p className="eyebrow">Reflect gently, track honestly</p>
            <h1 className="app-title">MoodSpace</h1>
          </div>

          <nav className="page-nav" aria-label="Primary">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `page-nav-link ${isActive ? 'page-nav-link-active' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/trends"
              className={({ isActive }) =>
                `page-nav-link ${isActive ? 'page-nav-link-active' : ''}`
              }
            >
              Trends
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `page-nav-link ${isActive ? 'page-nav-link-active' : ''}`
              }
            >
              Settings
            </NavLink>
          </nav>
        </div>
        <p className="header-copy">
          A soft little corner for logging feelings, saving kind words, and
          noticing how your days have been holding you.
        </p>
        <HeaderDashboard
          entriesCount={entries.length}
          favoriteQuotesCount={favoriteQuotes.length}
          todayLabel={todayLabel}
        />
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                editingEntryId={editingEntryId}
                entries={entries}
                favoriteQuotes={favoriteQuotes}
                filteredEntries={filteredEntries}
                handleSubmit={handleSubmit}
                historyFilter={historyFilter}
                historyDateFilter={historyDateFilter}
                historyMessage={historyMessage}
                historySearch={historySearch}
                moodsList={moodsList}
                note={note}
                quoteIsSaved={quoteIsSaved}
                quoteOfTheDay={quoteOfTheDay}
                saveMessage={saveMessage}
                selectedMood={selectedMood}
                selectedMoodDetails={selectedMoodDetails}
                setEditingEntryId={setEditingEntryId}
                setEditingMoodId={setEditingMoodId}
                setEditingNote={setEditingNote}
                setHistoryFilter={setHistoryFilter}
                setHistoryDateFilter={setHistoryDateFilter}
                setHistorySearch={setHistorySearch}
                setNote={setNote}
                setSelectedMood={setSelectedMood}
                stats={stats}
                toggleFavoriteQuote={toggleFavoriteQuote}
                deleteEntry={requestDeleteEntry}
                updateEntry={updateEntry}
                editingMoodId={editingMoodId}
                editingNote={editingNote}
              />
            }
          />
          <Route
            path="/trends"
            element={
              <TrendsPage
                activeChartPoint={activeChartPoint}
                entries={entries}
                setActiveChartPoint={setActiveChartPoint}
                stats={stats}
                trendInsights={trendInsights}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                customMoodDraft={customMoodDraft}
                customMoodMessage={customMoodMessage}
                customMoods={customMoods}
                entries={entries}
                exportData={exportData}
                importInputRef={importInputRef}
                importMessage={{ ...importMessage, onImport: handleImport }}
                onAddCustomMood={addCustomMood}
                onDeleteCustomMood={deleteCustomMood}
                selectedTheme={selectedTheme}
                setSelectedTheme={setSelectedTheme}
                setCustomMoodDraft={setCustomMoodDraft}
                triggerImport={triggerImport}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ConfirmDeleteDialog
        entry={entryPendingDelete}
        onCancel={() => setEntryPendingDelete(null)}
        onConfirm={confirmDeleteEntry}
      />

      <footer className="app-footer">
        <p>Designed as a calm little ritual: log, reflect, and notice the pattern.</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}

export default App
