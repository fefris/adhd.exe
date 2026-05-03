import { useReducer, useCallback } from 'react';
import { appReducer, INITIAL_STATE } from './game/engine';
import type { Choice } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { EndScreen } from './components/EndScreen';
import { GameLog } from './components/GameLog';
import { ChoicePanel } from './components/ChoicePanel';
import { ResourceBars } from './components/ResourceBars';
import { Inventory } from './components/Inventory';
import './styles/terminal.css';

export default function App() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  const handleStart = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const handleRestart = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const handleChoice = useCallback((choice: Choice) => dispatch({ type: 'MAKE_CHOICE', choice }), []);
  const handleAdvance = useCallback(() => dispatch({ type: 'ADVANCE_DISTRACTION' }), []);
  const handleResist = useCallback(() => dispatch({ type: 'RESIST_DISTRACTION' }), []);

  if (state.screen === 'title') {
    return <TitleScreen onStart={handleStart} />;
  }

  if (state.screen === 'end') {
    return <EndScreen player={state.player} onRestart={handleRestart} />;
  }

  const { player, log, pendingDistraction } = state;

  return (
    <div className="game-layout">
      <div className="game-header">
        <h1>ADHD.EXE — {new Date().toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()}</h1>
      </div>
      <div className="game-main">
        <div className="game-log-col">
          <GameLog log={log} chaos={player.chaos} />
        </div>
        <div className="game-sidebar">
          <ResourceBars player={player} />
          <Inventory player={player} />
          <ChoicePanel
            player={player}
            pendingDistraction={pendingDistraction !== null}
            onChoice={handleChoice}
            onAdvance={handleAdvance}
            onResist={handleResist}
          />
        </div>
      </div>
    </div>
  );
}
