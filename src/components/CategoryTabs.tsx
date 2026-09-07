import type { MarketCategory } from '../types/market';
import './CategoryTabs.css';

export type CategoryFilter = MarketCategory;

const CATEGORIES: CategoryFilter[] = [
  'Trending',
  'Politics',
  'Sports',
  'Crypto',
  'Technology',
  'Culture',
  'Finance',
];

interface CategoryTabsProps {
  active: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

function CategoryTabs({ active, onChange }: CategoryTabsProps): JSX.Element {
  return (
    <div className="category-tabs" role="tablist" aria-label="Market categories">
      {CATEGORIES.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`category-tabs__item ${isActive ? 'category-tabs__item--active' : ''}`}
            onClick={() => onChange(category)}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryTabs;
