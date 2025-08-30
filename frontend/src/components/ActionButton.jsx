import { useNavigate } from 'react-router-dom'

export default function ActionButton() {
  const navigate = useNavigate()
  return (
    <div className="floating-action-button">
      <button
        className="action-button"
        id="action-btn"
        title="Neue Abstimmung erstellen"
        aria-label="Neue Abstimmung erstellen"
        onClick={() => navigate('/polls/new')}
      />
    </div>
  )
}
