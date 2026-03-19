import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">MoodSpace</h1>
      </header>

      <main className="app-main">
        <section className="counter-panel">
          <p className="counter-value">{count}</p>
          <button
            className="counter-button"
            onClick={() => setCount((currentCount) => currentCount + 1)}
          >
            Increase counter
          </button>
        </section>
      </main>
    </div>
  )
}

export default App
