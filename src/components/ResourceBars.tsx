import type { PlayerState } from '../game/types';
import '../styles/terminal.css';

interface Props {
  player: PlayerState;
}

export function ResourceBars({ player }: Props) {
  const { focus, time, chaos } = player;

  const focusClass = focus < 20 ? 'bar-critical' : focus < 40 ? 'bar-low' : 'bar-ok';
  const timeClass = time < 20 ? 'bar-critical' : time < 40 ? 'bar-low' : 'bar-ok';
  const chaosClass = chaos > 80 ? 'bar-critical' : chaos > 50 ? 'bar-low' : 'bar-ok';

  const chaosFlicker = chaos >= 67;

  return (
    <div className={`resource-bars ${chaosFlicker ? 'chaos-flicker' : ''}`}>
      <div className="resource">
        <span className="resource-label">FOCUS</span>
        <div className="bar-track">
          <div className={`bar-fill ${focusClass}`} style={{ width: `${focus}%` }} />
        </div>
        <span className="resource-value">{focus}</span>
      </div>
      <div className="resource">
        <span className="resource-label">TIME</span>
        <div className="bar-track">
          <div className={`bar-fill ${timeClass}`} style={{ width: `${time}%` }} />
        </div>
        <span className="resource-value">{time}</span>
      </div>
      <div className="resource">
        <span className="resource-label chaos-label">CHAOS</span>
        <div className="bar-track">
          <div className={`bar-fill ${chaosClass}`} style={{ width: `${chaos}%` }} />
        </div>
        <span className="resource-value">{chaos}</span>
      </div>
    </div>
  );
}
