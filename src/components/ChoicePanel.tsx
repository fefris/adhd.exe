import { useState, useEffect } from 'react';
import type { Choice, PlayerState } from '../game/types';
import { getAvailableChoices } from '../game/engine';

interface Props {
  player: PlayerState;
  pendingDistraction: boolean;
  onChoice: (choice: Choice) => void;
  onAdvance: () => void;
  onResist: () => void;
}

function useGlitchLabel(label: string, chaos: number, id: string): string {
  const [display, setDisplay] = useState(label);

  useEffect(() => {
    if (chaos < 67) { setDisplay(label); return; }
    const interval = setInterval(() => {
      if (Math.random() < 0.08) {
        const temptations = ['(do it)', '(you deserve a break)', '(just this once)', '(it\'s fine)'];
        setDisplay(label + ' ' + temptations[Math.floor(Math.random() * temptations.length)]);
        setTimeout(() => setDisplay(label), 800);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [label, chaos, id]);

  return display;
}

function ChoiceButton({ choice, chaos, onClick }: { choice: Choice; chaos: number; onClick: () => void }) {
  const label = useGlitchLabel(choice.label, chaos, choice.id);
  const isDistraction = choice.action.type === 'DISTRACTION';
  const isChaosExtra = choice.id.startsWith('chaos-');

  return (
    <button
      className={`choice-btn ${isDistraction ? 'choice-distraction' : ''} ${isChaosExtra ? 'choice-chaos-extra' : ''}`}
      onClick={onClick}
    >
      <span className="choice-arrow">&gt;</span> {label}
    </button>
  );
}

export function ChoicePanel({ player, pendingDistraction, onChoice, onAdvance, onResist }: Props) {
  if (pendingDistraction) {
    return (
      <div className="choice-panel">
        <p className="distraction-prompt">You are going deeper.</p>
        <button className="choice-btn choice-distraction" onClick={onAdvance}>
          <span className="choice-arrow">&gt;</span> Continue
        </button>
        <button className="choice-btn choice-resist" onClick={onResist}>
          <span className="choice-arrow">&gt;</span> Pull back
        </button>
      </div>
    );
  }

  const choices = getAvailableChoices(player);

  if (choices.length === 0) {
    return <div className="choice-panel"><p className="no-choices">There is nothing to do here. You are here anyway.</p></div>;
  }

  return (
    <div className="choice-panel">
      {choices.map(choice => (
        <ChoiceButton key={choice.id} choice={choice} chaos={player.chaos} onClick={() => onChoice(choice)} />
      ))}
    </div>
  );
}
