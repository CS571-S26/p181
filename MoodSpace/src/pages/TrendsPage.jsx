import { useMemo, useState } from 'react'
import {
  buildChartPoints,
  buildDailySeries,
  buildLinePath,
  getLocalDateKey,
  MOOD_SCORE_MAX,
  MOOD_SCORE_MIN,
} from '../utils/mood'

const chartRangeOptions = [
  { days: 14, label: '2W' },
  { days: 30, label: '1M' },
  { days: 60, label: '2M' },
  { days: 90, label: '3M' },
]

const moodAxisLabels = [
  { label: '+5', value: MOOD_SCORE_MAX },
  { label: '+2.5', value: 2.5 },
  { label: '0', value: 0 },
  { label: '-2.5', value: -2.5 },
  { label: '-5', value: MOOD_SCORE_MIN },
]

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

function TrendsPage({
  activeChartPoint,
  entries,
  setActiveChartPoint,
  stats,
  trendInsights,
}) {
  const [chartRangeDays, setChartRangeDays] = useState(14)
  const dailySeries = useMemo(
    () => buildDailySeries(entries, chartRangeDays),
    [chartRangeDays, entries],
  )
  const chartWidth = 860
  const chartHeight = 300
  const chartPadding = 32
  const chartLeftPadding = 92
  const linePath = buildLinePath(
    dailySeries,
    chartWidth,
    chartHeight,
    chartPadding,
    chartLeftPadding,
  )
  const chartPoints = buildChartPoints(
    dailySeries,
    chartWidth,
    chartHeight,
    chartPadding,
    chartLeftPadding,
  )
  const chartHitZones = chartPoints.map((point, index) => {
    const previousPoint = chartPoints[index - 1]
    const nextPoint = chartPoints[index + 1]
    const leftBoundary = previousPoint
      ? (previousPoint.x + point.x) / 2
      : chartLeftPadding
    const rightBoundary = nextPoint
      ? (point.x + nextPoint.x) / 2
      : chartWidth - chartPadding

    return {
      ...point,
      hitX: leftBoundary,
      hitWidth: Math.max(28, rightBoundary - leftBoundary),
    }
  })
  const labelInterval = Math.max(1, Math.ceil(dailySeries.length / 5))

  function selectNearestChartPoint(event) {
    if (chartPoints.length === 0) {
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * chartWidth
    const clampedX = Math.min(
      chartWidth - chartPadding,
      Math.max(chartLeftPadding, pointerX),
    )
    const nearestPoint = chartPoints.reduce((nearest, point) =>
      Math.abs(point.x - clampedX) < Math.abs(nearest.x - clampedX)
        ? point
        : nearest,
    )

    setActiveChartPoint(nearestPoint)
  }

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
                Daily averages from your selected check-in window.
              </p>
            </div>
            <div
              className="chart-range-controls"
              role="group"
              aria-label="Choose mood graph date range"
            >
              {chartRangeOptions.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  className={`chart-range-button ${
                    chartRangeDays === option.days ? 'chart-range-button-active' : ''
                  }`}
                  onClick={() => {
                    setChartRangeDays(option.days)
                    setActiveChartPoint(null)
                  }}
                  aria-pressed={chartRangeDays === option.days}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="empty-state">
              Add a few check-ins and MoodSpace will start drawing your mood line here.
            </p>
          ) : (
            <div className="chart-shell">
              <div className="chart-stage">
                <svg
                  className="trend-chart"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="img"
                  aria-label="Line graph of average mood over time"
                  onMouseMove={selectNearestChartPoint}
                  onMouseLeave={() => setActiveChartPoint(null)}
                >
                  {moodAxisLabels.map((axisLabel) => {
                    const y =
                      chartPadding +
                      ((MOOD_SCORE_MAX - axisLabel.value) /
                        (MOOD_SCORE_MAX - MOOD_SCORE_MIN)) *
                        (chartHeight - chartPadding * 2)
                    return (
                      <g key={axisLabel.label}>
                        <text
                          x={chartLeftPadding - 16}
                          y={y}
                          className="trend-axis-label"
                          dominantBaseline="middle"
                          textAnchor="end"
                        >
                          {axisLabel.label}
                        </text>
                        <line
                          x1={chartLeftPadding}
                          y1={y}
                          x2={chartWidth - chartPadding}
                          y2={y}
                          className="trend-grid-line"
                        />
                      </g>
                    )
                  })}
                  <path d={linePath} className="trend-line-path" />
                  {chartHitZones.map((point) => (
                    <g key={point.key}>
                      {activeChartPoint?.key === point.key ? (
                        <line
                          x1={point.x}
                          y1={chartPadding}
                          x2={point.x}
                          y2={chartHeight - chartPadding}
                          className="trend-selected-guide"
                        />
                      ) : null}
                      <rect
                        x={point.hitX}
                        y={chartPadding}
                        width={point.hitWidth}
                        height={chartHeight - chartPadding * 2}
                        rx="10"
                        className="trend-line-hit"
                        onFocus={() => setActiveChartPoint(point)}
                        onBlur={() => setActiveChartPoint(null)}
                        tabIndex="0"
                        role="button"
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
                        Average mood score: {activeChartPoint.average?.toFixed(1)} / {MOOD_SCORE_MAX}
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
                <div
                  className="chart-label-row"
                  style={{
                    '--chart-label-count': dailySeries.length,
                    '--chart-left-gutter': `${(chartLeftPadding / chartWidth) * 100}%`,
                    '--chart-right-gutter': `${(chartPadding / chartWidth) * 100}%`,
                  }}
                >
                  {dailySeries.map((point, index) => (
                    <span key={point.key}>
                      {index % labelInterval === 0 || index === dailySeries.length - 1
                        ? point.label
                        : ''}
                    </span>
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

export default TrendsPage
