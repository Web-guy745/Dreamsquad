import { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import type { Market, PriceRange } from '../types/market';
import './MarketChart.css';

interface MarketChartProps {
  market: Market;
}

const RANGES: PriceRange[] = ['1D', '1W', '1M', 'ALL'];
const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;

function buildPath(values: number[]): { linePath: string; areaPath: string } {
  if (values.length === 0) {
    return { linePath: '', areaPath: '' };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = CHART_WIDTH / Math.max(values.length - 1, 1);

  const points = values.map((value, i) => {
    const x = i * stepX;
    const y = CHART_HEIGHT - ((value - min) / range) * (CHART_HEIGHT - 12) - 6;
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;

  return { linePath, areaPath };
}

function MarketChart({ market }: MarketChartProps): JSX.Element {
  const [range, setRange] = useState<PriceRange>('1D');
  const hasHistory = Boolean(market.priceHistory);

  const { linePath, areaPath } = useMemo(() => {
    if (!market.priceHistory) return { linePath: '', areaPath: '' };
    const values = market.priceHistory[range].map((point) => point.yesPrice);
    return buildPath(values);
  }, [market, range]);

  const isPositive = market.trend !== 'down';

  if (!hasHistory) {
    return (
      <div className="market-chart market-chart--empty surface-card">
        <Activity size={20} strokeWidth={1.8} />
        <p className="market-chart__empty-message">Live market data — chart history not yet available</p>
      </div>
    );
  }

  return (
    <div className="market-chart surface-card">
      <div className="market-chart__canvas-wrap">
        <svg
          className="market-chart__svg"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${market.question} probability chart, ${range} range`}
        >
          <defs>
            <linearGradient id={`chart-fill-${market.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? 'var(--green)' : 'var(--red)'} stopOpacity="0.28" />
              <stop offset="100%" stopColor={isPositive ? 'var(--green)' : 'var(--red)'} stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill={`url(#chart-fill-${market.id})`} stroke="none" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--purple-light)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <div className="market-chart__ranges" role="tablist" aria-label="Chart time range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            className={`market-chart__range-btn ${range === r ? 'market-chart__range-btn--active' : ''}`}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MarketChart;
