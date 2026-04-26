import { useEffect, useMemo, useRef, useState } from 'react'
import { emojiCategories, homeHighlights, themes } from '../utils/data'
import {
  buildChartPoints,
  buildLinePath,
  formatDate,
  getLocalDateKey,
} from '../utils/mood'

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function buildCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    return {
      date,
      key: getLocalDateKey(date),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    }
  })
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

function MoodCalendar({ entries }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])
  const entriesByDay = useMemo(
    () =>
      entries.reduce((groupedEntries, entry) => {
        const key = getLocalDateKey(entry.createdAt)
        if (!groupedEntries[key]) {
          groupedEntries[key] = []
        }
        groupedEntries[key].push(entry)
        return groupedEntries
      }, {}),
    [entries],
  )

  function shiftMonth(offset) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    )
  }

  return (
    <section className="card calendar-card">
      <div className="card-heading calendar-heading">
        <div>
          <p className="section-label">Calendar</p>
          <h3>{formatMonthLabel(visibleMonth)}</h3>
          <p className="section-copy history-copy">
            A month-at-a-glance view of the feelings you logged.
          </p>
        </div>
        <div className="calendar-actions">
          <button
            type="button"
            className="mini-action-button mini-action-button-ghost"
            onClick={() => shiftMonth(-1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="mini-action-button mini-action-button-ghost"
            onClick={() => shiftMonth(1)}
          >
            Next
          </button>
        </div>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {calendarDays.map((day) => {
          const dayEntries = entriesByDay[day.key] || []
          const visibleEntries = dayEntries.slice(0, 3)

          return (
            <article
              key={day.key}
              className={`calendar-day ${
                day.inCurrentMonth ? '' : 'calendar-day-muted'
              }`}
              aria-label={`${day.date.getDate()}, ${dayEntries.length} check-ins`}
            >
              <span className="calendar-day-number">{day.date.getDate()}</span>
              <div className="calendar-mood-row">
                {visibleEntries.map((entry) => (
                  <span key={entry.id} title={entry.moodLabel}>
                    {entry.emoji}
                  </span>
                ))}
                {dayEntries.length > visibleEntries.length ? (
                  <span className="calendar-more">
                    +{dayEntries.length - visibleEntries.length}
                  </span>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ConfirmDeleteDialog({ entry, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!entry) {
      return undefined
    }

    previousFocusRef.current = document.activeElement
    cancelButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const focusable = Array.from(focusableElements || []).filter(
        (element) => !element.disabled && element.offsetParent !== null,
      )

      if (focusable.length === 0) {
        return
      }

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [entry, onCancel])

  if (!entry) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <span className="confirm-icon" aria-hidden="true">
          {entry.emoji}
        </span>
        <div>
          <p className="section-label">Delete check-in</p>
          <h3 id="delete-dialog-title">Remove this memory?</h3>
          <p className="section-copy">
            This will permanently delete your {entry.moodLabel.toLowerCase()} entry
            from {formatDate(entry.createdAt)}.
          </p>
        </div>
        <div className="confirm-actions">
          <button
            type="button"
            className="mini-action-button mini-action-button-danger"
            onClick={onConfirm}
          >
            Delete entry
          </button>
          <button
            ref={cancelButtonRef}
            type="button"
            className="mini-action-button mini-action-button-ghost"
            onClick={onCancel}
          >
            Keep it
          </button>
        </div>
      </section>
    </div>
  )
}

function HomePage({
  editingEntryId,
  entries,
  favoriteQuotes,
  filteredEntries,
  handleSubmit,
  historyDateFilter,
  historyFilter,
  historyMessage,
  historySearch,
  moodsList,
  note,
  quoteIsSaved,
  quoteOfTheDay,
  saveMessage,
  selectedMood,
  selectedMoodDetails,
  setEditingMoodId,
  setEditingEntryId,
  setEditingNote,
  setHistoryDateFilter,
  setHistoryFilter,
  setHistorySearch,
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

        <div className="history-search-row">
          <label className="history-search-field">
            <span className="field-label">Search entries</span>
            <input
              type="search"
              placeholder="Search notes or moods"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
            />
          </label>
          <label className="history-date-field">
            <span className="field-label">Date range</span>
            <select
              value={historyDateFilter}
              onChange={(event) => setHistoryDateFilter(event.target.value)}
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
            </select>
          </label>
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
        <MoodCalendar entries={entries} />

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

function ThemePicker({ selectedTheme, setSelectedTheme }) {
  return (
    <div className="theme-picker" role="group" aria-label="Choose app theme">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`theme-option ${
            selectedTheme === theme.id ? 'theme-option-active' : ''
          }`}
          onClick={() => setSelectedTheme(theme.id)}
          aria-pressed={selectedTheme === theme.id}
        >
          <span className="theme-preview" aria-hidden="true">
            <span
              className="theme-preview-backdrop"
              style={{
                background: `linear-gradient(135deg, ${theme.swatches[0]}, ${theme.swatches[2]})`,
              }}
            ></span>
            <span
              className="theme-preview-panel"
              style={{ background: theme.swatches[0] }}
            ></span>
            <span
              className="theme-preview-line"
              style={{ background: theme.swatches[1] }}
            ></span>
            <span
              className="theme-preview-dot"
              style={{ background: theme.swatches[2] }}
            ></span>
          </span>
          <span className="theme-option-copy">
            <strong>{theme.label}</strong>
            <span>{theme.description}</span>
          </span>
          <span className="theme-swatches" aria-hidden="true">
            {theme.swatches.map((swatch) => (
              <span key={swatch} style={{ background: swatch }}></span>
            ))}
          </span>
        </button>
      ))}
    </div>
  )
}

function DataTools({
  exportData,
  importInputRef,
  importMessage,
  triggerImport,
}) {
  return (
    <section className="card data-card settings-card">
      <div className="card-heading">
        <div>
          <p className="section-label">Backup tools</p>
          <h3>Backup and restore</h3>
        </div>
      </div>
      <p className="section-copy data-copy">
        Save your MoodSpace entries as a JSON file or restore them later on this
        browser.
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
        aria-label="Choose a MoodSpace backup file to import"
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
  )
}

function CustomMoodManager({
  customMoodDraft,
  customMoodMessage,
  customMoods,
  entries,
  onAddCustomMood,
  onDeleteCustomMood,
  setCustomMoodDraft,
}) {
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(
    emojiCategories[0].id,
  )
  const activeEmojiChoices =
    emojiCategories.find((category) => category.id === activeEmojiCategory)
      ?.emojis ?? emojiCategories[0].emojis
  const customMoodUsage = useMemo(
    () =>
      entries.reduce((usage, entry) => {
        usage[entry.moodId] = (usage[entry.moodId] || 0) + 1
        return usage
      }, {}),
    [entries],
  )

  return (
    <section className="card settings-card custom-moods-card">
      <div className="card-heading">
        <div>
          <p className="section-label">Personal moods</p>
          <h3>Custom mood buttons</h3>
        </div>
      </div>
      <p className="section-copy data-copy">
        Add your own mood options for check-ins, history filters, and trend
        breakdowns.
      </p>

      <form className="custom-mood-form" onSubmit={onAddCustomMood}>
        <div className="custom-emoji-picker">
          <div className="custom-emoji-heading">
            <span className="field-label">Emoji</span>
            <span className="custom-emoji-current" aria-live="polite">
              {customMoodDraft.emoji || '\u{1F642}'}
            </span>
          </div>
          <div
            className="custom-emoji-tabs"
            role="tablist"
            aria-label="Emoji categories"
          >
            {emojiCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`custom-emoji-tab ${
                  activeEmojiCategory === category.id
                    ? 'custom-emoji-tab-active'
                    : ''
                }`}
                onClick={() => setActiveEmojiCategory(category.id)}
                role="tab"
                aria-selected={activeEmojiCategory === category.id}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="custom-emoji-grid" role="group" aria-label="Choose mood emoji">
            {activeEmojiChoices.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`custom-emoji-button ${
                  customMoodDraft.emoji === emoji ? 'custom-emoji-button-active' : ''
                }`}
                onClick={() =>
                  setCustomMoodDraft((draft) => ({
                    ...draft,
                    emoji,
                  }))
                }
                aria-pressed={customMoodDraft.emoji === emoji}
                aria-label={`Use ${emoji} emoji`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <label>
          <span className="field-label">Label</span>
          <input
            maxLength="24"
            placeholder="Hopeful"
            value={customMoodDraft.label}
            onChange={(event) =>
              setCustomMoodDraft((draft) => ({
                ...draft,
                label: event.target.value,
              }))
            }
          />
        </label>
        <label>
          <span className="field-label">Score</span>
          <select
            value={customMoodDraft.score}
            onChange={(event) =>
              setCustomMoodDraft((draft) => ({
                ...draft,
                score: event.target.value,
              }))
            }
          >
            <option value="2">Very light</option>
            <option value="1">Light</option>
            <option value="0">Mixed</option>
            <option value="-1">Heavy</option>
            <option value="-2">Very heavy</option>
          </select>
        </label>
        <button type="submit" className="primary-button">
          Add mood
        </button>
      </form>

      {customMoodMessage ? (
        <p className="import-message">{customMoodMessage}</p>
      ) : null}

      {customMoods.length === 0 ? (
        <p className="empty-state custom-moods-empty">
          Your custom moods will appear here after you add one.
        </p>
      ) : (
        <ul className="custom-mood-list">
          {customMoods.map((mood) => {
            const usageCount = customMoodUsage[mood.id] || 0
            return (
              <li key={mood.id}>
                <span className="custom-mood-pill">
                  <span>{mood.emoji}</span>
                  <strong>{mood.label}</strong>
                </span>
                <span className="custom-mood-meta">
                  {usageCount} {usageCount === 1 ? 'entry' : 'entries'}
                </span>
                <button
                  type="button"
                  className="delete-entry-button"
                  onClick={() => onDeleteCustomMood(mood.id)}
                  disabled={usageCount > 0}
                  aria-label={`Delete ${mood.label} custom mood`}
                >
                  Delete
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function SettingsPage({
  customMoodDraft,
  customMoodMessage,
  customMoods,
  entries,
  exportData,
  importInputRef,
  importMessage,
  onAddCustomMood,
  onDeleteCustomMood,
  selectedTheme,
  setSelectedTheme,
  setCustomMoodDraft,
  triggerImport,
}) {
  const currentTheme =
    themes.find((theme) => theme.id === selectedTheme) ?? themes[0]

  return (
    <div className="page-stack settings-page">
      <section className="hero-panel settings-hero-panel">
        <div className="hero-copy">
          <p className="section-label">Settings</p>
          <h2>Shape the space around your check-ins</h2>
          <p className="section-copy">
            Choose a visual theme and keep a backup of the little reflections you
            have saved here.
          </p>
          <p className="hero-whisper">Current theme: {currentTheme.label}</p>
        </div>

        <div className="hero-side">
          <div className="mini-note">
            <span className="mini-note-pin" aria-hidden="true"></span>
            <p>privacy note</p>
            <strong>Your entries stay in this browser unless you export them.</strong>
          </div>
        </div>
      </section>

      <section className="settings-grid">
        <section className="card settings-card theme-card">
          <div className="card-heading">
            <div>
              <p className="section-label">Appearance</p>
              <h3>Theme picker</h3>
            </div>
          </div>
          <p className="section-copy data-copy">
            Pick the palette that feels best for today. MoodSpace will remember it
            for next time.
          </p>
          <ThemePicker
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
          />
        </section>

        <DataTools
          exportData={exportData}
          importInputRef={importInputRef}
          importMessage={importMessage}
          triggerImport={triggerImport}
        />

        <CustomMoodManager
          customMoodDraft={customMoodDraft}
          customMoodMessage={customMoodMessage}
          customMoods={customMoods}
          entries={entries}
          onAddCustomMood={onAddCustomMood}
          onDeleteCustomMood={onDeleteCustomMood}
          setCustomMoodDraft={setCustomMoodDraft}
        />
      </section>
    </div>
  )
}


export {
  ConfirmDeleteDialog,
  HeaderDashboard,
  HomePage,
  SettingsPage,
  TrendsPage,
}
