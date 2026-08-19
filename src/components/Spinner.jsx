import './Spinner.css'

function Spinner({ className = '', ...props }) {
  return <span className={`spinner ${className}`.trim()} aria-label="Loading" {...props} />
}

export default Spinner
