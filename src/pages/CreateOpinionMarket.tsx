import { useMemo, useState, type FormEvent } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import {
  createOpinionMarket,
  describeOpinionMarket,
} from '../services/opinionMarkets';
import { useMarkets } from '../hooks/useMarkets';
import type { Market } from '../types/market';
import './CreateOpinionMarket.css';

interface CreateOpinionMarketProps {
  onBack: () => void;
  onCreated: () => void;
}

function CreateOpinionMarket({
  onBack,
  onCreated,
}: CreateOpinionMarketProps): JSX.Element {
  const { data: markets = [], isLoading, isError } = useMarkets();

  const dreamDexMarkets = useMemo(
    () =>
      markets.filter(
        (market) => market.source === 'dreamdex',
      ),
    [markets],
  );

  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [feePercent, setFeePercent] = useState('5');
  const [error, setError] = useState<string | null>(null);

  const selectedMarket: Market | undefined = useMemo(
    () =>
      dreamDexMarkets.find(
        (market) => market.id === selectedMarketId,
      ),
    [dreamDexMarkets, selectedMarketId],
  );

  const durationOptions = [
    { value: '5m', label: '5m', minutes: 5 },
    { value: '10m', label: '10m', minutes: 10 },
    { value: '15m', label: '15m', minutes: 15 },
    { value: '30m', label: '30m', minutes: 30 },
    { value: '1h', label: '1h', minutes: 60 },
    { value: '2h', label: '2h', minutes: 120 },
    { value: '6h', label: '6h', minutes: 360 },
    { value: '12h', label: '12h', minutes: 720 },
    { value: '24h', label: '24h', minutes: 1440 },
  ];

  const remainingMinutes = useMemo(() => {
    if (!selectedMarket?.closesAt) return Infinity;

    const closesAt = new Date(selectedMarket.closesAt).getTime();
    return Math.max(0, (closesAt - Date.now()) / 60000);
  }, [selectedMarket]);

  const durationDeadline = useMemo(() => {
    if (!duration) return '';

    const option = durationOptions.find(
      (item) => item.value === duration,
    );

    if (!option) return '';

    return new Date(
      Date.now() + option.minutes * 60_000,
    ).toISOString();
  }, [duration]);

  const assetLabel = useMemo(() => {
    const raw = selectedMarket?.symbol || '';

    if (!raw) return 'this asset';

    const base = raw.split('-O-')[0].split('/')[0].trim();

    return base || 'this asset';
  }, [selectedMarket]);

  const questionTemplates = useMemo(() => {
    const asset = assetLabel;

    return [
      `Will ${asset} finish UP?`,
      `Will ${asset} finish DOWN?`,
      'Will this Event Contract resolve YES?',
      'Will this Event Contract resolve NO?',
    ];
  }, [assetLabel]);

  const effectiveQuestion =
    question === 'custom' ? customQuestion : question;

  const previewText = useMemo(() => {
    if (!selectedMarket || !effectiveQuestion.trim()) {
      return 'Select an Event Contract and choose a thesis to preview your market.';
    }

    return describeOpinionMarket({
      id: 'preview',
      creator: 'You',
      dreamDexMarketId: selectedMarket.id,
      dreamDexQuestion: selectedMarket.question,
      dreamDexMarketAddress:
        selectedMarket.marketAddress,
      question: effectiveQuestion.trim(),
      asset:
        selectedMarket.symbol ||
        selectedMarket.category,
      targetPrice: selectedMarket.strike,
      deadline:
        durationDeadline || new Date(Date.now() + 300_000).toISOString(),
      createdAt: new Date().toISOString(),
      status: 'open',
      resolvedOutcome: null,
      yesCount: 0,
      noCount: 0,
      yesPool: 0,
      noPool: 0,
      volume: 0,
      feeBps: Number(feePercent) * 100,
      creatorFeeShare: 0.5,
      creatorEarnings: 0,
      settlementStatus: 'pending',
      xpReward: 100,
    });
  }, [
    selectedMarket,
    question,
    customQuestion,
    duration,
    durationDeadline,
    feePercent,
  ]);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setError(null);

    if (!selectedMarket) {
      setError(
        'Select a DreamDEX Event Contract first.',
      );
      return;
    }

    if (!effectiveQuestion.trim()) {
      setError('Choose a market thesis first.');
      return;
    }

    if (!duration) {
      setError('Choose a market duration first.');
      return;
    }

    const result = createOpinionMarket({
      dreamDexMarketId: selectedMarket.id,
      dreamDexQuestion: selectedMarket.question,
      dreamDexMarketAddress:
        selectedMarket.marketAddress,
      question: effectiveQuestion.trim(),
      asset:
        selectedMarket.symbol ||
        selectedMarket.category,
      targetPrice: selectedMarket.strike,
      deadline: durationDeadline,
      feeBps: Number(feePercent) * 100,
    });

    if (!result.success) {
      setError(
        result.error ?? 'Could not create opinion market.',
      );
      return;
    }

    onCreated();
  };



  return (
    <div className="page create-opinion-page">
      <ScreenHeader onBack={onBack} />

      <div className="page__header">
        <p className="page__eyebrow">
          New Opinion Market
        </p>

        <h1 className="page__heading">
          Turn an Event Contract into a Market
        </h1>

        <p className="page__subheading">
          Pick a live DreamDEX Event Contract, publish
          your thesis, and earn a share of trading fees.
        </p>
      </div>

      <div className="surface-card create-opinion-page__preview">
        <p className="create-opinion-page__preview-label">
          Preview
        </p>

        <p className="create-opinion-page__preview-text">
          {previewText}
        </p>

        {selectedMarket && (
          <p className="create-opinion-page__preview-text">
            DreamDEX Contract: {assetLabel} · Up/Down
          </p>
        )}
      </div>

      <form
        className="create-opinion-page__form"
        onSubmit={handleSubmit}
      >
        <label className="create-opinion-page__field">
          <span className="create-opinion-page__label">
            DreamDEX Event Contract
          </span>

          <select
            className="create-opinion-page__input"
            value={selectedMarketId}
            onChange={(e) =>
              setSelectedMarketId(e.target.value)
            }
            required
            disabled={isLoading || dreamDexMarkets.length === 0}
          >
            <option value="">
              {isLoading
                ? 'Loading DreamDEX markets...'
                : isError
                  ? 'Could not load DreamDEX markets'
                  : dreamDexMarkets.length === 0
                    ? 'No DreamDEX markets available'
                    : 'Select an Event Contract'}
            </option>

            {dreamDexMarkets.map((market) => (
              <option
                key={market.id}
                value={market.id}
              >
                {(market.symbol?.split('-O-')[0].split('/')[0].trim() || market.category) + ' · Up/Down'}
              </option>
            ))}
          </select>
        </label>

        {selectedMarket && (
          <div className="surface-card">
            <p className="create-opinion-page__preview-label">
              Selected Contract
            </p>

            <p className="create-opinion-page__preview-text">
              {assetLabel} · Up/Down
            </p>

            <p className="create-opinion-page__preview-text">
              DreamDEX: {selectedMarket.question}
              {selectedMarket.strike !== undefined
                ? ` · Strike ${selectedMarket.strike}`
                : ''}
            </p>
          </div>
        )}

        <div className="create-opinion-page__field">
          <span className="create-opinion-page__label">
            Choose your thesis
          </span>

          <div className="create-opinion-page__templates">
            {questionTemplates.map((template) => (
              <button
                key={template}
                type="button"
                className={`create-opinion-page__template ${
                  question === template
                    ? 'create-opinion-page__template--active'
                    : ''
                }`}
                onClick={() => {
                  setQuestion(template);
                  setCustomQuestion('');
                }}
              >
                {template}
              </button>
            ))}

            <button
              type="button"
              className={`create-opinion-page__template ${
                question === 'custom'
                  ? 'create-opinion-page__template--active'
                  : ''
              }`}
              onClick={() => setQuestion('custom')}
            >
              Custom thesis
            </button>
          </div>

          {question === 'custom' && (
            <input
              className="create-opinion-page__input"
              type="text"
              placeholder="Write your own thesis..."
              value={customQuestion}
              onChange={(e) =>
                setCustomQuestion(e.target.value)
              }
              required
            />
          )}

          {effectiveQuestion && (
            <p className="create-opinion-page__selected-thesis">
              Selected: <strong>{effectiveQuestion}</strong>
            </p>
          )}
        </div>

        <label className="create-opinion-page__field">
          <span className="create-opinion-page__label">
            Creator fee
          </span>

          <select
            className="create-opinion-page__input"
            value={feePercent}
            onChange={(e) =>
              setFeePercent(e.target.value)
            }
          >
            <option value="2">2%</option>
            <option value="5">5%</option>
            <option value="7.5">7.5%</option>
            <option value="10">10%</option>
          </select>
        </label>

        <div className="create-opinion-page__field">
          <span className="create-opinion-page__label">
            Market duration
          </span>

          <p className="create-opinion-page__hint">
            Choose how long your Opinion Market stays open.
            It cannot outlive the underlying DreamDEX Event Contract.
          </p>

          <div className="create-opinion-page__durations">
            {durationOptions.map((option) => {
              const disabled =
                Number.isFinite(remainingMinutes) &&
                option.minutes > remainingMinutes;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  className={`create-opinion-page__duration ${
                    duration === option.value
                      ? 'create-opinion-page__duration--active'
                      : ''
                  }`}
                  onClick={() => setDuration(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {duration && (
            <p className="create-opinion-page__selected-thesis">
              Closes in <strong>{duration}</strong>
            </p>
          )}
        </div>

        {error && (
          <p className="create-opinion-page__error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--block create-opinion-page__submit"
          disabled={
            isLoading ||
            dreamDexMarkets.length === 0 ||
            !selectedMarket
          }
        >
          Launch Opinion Market
        </button>
      </form>
    </div>
  );
}

export default CreateOpinionMarket;
