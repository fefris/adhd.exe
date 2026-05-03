import { useEffect, useRef, useState } from 'react';
import type { TheMeetingState } from '../game/types';
import { getBuzzword, tmResolve } from './miniGameEngine';
import '../styles/minigames.css';

interface Props {
  state: TheMeetingState;
  onEngage: () => void;
  onZoneOut: () => void;
  onComplete: () => void;
}

export function TheMeeting({ state, onEngage, onZoneOut, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(5);
  const advancedRef = useRef(false);
  const onZoneOutRef = useRef(onZoneOut);
  onZoneOutRef.current = onZoneOut;

  useEffect(() => {
    if (state.done) return;
    setTimeLeft(5);
    advancedRef.current = false;

    const tickId = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    const autoId = setTimeout(() => {
      if (!advancedRef.current) {
        advancedRef.current = true;
        onZoneOutRef.current();
      }
    }, 5500);

    return () => {
      clearInterval(tickId);
      clearTimeout(autoId);
    };
  }, [state.round, state.done]);

  const handleEngage = () => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    onEngage();
  };

  const handleZoneOut = () => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    onZoneOut();
  };

  if (state.done) {
    const res = tmResolve(state);
    const engagedPct = Math.round((state.engaged / state.maxRounds) * 100);
    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">THE MEETING</span>
        </div>
        <div className="tm-result">
          <div className="tm-result-label">MEETING ADJOURNED</div>
          <div className="tm-result-stat">
            Engaged {state.engaged}/{state.maxRounds} rounds ({engagedPct}%)
          </div>
          <div className="tm-result-message">{res.message}</div>
          <button className="pq-continue-btn" onClick={onComplete}>&gt; CONTINUE</button>
        </div>
      </div>
    );
  }

  const buzzword = getBuzzword(state.round);
  const timerPct = (timeLeft / 5) * 100;
  const urgent = timeLeft <= 2;

  return (
    <div className="minigame-overlay">
      <div className="minigame-header">
        <span className="minigame-title">THE MEETING</span>
        <span className="tm-progress">Round {state.round + 1} / {state.maxRounds}</span>
      </div>

      <div className="tm-layout">
        <div className="tm-timer-bar">
          <div
            className={`tm-timer-fill${urgent ? ' urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        <div className="tm-buzzword">"{buzzword}"</div>

        <div className="tm-score-row">
          <span className="tm-score-item engaged">engaged: {state.engaged}</span>
          <span className="tm-score-item zoned">zoned out: {state.zonedOut}</span>
        </div>

        <div className="tm-buttons">
          <button className="tm-engage-btn" onClick={handleEngage}>
            &gt; ENGAGE
          </button>
          <button className="tm-zone-out-btn" onClick={handleZoneOut}>
            zone out
          </button>
        </div>

        <div className="tm-hint">
          {urgent ? 'The room is looking at you.' : 'Someone is speaking. You could engage, or not.'}
        </div>
      </div>
    </div>
  );
}
