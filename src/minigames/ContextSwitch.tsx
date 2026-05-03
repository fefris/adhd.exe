import { useEffect, useRef, useState } from 'react';
import type { ContextSwitchState } from '../game/types';
import { csResolve } from './miniGameEngine';
import '../styles/minigames.css';

interface Props {
  state: ContextSwitchState;
  onMemorizeDone: () => void;
  onSelectWord: (word: string) => void;
  onComplete: () => void;
}

export function ContextSwitch({ state, onMemorizeDone, onSelectWord, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(4);
  const firedRef = useRef(false);
  const onMemorizeDoneRef = useRef(onMemorizeDone);
  onMemorizeDoneRef.current = onMemorizeDone;

  useEffect(() => {
    if (state.phase !== 'memorize') return;
    setTimeLeft(4);
    firedRef.current = false;

    const tickId = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    const autoId = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onMemorizeDoneRef.current();
      }
    }, 4500);

    return () => {
      clearInterval(tickId);
      clearTimeout(autoId);
    };
  }, [state.phase]);

  const handleReady = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onMemorizeDone();
  };

  if (state.phase === 'done') {
    const res = csResolve(state);
    const correct = state.selectedWords.filter(w => state.words.includes(w)).length;
    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">CONTEXT SWITCH</span>
        </div>
        <div className="cs-result-screen">
          <div className="cs-result-score">{correct} / 4</div>
          <div className="cs-result-message">{res.message}</div>
          {correct < 4 && (
            <div className="cs-result-words">
              The correct words were:{' '}
              {state.words.map((w, i) => (
                <span key={w} className={state.selectedWords.includes(w) ? 'cs-word-hit' : 'cs-word-miss'}>
                  {w}{i < state.words.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
          <button className="pq-continue-btn" onClick={onComplete}>&gt; CONTINUE</button>
        </div>
      </div>
    );
  }

  if (state.phase === 'memorize') {
    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">CONTEXT SWITCH</span>
          <span className="tm-progress">{timeLeft}s</span>
        </div>
        <div className="cs-layout">
          <div className="cs-phase-label">Remember these four things:</div>
          <div className="cs-words-grid">
            {state.words.map(w => (
              <div key={w} className="cs-word-display">{w}</div>
            ))}
          </div>
          <button className="cs-ready-btn" onClick={handleReady}>I have them</button>
        </div>
      </div>
    );
  }

  return (
    <div className="minigame-overlay">
      <div className="minigame-header">
        <span className="minigame-title">CONTEXT SWITCH</span>
      </div>
      <div className="cs-layout">
        <div className="cs-phase-label">
          Select the four words you saw ({state.selectedWords.length}/4):
        </div>
        <div className="cs-recall-grid">
          {state.recallOptions.map(w => {
            const selected = state.selectedWords.includes(w);
            return (
              <button
                key={w}
                className={`cs-recall-word${selected ? ' selected' : ''}`}
                onClick={() => onSelectWord(w)}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
