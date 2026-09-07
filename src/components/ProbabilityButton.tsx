import './ProbabilityButton.css';

interface ProbabilityButtonProps {
  outcome: 'yes' | 'no';
  price?: number;
  label?: string;
  selected?: boolean;
  onClick?: () => void;
}

function ProbabilityButton({ outcome, price, label, selected = false, onClick }: ProbabilityButtonProps): JSX.Element {
  const hasPrice = typeof price === 'number';

  return (
    <button
      type="button"
      className={`prob-btn prob-btn--${outcome} ${selected ? 'prob-btn--selected' : ''}`}
      onClick={onClick}
      disabled={!hasPrice}
    >
      <span className="prob-btn__label">{label ?? (outcome === 'yes' ? 'Buy YES' : 'Buy NO')}</span>
      <span className="prob-btn__price">{hasPrice ? `${price}¢` : '—'}</span>
    </button>
  );
}

export default ProbabilityButton;
