import { useEffect, useRef } from 'react';
import type { PriorityQueueState } from '../game/types';
import { MINI_CARDS } from './miniGameContent';
import '../styles/minigames.css';

interface Props {
  state: PriorityQueueState;
  onSelectCard: (cardId: string | null) => void;
  onPlayCard: (targetTaskId: string) => void;
  onEndTurn: () => void;
  onAbandon: () => void;
  onComplete: () => void;
}

function EnergyPips({ current, max }: { current: number; max: number }) {
  return (
    <div className="pq-energy">
      <span className="pq-energy-label">ENERGY</span>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`pq-pip ${i < current ? 'filled' : ''}`} />
      ))}
    </div>
  );
}

function OverwhelmBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const critical = current >= max * 0.7;
  return (
    <div className="pq-overwhelm-track">
      <span className="pq-energy-label">OVERWHELM</span>
      <div className="pq-overwhelm-bar">
        <div
          className={`pq-overwhelm-fill ${critical ? 'critical' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{current}/{max}</span>
    </div>
  );
}

export function PriorityQueue({ state, onSelectCard, onPlayCard, onEndTurn, onAbandon, onComplete }: Props) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  if (state.result !== 'playing') {
    const titles = { won: 'COMPLETE', partial: 'PARTIAL', lost: 'FAILED' };
    return (
      <div className="minigame-overlay">
        <div className="minigame-header">
          <span className="minigame-title">PRIORITY QUEUE</span>
        </div>
        <div className="pq-result">
          <div className="pq-result-label">WORK SESSION</div>
          <div className={`pq-result-title ${state.result}`}>{titles[state.result]}</div>
          <div className="pq-result-message">
            {state.log[state.log.length - 1]}
          </div>
          <button className="pq-continue-btn" onClick={onComplete}>
            &gt; CONTINUE
          </button>
        </div>
      </div>
    );
  }

  const hasSelectedCard = !!state.selectedCard;
  const selectedCard = state.selectedCard ? MINI_CARDS[state.selectedCard] : null;
  const selectedNeedsTarget = selectedCard
    ? selectedCard.effects.some(e => e.kind === 'progressTask')
    : false;

  return (
    <div className="minigame-overlay">
      <div className="minigame-header">
        <span className="minigame-title">PRIORITY QUEUE</span>
        <button className="minigame-abandon" onClick={onAbandon}>abandon</button>
      </div>

      <div className="pq-layout">
        {/* Status bar */}
        <div className="pq-status">
          <span className="pq-turn">TURN {state.turn}/{state.maxTurns}</span>
          <EnergyPips current={state.energy} max={state.maxEnergy} />
          <OverwhelmBar current={state.overwhelm} max={state.maxOverwhelm} />
        </div>

        {/* Active tasks */}
        <div className="pq-tasks">
          {state.activeTasks.map(task => {
            const done = task.progress >= task.effort;
            const targetable = hasSelectedCard && selectedNeedsTarget && !done && !task.expired;
            const cls = [
              'pq-task',
              done ? 'completed' : '',
              task.expired ? 'expired' : '',
              targetable ? 'targetable' : '',
            ].filter(Boolean).join(' ');

            const deadlineCls = task.deadline <= 1 ? 'critical' : task.deadline <= 2 ? 'urgent' : '';
            const pct = task.effort > 0 ? (task.progress / task.effort) * 100 : 0;

            return (
              <div
                key={task.id}
                className={cls}
                onClick={() => targetable && onPlayCard(task.id)}
              >
                <div className="pq-task-name">
                  {done ? '✓ ' : ''}{task.expired ? '✗ ' : ''}{task.name}
                </div>
                <div className="pq-task-progress">
                  <div className="pq-progress-bar">
                    <div className="pq-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="pq-progress-label">{task.progress}/{task.effort}</span>
                </div>
                {!done && !task.expired && (
                  <div className={`pq-task-deadline ${deadlineCls}`}>
                    deadline: {Array.from({ length: Math.max(0, task.deadline) }).map(() => '|').join('')}{task.deadline <= 0 ? '!' : ''}
                  </div>
                )}
                <div className="pq-task-flavor">{task.flavor}</div>
              </div>
            );
          })}
        </div>

        {/* Hand */}
        <div className="pq-hand-area">
          <div className="pq-hand-label">
            {hasSelectedCard && selectedNeedsTarget
              ? '▶ SELECT A TASK TO PLAY THIS CARD'
              : 'YOUR HAND'}
          </div>
          <div className="pq-hand">
            {state.hand.map((cardId, i) => {
              const card = MINI_CARDS[cardId];
              if (!card) return null;
              const affordable = card.cost <= state.energy;
              const isSelected = state.selectedCard === cardId;
              const cls = [
                'pq-card',
                isSelected ? 'selected' : '',
                !affordable ? 'unaffordable' : '',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={`${cardId}-${i}`}
                  className={cls}
                  onClick={() => affordable && onSelectCard(isSelected ? null : cardId)}
                >
                  <div className="pq-card-header">
                    <span className="pq-card-name">{card.name}</span>
                    <span className="pq-card-cost">{'●'.repeat(card.cost) || '○'}</span>
                  </div>
                  <div className="pq-card-rules">{card.rulesText}</div>
                </div>
              );
            })}
            {state.hand.length === 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No cards in hand.
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pq-actions">
          <button className="pq-end-turn" onClick={onEndTurn}>
            END TURN
          </button>
          {hasSelectedCard && selectedNeedsTarget && (
            <span className="pq-hint">click a task above to play</span>
          )}
          {hasSelectedCard && !selectedNeedsTarget && (
            <span className="pq-hint">click the card again to cancel</span>
          )}
        </div>

        {/* Log */}
        <div className="pq-log" ref={logRef}>
          {state.log.slice(-8).map((line, i) => {
            const cls = line.startsWith('▶')
              ? 'pq-log-line pressure'
              : line.startsWith('──')
                ? 'pq-log-line turn-marker'
                : 'pq-log-line';
            return <div key={i} className={cls}>{line}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
