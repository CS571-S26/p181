import { useEffect, useRef } from 'react'
import { formatDate } from '../utils/mood'

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

export default ConfirmDeleteDialog