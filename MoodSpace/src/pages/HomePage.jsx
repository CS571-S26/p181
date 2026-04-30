import { homeHighlights } from '../utils/data'
import { formatDate } from '../utils/mood'

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
              {quoteOfTheDay.author && quoteOfTheDay.author !== 'MoodSpace' ? (
                <footer>{quoteOfTheDay.author}</footer>
              ) : null}
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

export default HomePage