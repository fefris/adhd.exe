import { determineEnding } from '../game/engine';
import type { PlayerState } from '../game/types';

interface Props {
  player: PlayerState;
  onRestart: () => void;
}

export function EndScreen({ player, onRestart }: Props) {
  const ending = determineEnding(player);

  return (
    <div className="end-screen">
      <div className="end-header">
        <span className="end-label">END OF DAY</span>
        <span className="end-title">{ending.title}</span>
      </div>

      <div className="end-stats">
        <span>FOCUS: {player.focus}</span>
        <span>TIME: {player.time}</span>
        <span>CHAOS: {player.chaos}</span>
        <span>TASKS: {player.completedActions.length}</span>
      </div>

      <pre className="end-body">{ending.body}</pre>

      <div className="end-completed">
        {player.completedActions.length > 0 && (
          <>
            <p className="end-completed-label">Things you actually did:</p>
            <ul>
              {player.completedActions.map(a => (
                <li key={a}>{a.replace(/-/g, ' ')}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <button className="start-btn" onClick={onRestart}>
        &gt; TRY AGAIN TOMORROW
      </button>
    </div>
  );
}
