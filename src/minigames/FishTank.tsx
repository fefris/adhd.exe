import type { FishTankState } from '../game/types';
import { ftResolve } from './miniGameEngine';
import '../styles/minigames.css';

interface Props {
  state: FishTankState;
  onSelectFish: (fishId: string) => void;
  onKeepWatching: () => void;
  onNameFish: () => void;
  onResearchFish: () => void;
  onWalkAway: () => void;
  onComplete: () => void;
}

const FISH = [
  { id: 'orange fish', className: 'ft-fish-orange' },
  { id: 'blue fish', className: 'ft-fish-blue' },
  { id: 'small fish', className: 'ft-fish-small' },
  { id: 'green fish', className: 'ft-fish-green' },
];

export function FishTank({ state, onSelectFish, onKeepWatching, onNameFish, onResearchFish, onWalkAway, onComplete }: Props) {
  if (state.done) {
    const result = ftResolve(state);

    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">FISH TANK HYPNOSIS</span>
        </div>
        <div className="ft-result">
          <div className="ft-result-label">SCREENSAVER ESCAPED</div>
          <div className="ft-result-score">
            watched {state.watchCount}/{state.maxWatchCount} | fascination {state.fascination}
          </div>
          <div className="ft-result-message">{result.message}</div>
          <button className="pq-continue-btn" onClick={onComplete}>&gt; CONTINUE</button>
        </div>
      </div>
    );
  }

  const dangerPct = (state.watchCount / state.maxWatchCount) * 100;

  return (
    <div className="minigame-overlay">
      <div className="minigame-header">
        <span className="minigame-title">FISH TANK HYPNOSIS</span>
        <span className="tm-progress">WATCHING {state.watchCount}/{state.maxWatchCount}</span>
      </div>

      <div className="ft-layout">
        <div className="ft-monitor">
          <div className="ft-tank" aria-label="Animated fish screensaver">
            <div className="ft-bubbles">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="ft-castle" />
            <div className="ft-gravel" />
            {FISH.map(fish => (
              <button
                key={fish.id}
                className={`ft-fish ${fish.className}${state.selectedFishId === fish.id ? ' selected' : ''}`}
                onClick={() => onSelectFish(fish.id)}
              >
                <span />
              </button>
            ))}
          </div>
        </div>

        <div className="ft-panel">
          <div className="ft-status">
            <span>fascination</span>
            <strong>{state.fascination}</strong>
            <em>{state.selectedFishId ? `tracking ${state.selectedFishId}` : 'no fish selected'}</em>
          </div>

          <div className="ft-danger">
            <span>time distortion</span>
            <div className="ft-danger-track">
              <div className="ft-danger-fill" style={{ width: `${dangerPct}%` }} />
            </div>
          </div>

          <div className="ft-actions">
            <button onClick={onKeepWatching}>KEEP WATCHING</button>
            <button onClick={onNameFish} disabled={state.namedFish}>NAME ONE</button>
            <button onClick={onResearchFish} disabled={state.researchedFish}>LOOK IT UP</button>
            <button className="ft-walk-away" onClick={onWalkAway}>WALK AWAY</button>
          </div>

          <div className="ft-log">
            {state.log.slice(-4).map((line, index) => (
              <div key={`${line}-${index}`} className="ft-log-line">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
