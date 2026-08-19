import { useSubsectionStatus } from '../services/useSubsections'
import Spinner from './Spinner'
import './SubsectionStatusBar.css'

function SubsectionStatusBar({ sectionId, subsectionId }) {
  const { data: status, isPending } = useSubsectionStatus(sectionId, subsectionId)

  if (isPending) {
    return <Spinner className="subsection-status-bar-spinner" />
  }

  if (!status || status.total === 0) {
    return <span className="subsection-status-bar-empty">—</span>
  }

  const approvedPct  = ((status['Approved']   ?? 0) / status.total) * 100
  const rejectedPct  = ((status['Rejected']   ?? 0) / status.total) * 100
  const reviewPct    = ((status['For Review'] ?? 0) / status.total) * 100

  return (
    <div className="subsection-status-bar-wrap">
      <div className="subsection-status-bar">
        {approvedPct > 0 && (
          <div
            className="subsection-status-bar-segment subsection-status-bar-segment--approved"
            style={{ width: `${approvedPct}%` }}
            title={`Approved: ${status['Approved']}`}
          />
        )}
        {rejectedPct > 0 && (
          <div
            className="subsection-status-bar-segment subsection-status-bar-segment--rejected"
            style={{ width: `${rejectedPct}%` }}
            title={`Rejected: ${status['Rejected']}`}
          />
        )}
        {reviewPct > 0 && (
          <div
            className="subsection-status-bar-segment subsection-status-bar-segment--review"
            style={{ width: `${reviewPct}%` }}
            title={`For Review: ${status['For Review']}`}
          />
        )}
      </div>
      <span className="subsection-status-bar-total">{status.total}</span>
    </div>
  )
}

export default SubsectionStatusBar
