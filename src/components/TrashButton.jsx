import './TrashButton.css'

function TrashButton({ onClick, children = 'Move to Trash', disabled = false, ...props }) {
  return (
    <button className="trash-button" onClick={onClick} disabled={disabled} {...props}>
      <svg
        className="trash-button-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
      {children}
    </button>
  )
}

export default TrashButton
