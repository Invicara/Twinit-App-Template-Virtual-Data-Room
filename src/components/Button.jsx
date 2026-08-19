import './Button.css'

function Button({ onClick, children, disabled = false, ...props }) {
  return (
    <button className="app-button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

export default Button
