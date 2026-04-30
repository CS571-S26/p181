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

export default HeaderDashboard