import { useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import MarketCard from '../components/MarketCard';
import MarketCardSkeleton from '../components/MarketCardSkeleton';
import EmptyState from '../components/EmptyState';
import { useMarkets, useMarketSearch } from '../hooks/useMarkets';
import type { MarketCategory } from '../types/market';
import './Search.css';

const RECENT_SEARCHES = ['Bitcoin $150K', 'Election runoff', 'Fed rate cut'];
const CATEGORIES: MarketCategory[] = ['Politics', 'Sports', 'Crypto', 'Technology', 'Culture', 'Finance'];

interface SearchProps {
  onSelectMarket: (id: string) => void;
}

function Search({ onSelectMarket }: SearchProps): JSX.Element {
  const [query, setQuery] = useState<string>('');
  const isSearching = query.trim().length > 0;

  const { data: allMarkets } = useMarkets();
  const { data: results, isLoading: isSearchLoading } = useMarketSearch(query);

  const trending = useMemo(
    () => [...(allMarkets ?? [])].sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0)).slice(0, 4),
    [allMarkets],
  );

  return (
    <div className="page search-page">
      <div className="search-page__input-wrap">
        <SearchIcon size={17} strokeWidth={2.2} className="search-page__input-icon" />
        <input
          type="text"
          className="search-page__input"
          placeholder="Search markets"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search markets"
        />
      </div>

      {isSearching ? (
        <div className="page__section">
          <h2 className="page__section-title">Results</h2>
          <div className="market-list">
            {isSearchLoading && <MarketCardSkeleton count={2} />}
            {!isSearchLoading && results?.length === 0 && (
              <EmptyState message={`No markets match "${query}".`} />
            )}
            {!isSearchLoading &&
              results?.map((market) => <MarketCard key={market.id} market={market} onClick={onSelectMarket} />)}
          </div>
        </div>
      ) : (
        <>
          <div className="page__section">
            <h2 className="page__section-title">Recent Searches</h2>
            <div className="search-page__recent">
              {RECENT_SEARCHES.map((term) => (
                <button key={term} type="button" className="search-page__recent-chip" onClick={() => setQuery(term)}>
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="page__section">
            <h2 className="page__section-title">Trending Markets</h2>
            <div className="market-list">
              {trending.map((market) => (
                <MarketCard key={market.id} market={market} onClick={onSelectMarket} />
              ))}
            </div>
          </div>

          <div className="page__section">
            <h2 className="page__section-title">Categories</h2>
            <div className="search-page__categories">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="search-page__category-chip"
                  onClick={() => setQuery(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Search;
