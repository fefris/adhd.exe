import type { PixelPerfectElement, PixelPerfectState } from '../game/types';
import { ppResolve } from './miniGameEngine';
import '../styles/minigames.css';

interface Props {
  state: PixelPerfectState;
  onSelectElement: (elementId: string) => void;
  onNudge: (dx: number, dy: number) => void;
  onFinish: () => void;
  onComplete: () => void;
}

function distance(element: PixelPerfectElement): number {
  return Math.abs(element.x - element.targetX) + Math.abs(element.y - element.targetY);
}

function ElementStatus({ element, selected, onSelect }: { element: PixelPerfectElement; selected: boolean; onSelect: () => void }) {
  const dist = distance(element);
  const aligned = dist <= 2;

  return (
    <button
      className={`pp-element-row${selected ? ' selected' : ''}${aligned ? ' aligned' : ''}`}
      onClick={onSelect}
    >
      <span>{element.name}</span>
      <span>{element.role}</span>
      <span>{aligned ? 'aligned' : `${dist}px off`}</span>
    </button>
  );
}

export function PixelPerfect({ state, onSelectElement, onNudge, onFinish, onComplete }: Props) {
  if (state.done) {
    const result = ppResolve(state);
    const alignedCritical = state.elements.filter(element => element.role === 'critical' && distance(element) <= 2).length;
    const alignedCosmetic = state.elements.filter(element => element.role === 'cosmetic' && distance(element) <= 2).length;

    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">PIXEL PERFECT</span>
        </div>
        <div className="pp-result">
          <div className="pp-result-label">PRESENTATION SURVIVED</div>
          <div className="pp-result-score">
            {alignedCritical}/3 critical | {alignedCosmetic}/2 cosmetic
          </div>
          <div className="pp-result-message">{result.message}</div>
          <button className="pq-continue-btn" onClick={onComplete}>&gt; CONTINUE</button>
        </div>
      </div>
    );
  }

  const selected = state.elements.find(element => element.id === state.selectedElementId) ?? state.elements[0];
  const budgetPct = (state.actionsRemaining / state.maxActions) * 100;

  return (
    <div className="minigame-overlay">
      <div className="minigame-header">
        <span className="minigame-title">PIXEL PERFECT</span>
        <span className="tm-progress">ACTIONS {state.actionsRemaining}/{state.maxActions}</span>
      </div>

      <div className="pp-layout">
        <div className="pp-stage-wrap">
          <div className="pp-projector">
            <div className="pp-slide" aria-label="Misaligned presentation slide">
              <div className="pp-guide pp-guide-v" style={{ left: '28px' }} />
              <div className="pp-guide pp-guide-v" style={{ left: '40px' }} />
              <div className="pp-guide pp-guide-h" style={{ top: '24px' }} />
              <div className="pp-guide pp-guide-h" style={{ top: '80px' }} />
              {state.elements.map(element => {
                const selectedElement = element.id === state.selectedElementId;
                const aligned = distance(element) <= 2;
                const className = [
                  'pp-slide-element',
                  `pp-${element.id}`,
                  selectedElement ? 'selected' : '',
                  aligned ? 'aligned' : '',
                ].filter(Boolean).join(' ');

                return (
                  <button
                    key={element.id}
                    className={className}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                    }}
                    onClick={() => onSelectElement(element.id)}
                    aria-label={`Select ${element.name}`}
                  >
                    {element.id === 'title' && 'Q3 OPERATING PLAN'}
                    {element.id === 'bullets' && (
                      <>
                        <span />
                        <span />
                        <span />
                      </>
                    )}
                    {element.id === 'chart' && (
                      <>
                        <i />
                        <i />
                        <i />
                      </>
                    )}
                    {element.id === 'logo' && 'Q'}
                    {element.id === 'footer' && 'confidential'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pp-budget">
            <span>presenter patience</span>
            <div className="pp-budget-track">
              <div className="pp-budget-fill" style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        </div>

        <div className="pp-controls">
          <div className="pp-selected">
            <span>selected</span>
            <strong>{selected.name}</strong>
            <em>{distance(selected) <= 2 ? 'aligned' : `${distance(selected)}px from plausible sanity`}</em>
            <em>nudge: 3px</em>
          </div>

          <div className="pp-nudge-grid">
            <button onClick={() => onNudge(0, -1)}>UP</button>
            <button onClick={() => onNudge(-1, 0)}>LEFT</button>
            <button onClick={() => onNudge(1, 0)}>RIGHT</button>
            <button onClick={() => onNudge(0, 1)}>DOWN</button>
          </div>

          <div className="pp-element-list">
            {state.elements.map(element => (
              <ElementStatus
                key={element.id}
                element={element}
                selected={element.id === state.selectedElementId}
                onSelect={() => onSelectElement(element.id)}
              />
            ))}
          </div>

          <button className="pp-finish-btn" onClick={onFinish}>
            GOOD ENOUGH
          </button>
        </div>

        <div className="pp-log">
          {state.log.slice(-3).map((line, index) => (
            <div key={`${line}-${index}`} className="pp-log-line">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
