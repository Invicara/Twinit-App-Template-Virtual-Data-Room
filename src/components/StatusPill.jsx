import './StatusPill.css'

const STATUS_MODIFIERS = {
  'Approved':   'approved',
  'Rejected':   'rejected',
  'For Review': 'review',
}

function StatusPill({ status, onChange, options, isPending }) {
  const modifier = status ? (STATUS_MODIFIERS[status] ?? '') : ''
  const pillClass = `document-status-pill${modifier ? ` document-status-pill--${modifier}` : ''}`

  if (onChange && options?.length) {
    return (
      <span className={`${pillClass} document-status-pill--select${isPending ? ' document-status-pill--pending' : ''}`}>
        {isPending
          ? <span className="document-status-pill-spinner" aria-label="Updating status" />
          : (
            <select
              className="document-status-pill-select"
              value={status ?? ''}
              onChange={e => onChange(e.target.value)}
              onClick={e => e.stopPropagation()}
            >
              {status
                ? <option value={status} disabled hidden>{status}</option>
                : <option value="" disabled>—</option>
              }
              {options.map(opt => (
                <option className="document-status-pill-option" key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )
        }
      </span>
    )
  }

  if (!status) return '—'
  return <span className={pillClass}>{status}</span>
}

export default StatusPill
