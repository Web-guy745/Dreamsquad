import { useMemo, useState } from 'react';
import { Check, ExternalLink, PartyPopper } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import {
  createOpinionMarket,
  describeOpinionMarket,
} from '../services/opinionMarkets';
import { useMarkets } from '../hooks/useMarkets';
import { showToast } from '../utils/toast';
import type { Market } from '../types/market';
import type { OpinionMarket } from '../types/opinionMarket';
import './CreateOpinionMarket.css';

interface CreateOpinionMarketProps {
  onBack: () => void;
  onCreated: () => void;
  onViewMarket: (marketId: string) => void;
}

const STEP_LABELS = ['Contract', 'Your Call', 'Configure', 'Review'];

function CreateOpinionMarket({
  onBack,
  onCreated,
  onViewMarket,
}: CreateOpinionMarketProps): JSX.Element {
  const { data: markets = [], isLoading, isError } = useMarkets();

  const dreamDexMarkets = useMemo(
    () =>
      markets.filter(
        (market) => market.source === 'dreamdex',
      ),
    [markets],
  );

  const [step, setStep] = useState(1);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [feePercent, setFeePercent] = useState('5');
  const [error, setError] = useState<string | null>(null);
  const [createdMarket, setCreatedMarket] = useState<OpinionMarket | null>(null);

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

  const feeBps = Number(feePercent) * 100;
  const creatorFeeShare = 0.5;

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
      feeBps,
      creatorFeeShare,
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
    feeBps,
  ]);

  // --- Step validation gates ---
  const stepErrors: Record<number, string | null> = {
    1: selectedMarket ? null : 'Select a DreamDEX Event Contract to continue.',
    2: effectiveQuestion.trim() ? null : 'Choose or write a thesis to continue.',
    3: duration ? null : 'Choose how long your market stays open.',
    4: null,
  };

  const goNext = (): void => {
    const blockingError = stepErrors[step];
    if (blockingError) {
      setError(blockingError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = (): void => {
    setError(null);
    if (step === 1) {
      onBack();
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleLaunch = (): void => {
    setError(null);

    if (!selectedMarket) {
      setError('Select a DreamDEX Event Contract first.');
      setStep(1);
      return;
    }

    if (!effectiveQuestion.trim()) {
      setError('Choose a market thesis first.');
      setStep(2);
      return;
    }

    if (!duration) {
      setError('Choose a market duration first.');
      setStep(3);
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
      feeBps,
    });

    if (!result.success || !result.market) {
      setError(
        result.error ?? 'Could not create opinion market.',
      );
      return;
    }

    setCreatedMarket(result.market);
    showToast('Opinion Market created successfully.');
    onCreated();
  };

  // --- Success screen ---
  if (createdMarket) {
    return (
      <div className="page create-opinion-page">
        <ScreenHeader onBack={onBack} />

        <div className="create-opinion-page__success">
          <span className="create-opinion-page__success-icon">
            <PartyPopper size={22} strokeWidth={2} />
          </span>
          <h1 className="create-opinion-page__success-title">Opinion Market is live</h1>
          <p className="create-opinion-page__success-text">
            {describeOpinionMarket(createdMarket)}
          </p>
          <p className="create-opinion-page__success-note">
            Backed by DreamDEX Event Contract · {createdMarket.dreamDexQuestion}
          </p>

          <div className="create-opinion-page__success-actions">
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => onViewMarket(createdMarket.id)}
            >
              <ExternalLink size={15} />
              Open New Market
            </button>
            <button type="button" className="btn btn--secondary btn--block" onClick={onBack}>
              Back to Opinion Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      <ol className="create-opinion-page__steps" aria-label="Create market steps">
        {STEP_LABELS.map((label, i) => {
          const stepNumber = i + 1;
          const isDone = stepNumber < step;
          const isActive = stepNumber === step;
          return (
            <li key={label} className="create-opinion-page__step-item">
              <span
                className={`create-opinion-page__step-badge ${isActive ? 'create-opinion-page__step-badge--active' : ''} ${isDone ? 'create-opinion-page__step-badge--done' : ''}`}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : stepNumber}
              </span>
              <span className="create-opinion-page__step-label">{label}</span>
              {stepNumber < STEP_LABELS.length && <span className="create-opinion-page__step-line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

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

      <div className="create-opinion-page__form">
        {step === 1 && (
          <div className="create-opinion-page__field">
            <span className="create-opinion-page__label">
              Choose DreamDEX Contract
            </span>

            <select
              className="create-opinion-page__input"
              value={selectedMarketId}
              onChange={(e) =>
                setSelectedMarketId(e.target.value)
              }
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

            {selectedMarket && (
              <div className="surface-card create-opinion-page__contract-card">
                <p className="create-opinion-page__preview-label">
                  DreamDEX Event Contract
                </p>
                <p className="create-opinion-page__preview-text">
                  {assetLabel} · Up/Down
                </p>
                <p className="create-opinion-page__selected-thesis">
                  {selectedMarket.question}
                </p>
                <div className="create-opinion-page__contract-meta">
                  {selectedMarket.strike !== undefined && (
                    <span>Strike {selectedMarket.strike}</span>
                  )}
                  <span>Status: {selectedMarket.status}</span>
                  {selectedMarket.closesAt && (
                    <span>
                      Expires {new Date(selectedMarket.closesAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="create-opinion-page__field">
            <span className="create-opinion-page__label">
              Make Your Call
            </span>

            <p className="create-opinion-page__hint">
              Your prediction, backed by {assetLabel}'s DreamDEX Event Contract.
            </p>

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
              />
            )}

            {effectiveQuestion && (
              <p className="create-opinion-page__selected-thesis">
                Your prediction: <strong>{effectiveQuestion}</strong>
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <>
            <div className="create-opinion-page__field">
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

              <p className="create-opinion-page__hint">
                You keep {Math.round(creatorFeeShare * 100)}% of the {feePercent}% trading fee when this market resolves.
              </p>
            </div>

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

              {duration && durationDeadline && (
                <p className="create-opinion-page__selected-thesis">
                  Closes <strong>{new Date(durationDeadline).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}</strong>
                </p>
              )}
            </div>

            <p className="create-opinion-page__wallet-note">
              Demo credits only — Opinion Market trading uses local demo credits, not real funds.
            </p>
          </>
        )}

        {step === 4 && (
          <div className="create-opinion-page__review">
            <div className="create-opinion-page__review-row">
              <span>Opinion Market</span>
              <strong>{effectiveQuestion || '—'}</strong>
            </div>
            <div className="create-opinion-page__review-row">
              <span>DreamDEX Event Contract</span>
              <strong>{selectedMarket?.question || '—'}</strong>
            </div>
            <div className="create-opinion-page__review-row">
              <span>Deadline</span>
              <strong>
                {durationDeadline
                  ? new Date(durationDeadline).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : '—'}
              </strong>
            </div>
            <div className="create-opinion-page__review-row">
              <span>Creator fee</span>
              <strong>{feePercent}% (you keep {Math.round(creatorFeeShare * 100)}%)</strong>
            </div>
            <p className="create-opinion-page__wallet-note">
              Demo credits only — positions and payouts on this market use local demo credits, not real funds. Resolution source: DreamDEX.
            </p>
          </div>
        )}

        {error && (
          <p className="create-opinion-page__error">
            {error}
          </p>
        )}

        <div className="create-opinion-page__nav">
          <button type="button" className="btn btn--secondary" onClick={goBack}>
            Back
          </button>

          {step < 4 ? (
            <button type="button" className="btn btn--primary" onClick={goNext}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary create-opinion-page__submit"
              onClick={handleLaunch}
              disabled={isLoading || dreamDexMarkets.length === 0}
            >
              Launch Opinion Market
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateOpinionMarket;
