import { useMemo, useState } from 'react'
import { emojiCategories, themes } from '../utils/data'

const customMoodScoreOptions = Array.from({ length: 11 }, (_, index) => 5 - index)

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
          title={`${theme.label}: ${theme.description}`}
          aria-label={`Choose ${theme.label} theme. ${theme.description}`}
        >
          <span className="theme-swatches" aria-hidden="true">
            {theme.swatches.map((swatch) => (
              <span key={swatch} style={{ background: swatch }}></span>
            ))}
          </span>
          <span className="theme-tooltip" role="tooltip">
            <strong>{theme.label}</strong>
            <span>{theme.description}</span>
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
          <span className="field-label">Score (-5 to 5)</span>
          <select
            value={customMoodDraft.score}
            onChange={(event) =>
              setCustomMoodDraft((draft) => ({
                ...draft,
                score: event.target.value,
              }))
            }
          >
            {customMoodScoreOptions.map((score) => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
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


export default SettingsPage