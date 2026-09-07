import './AmbientBackground.css';

/**
 * Fixed, subtle ambient lighting layer sitting behind the app — the dark
 * background stays dominant, purple only appears as soft drifting glow.
 */
function AmbientBackground(): JSX.Element {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__blob ambient__blob--a" />
      <div className="ambient__blob ambient__blob--b" />
    </div>
  );
}

export default AmbientBackground;
