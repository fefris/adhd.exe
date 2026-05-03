import { useReducer, useCallback } from 'react';
import { appReducer, INITIAL_STATE } from './game/engine';
import type { Choice } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { EndScreen } from './components/EndScreen';
import { GameLog } from './components/GameLog';
import { ChoicePanel } from './components/ChoicePanel';
import { ResourceBars } from './components/ResourceBars';
import { Inventory } from './components/Inventory';
import { PriorityQueue } from './minigames/PriorityQueue';
import { DoomScroll } from './minigames/DoomScroll';
import { TheMeeting } from './minigames/TheMeeting';
import { TimeBlindness } from './minigames/TimeBlindness';
import { ContextSwitch } from './minigames/ContextSwitch';
import './styles/terminal.css';

function GameHeader() {
  return (
    <div className="game-header">
      <h1>ADHD.EXE — {new Date().toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()}</h1>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  const handleStart = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const handleRestart = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const handleChoice = useCallback((choice: Choice) => dispatch({ type: 'MAKE_CHOICE', choice }), []);
  const handleAdvance = useCallback(() => dispatch({ type: 'ADVANCE_DISTRACTION' }), []);
  const handleResist = useCallback(() => dispatch({ type: 'RESIST_DISTRACTION' }), []);

  const handlePqSelectCard = useCallback((cardId: string | null) => dispatch({ type: 'PQ_SELECT_CARD', cardId }), []);
  const handlePqPlayCard = useCallback((targetTaskId: string) => dispatch({ type: 'PQ_PLAY_CARD', targetTaskId }), []);
  const handlePqEndTurn = useCallback(() => dispatch({ type: 'PQ_END_TURN' }), []);
  const handlePqAbandon = useCallback(() => dispatch({ type: 'PQ_ABANDON' }), []);
  const handleDsScroll = useCallback(() => dispatch({ type: 'DS_SCROLL' }), []);
  const handleDsPutDown = useCallback(() => dispatch({ type: 'DS_PUT_DOWN' }), []);
  const handleTmEngage = useCallback(() => dispatch({ type: 'TM_ENGAGE' }), []);
  const handleTmZoneOut = useCallback(() => dispatch({ type: 'TM_ZONE_OUT' }), []);
  const handleTbGuess = useCallback((minutes: number) => dispatch({ type: 'TB_GUESS', minutes }), []);
  const handleCsMemorizeDone = useCallback(() => dispatch({ type: 'CS_MEMORIZE_DONE' }), []);
  const handleCsSelectWord = useCallback((word: string) => dispatch({ type: 'CS_SELECT_WORD', word }), []);
  const handleCompleteMiniGame = useCallback(() => dispatch({ type: 'COMPLETE_MINI_GAME' }), []);

  if (state.screen === 'title') {
    return <TitleScreen onStart={handleStart} />;
  }

  if (state.screen === 'end') {
    return <EndScreen player={state.player} onRestart={handleRestart} />;
  }

  const { player, log, pendingDistraction, pendingMiniGame } = state;

  if (pendingMiniGame) {
    return (
      <div className="game-layout">
        <GameHeader />
        {pendingMiniGame.id === 'priority-queue' ? (
          <PriorityQueue
            state={pendingMiniGame}
            onSelectCard={handlePqSelectCard}
            onPlayCard={handlePqPlayCard}
            onEndTurn={handlePqEndTurn}
            onAbandon={handlePqAbandon}
            onComplete={handleCompleteMiniGame}
          />
        ) : pendingMiniGame.id === 'doom-scroll' ? (
          <DoomScroll
            state={pendingMiniGame}
            onScroll={handleDsScroll}
            onPutDown={handleDsPutDown}
            onComplete={handleCompleteMiniGame}
          />
        ) : pendingMiniGame.id === 'the-meeting' ? (
          <TheMeeting
            state={pendingMiniGame}
            onEngage={handleTmEngage}
            onZoneOut={handleTmZoneOut}
            onComplete={handleCompleteMiniGame}
          />
        ) : pendingMiniGame.id === 'time-blindness' ? (
          <TimeBlindness
            state={pendingMiniGame}
            onGuess={handleTbGuess}
            onComplete={handleCompleteMiniGame}
          />
        ) : (
          <ContextSwitch
            state={pendingMiniGame}
            onMemorizeDone={handleCsMemorizeDone}
            onSelectWord={handleCsSelectWord}
            onComplete={handleCompleteMiniGame}
          />
        )}
      </div>
    );
  }

  return (
    <div className="game-layout">
      <GameHeader />
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
