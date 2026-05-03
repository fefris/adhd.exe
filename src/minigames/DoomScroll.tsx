import type { DoomScrollState } from '../game/types';
import { DOOM_SCROLL_CONTENTS } from './miniGameContent';
import { dsResolve } from './miniGameEngine';
import '../styles/minigames.css';

interface Props {
  state: DoomScrollState;
  onScroll: () => void;
  onPutDown: () => void;
  onComplete: () => void;
}

export function DoomScroll({ state, onScroll, onPutDown, onComplete }: Props) {
  const content = DOOM_SCROLL_CONTENTS[state.contentIndex % DOOM_SCROLL_CONTENTS.length];

  if (state.done) {
    const resolution = dsResolve(state);
    const scrolled = state.scrollCount;
    const minutesStr = scrolled === 0 ? 'almost no time' : `~${scrolled * 3} minutes`;

    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">DOOM SCROLL</span>
        </div>
        <div className="ds-result">
          <div className="ds-result-message">{resolution.message}</div>
          <div className="ds-result-stat">
            {scrolled === 0
              ? 'You did not scroll at all.'
              : `You scrolled ${scrolled} time${scrolled !== 1 ? 's' : ''}. Approximately ${minutesStr}.`}
          </div>
          <button className="ds-continue-btn" onClick={onComplete}>
            &gt; CONTINUE
          </button>
        </div>
      </div>
    );
  }

  const scrollCount = state.scrollCount;
  const countCls = scrollCount >= 6 ? 'warning' : '';

  return (
    <div className="minigame-overlay">
      <div className="minigame-header">
        <span className="minigame-title">DOOM SCROLL</span>
      </div>

      <div className="ds-layout">
        <div className="ds-label">NOTIFICATIONS / FEED</div>

        <div className="ds-content-card">
          <p className="ds-content-text">{content.text}</p>
        </div>

        <div className={`ds-scroll-count ${countCls}`}>
          {scrollCount === 0
            ? 'You just picked it up.'
            : `${scrollCount} scroll${scrollCount !== 1 ? 's' : ''} deep.`}
        </div>

        <div className="ds-buttons">
          <button className="ds-scroll-btn" onClick={onScroll}>
            &gt;&gt; KEEP SCROLLING
          </button>

          <button
            className="ds-putdown-btn"
            style={{
              width: `${Math.round(state.buttonScale * 100)}%`,
              opacity: Math.max(0.4, state.buttonScale),
            }}
            onClick={onPutDown}
          >
            put it down
          </button>
        </div>
      </div>
    </div>
  );
}
