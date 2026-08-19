import './CancelButton.css'

function CancelButton({ onClick, children = 'Cancel', ...props }) {
  return (
    <button className="cancel-button" onClick={onClick} {...props}>
      {children}
    </button>
  )
}

export default CancelButton
