import './MarketCardSkeleton.css';

interface MarketCardSkeletonProps {
  count?: number;
}

function MarketCardSkeleton({ count = 3 }: MarketCardSkeletonProps): JSX.Element {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card market-card-skeleton" aria-hidden="true">
          <div className="market-card-skeleton__category" />
          <div className="market-card-skeleton__question" />
          <div className="market-card-skeleton__meta" />
        </div>
      ))}
    </>
  );
}

export default MarketCardSkeleton;
