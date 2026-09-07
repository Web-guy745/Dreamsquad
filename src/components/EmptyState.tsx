import { Inbox } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state">
      <Inbox size={22} strokeWidth={1.8} className="empty-state__icon" />
      <p className="empty-state__message">{message}</p>
    </div>
  );
}

export default EmptyState;
