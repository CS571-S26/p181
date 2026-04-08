import { useEffect, useMemo, useRef, useState } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const STORAGE_KEY = 'moodspace.entries'
const FAVORITES_KEY = 'moodspace.favoriteQuotes'

const moods = [
  { id: 'happy', label: 'Happy', emoji: '\u{1F60A}', score: 2 },
  { id: 'calm', label: 'Calm', emoji: '\u{1F60C}', score: 1 },
  { id: 'tired', label: 'Tired', emoji: '\u{1F634}', score: -1 },
  { id: 'sad', label: 'Sad', emoji: '\u{1F622}', score: -2 },
  { id: 'angry', label: 'Angry', emoji: '\u{1F620}', score: -2 },
  { id: 'stressed', label: 'Stressed', emoji: '\u{1F635}', score: -1 },
]

const quotes = [
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

const homeHighlights = [
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
  return quotes[index]
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`))
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
      entries.map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10)),
    ),
  ].sort((left, right) => right.localeCompare(left))

  let streak = 0
  const currentDay = new Date()

  for (let index = 0; index < uniqueDays.length; index += 1) {
    const comparisonDay = new Date(currentDay)
    comparisonDay.setHours(0, 0, 0, 0)
    comparisonDay.setDate(comparisonDay.getDate() - index)

    const expectedDay = comparisonDay.toISOString().slice(0, 10)
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
      entries.map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10)),
    ),
  ].sort()

  let best = 1
  let current = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(`${uniqueDays[index - 1]}T00:00:00`)
    const currentDay = new Date(`${uniqueDays[index]}T00:00:00`)
    const difference = (currentDay - previous) / 86400000

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
    const key = new Date(entry.createdAt).toISOString().slice(0, 10)
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
    const key = pointDate.toISOString().slice(0, 10)
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

function buildLinePath(series, width, height, padding) {
  const usableSeries = series.filter((point) => point.average !== null)
  if (usableSeries.length === 0) {
    return ''
  }

  const minScore = -2
  const maxScore = 2
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  return usableSeries
    .map((point, index) => {
      const originalIndex = series.findIndex((item) => item.key === point.key)
      const x =
        padding +
        (series.length === 1 ? 0 : (originalIndex / (series.length - 1)) * innerWidth)
      const normalized = (point.average - minScore) / (maxScore - minScore)
      const y = height - padding - normalized * innerHeight
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function buildChartPoints(series, width, height, padding) {
  const minScore = -2
  const maxScore = 2
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  return series
    .map((point, index) => {
      if (point.average === null) {
        return null
      }

      const x =
        padding +
        (series.length === 1 ? 0 : (index / (series.length - 1)) * innerWidth)
      const normalized = (point.average - minScore) / (maxScore - minScore)
      const y = height - padding - normalized * innerHeight

      return { ...point, x, y }
    })
    .filter(Boolean)
}

function normalizeImportedEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return []
  }

  return rawEntries
    .map((entry) => {
      const fallbackMood = moods.find((mood) => mood.id === entry?.moodId) ?? moods[0]
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

function OverviewStrip() {
  return (
    <section className="overview-strip" aria-label="MoodSpace overview">
      {homeHighlights.map((highlight, index) => (
        <article key={highlight.title} className="overview-card">
          <span className="overview-index">0{index + 1}</span>
          <h3>{highlight.title}</h3>
          <p>{highlight.copy}</p>
        </article>
      ))}
    </section>
  )
}

function HistoryEntryCard({
  deleteEntry,
  editingEntryId,
  editingMoodId,
  editingNote,
  entry,
  moodsList,
  setEditingEntryId,
  setEditingMoodId,
  setEditingNote,
  updateEntry,
}) {
  return (
    <li className="entry-item">
      <span className="entry-pin" aria-hidden="true"></span>
      {editingEntryId === entry.id ? (
        <>
          <div className="entry-topline">
            <div className="entry-mood">
              <span className="entry-emoji">
                {moodsList.find((mood) => mood.id === editingMoodId)?.emoji}
              </span>
              <div>
                <strong>Edit memory</strong>
                <p>{formatDate(entry.createdAt)}</p>
              </div>
            </div>
            <div className="entry-actions">
              <span className="entry-tag">editing</span>
            </div>
          </div>

          <div className="entry-edit-grid">
            {moodsList.map((mood) => (
              <button
                key={mood.id}
                type="button"
                className={`entry-mood-chip ${
                  editingMoodId === mood.id ? 'entry-mood-chip-active' : ''
                }`}
                onClick={() => setEditingMoodId(mood.id)}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>

          <label className="entry-edit-field">
            <span className="visually-hidden">Edit note</span>
            <textarea
              rows="4"
              value={editingNote}
              onChange={(event) => setEditingNote(event.target.value)}
            />
          </label>

          <div className="entry-edit-actions">
            <button
              type="button"
              className="mini-action-button"
              onClick={() => updateEntry(entry.id)}
            >
              Save changes
            </button>
            <button
              type="button"
              className="mini-action-button mini-action-button-ghost"
              onClick={() => {
                setEditingEntryId(null)
                setEditingMoodId(moodsList[0].id)
                setEditingNote('')
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="entry-topline">
            <div className="entry-mood">
              <span className="entry-emoji">{entry.emoji}</span>
              <div>
                <strong>{entry.moodLabel}</strong>
                <p>{formatDate(entry.createdAt)}</p>
              </div>
            </div>
            <div className="entry-actions">
              <span className="entry-tag">saved feeling</span>
              <button
                type="button"
                className="delete-entry-button"
                onClick={() => {
                  setEditingEntryId(entry.id)
                  setEditingMoodId(entry.moodId)
                  setEditingNote(entry.note)
                }}
                aria-label={`Edit ${entry.moodLabel} entry from ${formatDate(entry.createdAt)}`}
              >
                Edit
              </button>
              <button
                type="button"
                className="delete-entry-button"
                onClick={() => deleteEntry(entry.id)}
                aria-label={`Delete ${entry.moodLabel} entry from ${formatDate(entry.createdAt)}`}
              >
                Delete
              </button>
            </div>
          </div>
          <p className="entry-note">{entry.note || 'No note added for this check-in.'}</p>
        </>
      )}
    </li>
  )
}

function HeaderDashboard({ entriesCount, favoriteQuotesCount, todayLabel }) {
  return (
    <div className="header-dashboard" aria-label="MoodSpace snapshot">
      <article className="dashboard-card dashboard-card-wide">
        <span className="dashboard-label">Today</span>
        <strong>{todayLabel}</strong>
        <p>Show up for a two-minute check-in and let that be enough.</p>
      </article>
      <article className="dashboard-card">
        <span className="dashboard-label">Saved entries</span>
        <strong>{entriesCount}</strong>
        <p>Moments you have already captured.</p>
      </article>
      <article className="dashboard-card">
        <span className="dashboard-label">Favorite quotes</span>
        <strong>{favoriteQuotesCount}</strong>
        <p>Kind words you wanted to keep nearby.</p>
      </article>
    </div>
  )
}

function HomePage({
  editingEntryId,
  entries,
  favoriteQuotes,
  filteredEntries,
  handleSubmit,
  historyFilter,
  historyMessage,
  importInputRef,
  importMessage,
  moodsList,
  note,
  quoteIsSaved,
  quoteOfTheDay,
  saveMessage,
  selectedMood,
  selectedMoodDetails,
  triggerImport,
  exportData,
  setEditingMoodId,
  setEditingEntryId,
  setEditingNote,
  setHistoryFilter,
  setNote,
  setSelectedMood,
  stats,
  toggleFavoriteQuote,
  deleteEntry,
  updateEntry,
  editingMoodId,
  editingNote,
}) {
  return (
    <div className="page-stack home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="section-label">Today&apos;s prompt</p>
          <h2>How are you feeling right now?</h2>
          <p className="section-copy">
            Pick the feeling that fits best, scribble a note if you want, and keep a
            tiny record of today.
          </p>
          <p className="hero-whisper">No pressure. Honest and imperfect is perfect.</p>
        </div>

        <div className="hero-side">
          <div className="mini-note">
            <span className="mini-note-pin" aria-hidden="true"></span>
            <p>little reminder</p>
            <strong>You can log a tiny moment. It still counts.</strong>
          </div>

          <div className="stats-grid">
            <article className="stat-card stat-card-peach">
              <span className="stat-value">{stats.totalEntries}</span>
              <span className="stat-label">Total logs</span>
            </article>
            <article className="stat-card stat-card-rose">
              <span className="stat-value">{stats.streak}</span>
              <span className="stat-label">Current streak</span>
            </article>
            <article className="stat-card stat-card-wide stat-card-cream">
              <span className="stat-value stat-value-text">{stats.averageLabel}</span>
              <span className="stat-label">Overall trend</span>
            </article>
          </div>
        </div>
      </section>

      <OverviewStrip />

      <section className="content-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="card-heading">
            <div>
              <p className="section-label">Mood check-in</p>
              <h3>Log this little moment</h3>
            </div>
            <div className="mood-preview" aria-live="polite">
              <span>{selectedMoodDetails.emoji}</span>
              <span>{selectedMoodDetails.label}</span>
            </div>
          </div>

          <div className="mood-grid">
            {moodsList.map((mood) => (
              <button
                key={mood.id}
                type="button"
                className={`mood-option ${
                  selectedMood === mood.id ? 'mood-option-active' : ''
                }`}
                onClick={() => setSelectedMood(mood.id)}
              >
                <span className="mood-option-emoji">{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>

          <label className="notes-field">
            <span className="field-label">Optional note</span>
            <textarea
              rows="5"
              placeholder="What happened today? Anything you want to remember?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          <div className="form-footer">
            <button className="primary-button" type="submit">
              Save check-in
            </button>
            {saveMessage ? <p className="save-message">{saveMessage}</p> : null}
          </div>
        </form>

        <div className="sidebar-stack">
          <section className="card quote-card">
            <div className="card-heading">
              <div>
                <p className="section-label">Daily encouragement</p>
                <h3>A little note for today</h3>
              </div>
              <button
                type="button"
                className={`ghost-button ${quoteIsSaved ? 'ghost-button-active' : ''}`}
                onClick={toggleFavoriteQuote}
              >
                {quoteIsSaved ? 'Saved' : 'Save quote'}
              </button>
            </div>
            <blockquote>
              "{quoteOfTheDay.text}"
              <footer>{quoteOfTheDay.author}</footer>
            </blockquote>
          </section>

          <section className="card favorites-card">
            <div className="card-heading">
              <div>
                <p className="section-label">Saved words</p>
                <h3>Favorite quotes</h3>
              </div>
            </div>
            {favoriteQuotes.length === 0 ? (
              <p className="empty-state">Save today&apos;s quote to build your list.</p>
            ) : (
              <ul className="favorites-list">
                {favoriteQuotes.map((quote) => (
                  <li key={`${quote.text}-${quote.author}`}>
                    <p>{quote.text}</p>
                    <span>{quote.author}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card data-card">
            <div className="card-heading">
              <div>
                <p className="section-label">Backup tools</p>
                <h3>Export or import</h3>
              </div>
            </div>
            <p className="section-copy data-copy">
              Save your MoodSpace entries as a JSON file or restore them later.
            </p>
            <div className="data-actions">
              <button type="button" className="ghost-button" onClick={exportData}>
                Export data
              </button>
              <button type="button" className="ghost-button" onClick={triggerImport}>
                Import data
              </button>
            </div>
            <input
              ref={importInputRef}
              className="visually-hidden"
              type="file"
              accept="application/json"
              onChange={importMessage.onImport}
            />
            {importMessage.text ? (
              <p
                className={`import-message ${
                  importMessage.kind === 'error' ? 'import-message-error' : ''
                }`}
              >
                {importMessage.text}
              </p>
            ) : null}
          </section>
        </div>
      </section>

      <section className="card history-card">
        <div className="card-heading history-heading">
          <div>
            <p className="section-label">Reflection history</p>
            <h3>Memory wall</h3>
            <p className="section-copy history-copy">
              Little scraps from your days, all pinned in one place.
            </p>
          </div>
          <span className="history-badge">{entries.length} keepsakes</span>
        </div>

        <div className="history-toolbar">
          <div className="filter-row" role="group" aria-label="Filter entries by mood">
            <button
              type="button"
              className={`filter-chip ${historyFilter === 'all' ? 'filter-chip-active' : ''}`}
              onClick={() => setHistoryFilter('all')}
            >
              All moods
            </button>
            {moodsList.map((mood) => (
              <button
                key={mood.id}
                type="button"
                className={`filter-chip ${
                  historyFilter === mood.id ? 'filter-chip-active' : ''
                }`}
                onClick={() => setHistoryFilter(mood.id)}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
          <p className="filter-summary">
            Showing {filteredEntries.length} of {entries.length} entries
          </p>
        </div>

        {historyMessage ? <p className="history-message">{historyMessage}</p> : null}

        {entries.length === 0 ? (
          <p className="empty-state">
            Your first check-in will appear here. Start with a quick mood log.
          </p>
        ) : filteredEntries.length === 0 ? (
          <p className="empty-state">
            No entries match this mood yet. Try another filter or log a new check-in.
          </p>
        ) : (
          <ul className="entry-list">
            {filteredEntries.map((entry) => (
              <HistoryEntryCard
                key={entry.id}
                deleteEntry={deleteEntry}
                editingEntryId={editingEntryId}
                editingMoodId={editingMoodId}
                editingNote={editingNote}
                entry={entry}
                moodsList={moodsList}
                setEditingEntryId={setEditingEntryId}
                setEditingMoodId={setEditingMoodId}
                setEditingNote={setEditingNote}
                updateEntry={updateEntry}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function TrendsPage({
  activeChartPoint,
  entries,
  setActiveChartPoint,
  stats,
  trendInsights,
  dailySeries,
}) {
  const chartWidth = 720
  const chartHeight = 260
  const chartPadding = 28
  const linePath = buildLinePath(dailySeries, chartWidth, chartHeight, chartPadding)
  const chartPoints = buildChartPoints(
    dailySeries,
    chartWidth,
    chartHeight,
    chartPadding,
  )

  return (
    <div className="page-stack trends-page">
      <section className="hero-panel trends-hero-panel">
        <div className="hero-copy">
          <p className="section-label">Mood trends</p>
          <h2>See the shape of your days</h2>
          <p className="section-copy">
            This page turns your check-ins into patterns you can actually notice:
            streaks, recent activity, common moods, and a line graph over time.
          </p>
          <p className="hero-whisper">Averages are grouped by day to keep the graph readable.</p>
        </div>

        <div className="hero-side">
          <div className="mini-note">
            <span className="mini-note-pin" aria-hidden="true"></span>
            <p>what this means</p>
            <strong>Higher on the graph means lighter moods. Lower means tougher days.</strong>
          </div>

          <div className="stats-grid">
            <article className="stat-card stat-card-peach">
              <span className="stat-value">{stats.streak}</span>
              <span className="stat-label">Current streak</span>
            </article>
            <article className="stat-card stat-card-rose">
              <span className="stat-value">{trendInsights.longestStreak}</span>
              <span className="stat-label">Best streak</span>
            </article>
            <article className="stat-card stat-card-wide stat-card-cream">
              <span className="stat-value stat-value-text">
                {trendInsights.topMood
                  ? `${trendInsights.topMood.emoji} ${trendInsights.topMood.label}`
                  : 'Not enough data yet'}
              </span>
              <span className="stat-label">Most common mood</span>
            </article>
          </div>
        </div>
      </section>

      <section className="trends-page-grid">
        <section className="card trends-card trends-chart-card">
          <div className="card-heading trends-heading">
            <div>
              <p className="section-label">Over time</p>
              <h3>Mood line graph</h3>
              <p className="section-copy history-copy">
                Daily averages from your most recent two weeks of check-ins.
              </p>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="empty-state">
              Add a few check-ins and MoodSpace will start drawing your mood line here.
            </p>
          ) : (
            <div className="chart-shell">
              <div className="chart-scale">
                <span>Happy</span>
                <span>Calm</span>
                <span>Neutral</span>
                <span>Low</span>
                <span>Tough</span>
              </div>
              <div className="chart-stage">
                <svg
                  className="trend-chart"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="img"
                  aria-label="Line graph of average mood over time"
                >
                  {[0, 1, 2, 3, 4].map((step) => {
                    const y = chartPadding + ((chartHeight - chartPadding * 2) / 4) * step
                    return (
                      <line
                        key={step}
                        x1={chartPadding}
                        y1={y}
                        x2={chartWidth - chartPadding}
                        y2={y}
                        className="trend-grid-line"
                      />
                    )
                  })}
                  <path d={linePath} className="trend-line-path" />
                  {chartPoints.map((point) => (
                    <g key={point.key}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="12"
                        className="trend-line-hit"
                        onMouseEnter={() => setActiveChartPoint(point)}
                        onFocus={() => setActiveChartPoint(point)}
                        onMouseLeave={() => setActiveChartPoint(null)}
                        onBlur={() => setActiveChartPoint(null)}
                        tabIndex="0"
                        aria-label={`${point.label}: average mood ${point.average?.toFixed(1)}`}
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={activeChartPoint?.key === point.key ? '7' : '5'}
                        className="trend-line-point"
                      />
                    </g>
                  ))}
                </svg>
                <div className="chart-tooltip-card">
                  {activeChartPoint ? (
                    <>
                      <span className="trend-summary-label">Selected day</span>
                      <strong>{activeChartPoint.label}</strong>
                      <p>
                        Average mood score: {activeChartPoint.average?.toFixed(1)} / 2
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="trend-summary-label">Selected day</span>
                      <strong>Hover a point</strong>
                      <p>Move over the graph to inspect a specific day.</p>
                    </>
                  )}
                </div>
                <div className="chart-label-row">
                  {dailySeries.map((point) => (
                    <span key={point.key}>{point.label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="card trends-card">
          <div className="card-heading trends-heading">
            <div>
              <p className="section-label">Snapshots</p>
              <h3>Trend highlights</h3>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="empty-state">
              Once you log a few entries, this page will start surfacing patterns.
            </p>
          ) : (
            <div className="trends-layout">
              <div className="trend-summary-grid">
                <article className="trend-summary-card">
                  <span className="trend-summary-label">Last 7 days</span>
                  <strong>{trendInsights.lastSevenDaysCount} check-ins</strong>
                </article>
                <article className="trend-summary-card">
                  <span className="trend-summary-label">Latest entry</span>
                  <strong>
                    {trendInsights.latestEntry
                      ? `${trendInsights.latestEntry.emoji} ${trendInsights.latestEntry.moodLabel}`
                      : 'Nothing yet'}
                  </strong>
                </article>
                <article className="trend-summary-card">
                  <span className="trend-summary-label">Average mood</span>
                  <strong>{stats.averageLabel}</strong>
                </article>
              </div>

              <div className="trend-bars">
                {trendInsights.moodBreakdown.map((mood) => (
                  <div key={mood.id} className="trend-row">
                    <div className="trend-row-label">
                      <span>{mood.emoji}</span>
                      <span>{mood.label}</span>
                    </div>
                    <div className="trend-bar-track" aria-hidden="true">
                      <div
                        className="trend-bar-fill"
                        style={{ width: `${mood.count === 0 ? 0 : Math.max(mood.percentage, 6)}%` }}
                      ></div>
                    </div>
                    <span className="trend-count">
                      {mood.count} {mood.count === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  )
}

function AppShell() {
  const importInputRef = useRef(null)
  const [entries, setEntries] = useState(() => readStoredValue(STORAGE_KEY, []))
  const [favoriteQuotes, setFavoriteQuotes] = useState(() =>
    readStoredValue(FAVORITES_KEY, []),
  )
  const [selectedMood, setSelectedMood] = useState(moods[0].id)
  const [historyFilter, setHistoryFilter] = useState('all')
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editingMoodId, setEditingMoodId] = useState(moods[0].id)
  const [editingNote, setEditingNote] = useState('')
  const [activeChartPoint, setActiveChartPoint] = useState(null)
  const [note, setNote] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [historyMessage, setHistoryMessage] = useState('')
  const [importMessage, setImportMessage] = useState({ text: '', kind: 'info' })

  const quoteOfTheDay = useMemo(() => getDailyQuote(), [])
  const selectedMoodDetails = moods.find((mood) => mood.id === selectedMood) ?? moods[0]

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteQuotes))
  }, [favoriteQuotes])

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
        moodBreakdown: moods.map((mood) => ({
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

    const moodBreakdown = moods.map((mood) => {
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
  }, [entries])

  const dailySeries = useMemo(() => buildDailySeries(entries, 14), [entries])

  const filteredEntries = useMemo(() => {
    if (historyFilter === 'all') {
      return entries
    }

    return entries.filter((entry) => entry.moodId === historyFilter)
  }, [entries, historyFilter])

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

  function deleteEntry(entryId) {
    if (editingEntryId === entryId) {
      setEditingEntryId(null)
      setEditingMoodId(moods[0].id)
      setEditingNote('')
    }
    setEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId),
    )
    setHistoryMessage('Entry deleted from your memory wall.')
    setSaveMessage('')
  }

  function updateEntry(entryId) {
    const chosenMood = moods.find((mood) => mood.id === editingMoodId) ?? moods[0]

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
    setEditingMoodId(moods[0].id)
    setEditingNote('')
    setHistoryMessage('Entry updated.')
    setSaveMessage('')
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      entries,
      favoriteQuotes,
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
      const importedEntries = normalizeImportedEntries(parsed?.entries)
      const importedQuotes = Array.isArray(parsed?.favoriteQuotes)
        ? parsed.favoriteQuotes.filter(
            (quote) =>
              typeof quote?.text === 'string' && typeof quote?.author === 'string',
          )
        : []

      setEntries(importedEntries)
      setFavoriteQuotes(importedQuotes)
      setEditingEntryId(null)
      setEditingMoodId(moods[0].id)
      setEditingNote('')
      setHistoryFilter('all')
      setImportMessage({
        text: `Imported ${importedEntries.length} entries and ${importedQuotes.length} saved quotes.`,
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
                historyMessage={historyMessage}
                importInputRef={importInputRef}
                importMessage={{ ...importMessage, onImport: handleImport }}
                moodsList={moods}
                note={note}
                quoteIsSaved={quoteIsSaved}
                quoteOfTheDay={quoteOfTheDay}
                saveMessage={saveMessage}
                selectedMood={selectedMood}
                selectedMoodDetails={selectedMoodDetails}
                triggerImport={triggerImport}
                exportData={exportData}
                setEditingEntryId={setEditingEntryId}
                setEditingMoodId={setEditingMoodId}
                setEditingNote={setEditingNote}
                setHistoryFilter={setHistoryFilter}
                setNote={setNote}
                setSelectedMood={setSelectedMood}
                stats={stats}
                toggleFavoriteQuote={toggleFavoriteQuote}
                deleteEntry={deleteEntry}
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
                dailySeries={dailySeries}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

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
