import type { TimeBlindnessState } from '../game/types';
import { tbResolve } from './miniGameEngine';
import '../styles/minigames.css';

interface Props {
  state: TimeBlindnessState;
  onGuess: (minutes: number) => void;
  onComplete: () => void;
}

const GUESS_OPTIONS = [5, 15, 30, 60];
const GUESS_LABELS: Record<number, string> = {
  5: '5 minutes',
  15: '15 minutes',
  30: '30 minutes',
  60: '1 hour',
};

export function TimeBlindness({ state, onGuess, onComplete }: Props) {
  if (state.phase === 'done') {
    const res = tbResolve(state);
    const guessed = state.guessedMinutes ?? 15;
    const gap = Math.abs(state.actualMinutes - guessed);

    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">TIME BLINDNESS</span>
        </div>
        <div className="tb-result">
          <div className="tb-task-label">{state.taskLabel}</div>
          <div className="tb-reveal">
            <div className="tb-reveal-line">Your estimate: {guessed} minutes</div>
            <div className="tb-reveal-actual">Actual time: {state.actualMinutes} minutes</div>
            <div className="tb-reveal-gap">
              {gap <= 5 ? `Off by ${gap} minute${gap !== 1 ? 's' : ''}. Remarkable.`
                : `Off by ${gap} minutes.`}
            </div>
          </div>
          <div className="tb-result-message">{res.message}</div>
          <button className="pq-continue-btn" onClick={onComplete}>&gt; CONTINUE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="minigame-overlay">
      <div className="minigame-header">
        <span className="minigame-title">TIME BLINDNESS</span>
      </div>
      <div className="tb-layout">
        <div className="tb-task-label">{state.taskLabel}</div>
        <div className="tb-prompt">How long do you think this will take?</div>
        <div className="tb-guesses">
          {GUESS_OPTIONS.map(mins => (
            <button key={mins} className="tb-guess-btn" onClick={() => onGuess(mins)}>
              {GUESS_LABELS[mins]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
