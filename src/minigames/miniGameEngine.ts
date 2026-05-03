import { shuffle } from '../utils';
import type { PriorityQueueState, DoomScrollState, MiniTask, PendingMiniGame } from '../game/types';
import {
  MINI_CARDS, MINI_TASKS_DATA, MINI_PRESSURE_DATA,
  PRIORITY_QUEUE_DECK, PRIORITY_QUEUE_TASK_IDS, PRIORITY_QUEUE_PRESSURE,
  DOOM_SCROLL_CONTENTS,
} from './miniGameContent';

export interface MiniGameResolution {
  focusDelta: number;
  timeDelta: number;
  chaosDelta: number;
  message: string;
  completesAction?: string;
}

// ─── Priority Queue ───────────────────────────────────────────────────────────

export function createPriorityQueueState(chaos: number, completesAction?: string): PriorityQueueState {
  const deck = shuffle([...PRIORITY_QUEUE_DECK]);
  const hand = deck.slice(0, 4);
  const drawPile = deck.slice(4);
  const pressureQueue = shuffle([...PRIORITY_QUEUE_PRESSURE]);
  const activeTasks: MiniTask[] = PRIORITY_QUEUE_TASK_IDS.map(id => ({
    ...MINI_TASKS_DATA[id],
    progress: 0,
    expired: false,
  }));
  const startOverwhelm = chaos >= 67 ? 4 : chaos >= 34 ? 2 : 0;

  return {
    id: 'priority-queue',
    turn: 1,
    maxTurns: 3,
    energy: 3,
    maxEnergy: 3,
    overwhelm: startOverwhelm,
    maxOverwhelm: 10,
    hand,
    drawPile,
    discardPile: [],
    activeTasks,
    totalTasks: activeTasks.length,
    pressureQueue,
    pressureDiscard: [],
    log: ['You sit down at the desk. The tasks are not going anywhere. Neither are you.', '── Turn 1 ──'],
    result: 'playing',
    selectedCard: null,
    completesAction,
  };
}

export function pqSelectCard(state: PriorityQueueState, cardId: string | null): PriorityQueueState {
  return { ...state, selectedCard: cardId };
}

export function pqPlayCard(state: PriorityQueueState, targetTaskId?: string): PriorityQueueState {
  const cardId = state.selectedCard;
  if (!cardId) return state;

  const card = MINI_CARDS[cardId];
  if (!card) return { ...state, selectedCard: null };

  if (card.cost > state.energy) {
    return { ...state, log: [...state.log, `Not enough energy for ${card.name}.`] };
  }

  const needsTarget = card.effects.some(e => e.kind === 'progressTask');
  if (needsTarget && !targetTaskId) return state;

  let s = { ...state, energy: state.energy - card.cost, selectedCard: null };
  const lines: string[] = [];

  for (const eff of card.effects) {
    switch (eff.kind) {
      case 'progressTask': {
        const task = s.activeTasks.find(t => t.id === targetTaskId && !t.expired && t.progress < t.effort);
        if (task) {
          const added = Math.min(eff.amount, task.effort - task.progress);
          s = {
            ...s,
            activeTasks: s.activeTasks.map(t =>
              t.id === targetTaskId ? { ...t, progress: t.progress + added } : t
            ),
          };
          const updated = s.activeTasks.find(t => t.id === targetTaskId)!;
          lines.push(`${card.name} → +${added} to ${task.name}${updated.progress >= updated.effort ? ' ✓' : ''}.`);
        }
        break;
      }
      case 'progressAll': {
        s = {
          ...s,
          activeTasks: s.activeTasks.map(t =>
            t.expired ? t : { ...t, progress: Math.min(t.effort, t.progress + eff.amount) }
          ),
        };
        lines.push(`${card.name} → +${eff.amount} progress to all tasks.`);
        break;
      }
      case 'reduceOverwhelm': {
        const before = s.overwhelm;
        s = { ...s, overwhelm: Math.max(0, s.overwhelm - eff.amount) };
        lines.push(`${card.name} → Overwhelm −${before - s.overwhelm}.`);
        break;
      }
      case 'draw': {
        let { drawPile, discardPile } = s;
        if (drawPile.length < eff.amount) {
          drawPile = [...drawPile, ...shuffle([...discardPile])];
          discardPile = [];
        }
        const drawn = drawPile.slice(0, eff.amount);
        s = { ...s, hand: [...s.hand, ...drawn], drawPile: drawPile.slice(eff.amount), discardPile };
        if (drawn.length > 0) lines.push(`${card.name} → draw ${drawn.length}.`);
        break;
      }
      case 'gainEnergy': {
        s = { ...s, energy: Math.min(s.maxEnergy, s.energy + eff.amount) };
        lines.push(`${card.name} → energy +${eff.amount}.`);
        break;
      }
      case 'extendDeadlines': {
        s = {
          ...s,
          activeTasks: s.activeTasks.map(t =>
            t.expired ? t : { ...t, deadline: t.deadline + eff.amount }
          ),
        };
        lines.push(`${card.name} → all deadlines +${eff.amount}.`);
        break;
      }
      case 'lowerEffort': {
        s = {
          ...s,
          activeTasks: s.activeTasks.map(t =>
            t.expired ? t : { ...t, effort: Math.max(1, t.effort - eff.amount) }
          ),
        };
        lines.push(`${card.name} → all effort −${eff.amount}.`);
        break;
      }
    }
  }

  // Remove first occurrence of played card from hand
  const handArr = [...s.hand];
  const idx = handArr.indexOf(cardId);
  if (idx !== -1) handArr.splice(idx, 1);

  return { ...s, hand: handArr, discardPile: [...s.discardPile, cardId], log: [...s.log, ...lines] };
}

export function pqEndTurn(state: PriorityQueueState): PriorityQueueState {
  let s = { ...state, selectedCard: null };
  const lines: string[] = [];

  // Tick deadlines
  s = {
    ...s,
    activeTasks: s.activeTasks.map(t => t.expired ? t : { ...t, deadline: t.deadline - 1 }),
  };

  // Expire overdue incomplete tasks
  const expiring = s.activeTasks.filter(t => !t.expired && t.deadline <= 0 && t.progress < t.effort);
  if (expiring.length > 0) {
    const penalty = expiring.length * 3;
    s = {
      ...s,
      overwhelm: Math.min(s.maxOverwhelm, s.overwhelm + penalty),
      activeTasks: s.activeTasks.map(t =>
        !t.expired && t.deadline <= 0 && t.progress < t.effort ? { ...t, expired: true } : t
      ),
    };
    lines.push(`${expiring.map(t => t.name).join(', ')} expired. +${penalty} Overwhelm.`);
  }

  // Flip pressure card
  if (s.pressureQueue.length > 0) {
    const [pressureId, ...remaining] = s.pressureQueue;
    const pressure = MINI_PRESSURE_DATA[pressureId];
    s = { ...s, pressureQueue: remaining, pressureDiscard: [...s.pressureDiscard, pressureId] };
    if (pressure) {
      lines.push(`▶ ${pressure.name}: ${pressure.rulesText}`);
      for (const eff of pressure.effects) {
        switch (eff.kind) {
          case 'addOverwhelm':
            s = { ...s, overwhelm: Math.min(s.maxOverwhelm, s.overwhelm + eff.amount) };
            break;
          case 'shortenDeadlines':
            s = {
              ...s,
              activeTasks: s.activeTasks.map(t =>
                t.expired ? t : { ...t, deadline: t.deadline - eff.amount }
              ),
            };
            break;
          case 'increaseEffort':
            s = {
              ...s,
              activeTasks: s.activeTasks.map(t =>
                t.expired ? t : { ...t, effort: t.effort + eff.amount }
              ),
            };
            break;
          case 'discardRandom': {
            const toDiscard = s.hand.slice(0, eff.amount);
            s = {
              ...s,
              hand: s.hand.slice(eff.amount),
              discardPile: [...s.discardPile, ...toDiscard],
            };
            if (toDiscard.length > 0) {
              lines.push(`Discarded: ${toDiscard.map(id => MINI_CARDS[id]?.name ?? id).join(', ')}.`);
            }
            break;
          }
        }
      }
    }
  }

  // Check loss: overwhelm maxed
  if (s.overwhelm >= s.maxOverwhelm) {
    lines.push('Overwhelm maxed. You push back from the desk.');
    return { ...s, log: [...s.log, ...lines], result: 'lost' };
  }

  const completedCount = s.activeTasks.filter(t => t.progress >= t.effort).length;
  const incompleteActive = s.activeTasks.filter(t => !t.expired && t.progress < t.effort).length;

  // Check win: all tasks completed
  if (completedCount === s.totalTasks) {
    lines.push('All tasks complete.');
    return { ...s, log: [...s.log, ...lines], result: 'won' };
  }

  // Check if all remaining tasks have expired with nothing done
  if (incompleteActive === 0 && completedCount === 0) {
    lines.push('Every task expired. Nothing happened.');
    return { ...s, log: [...s.log, ...lines], result: 'lost' };
  }

  // Check last turn
  if (s.turn >= s.maxTurns) {
    const result: PriorityQueueState['result'] =
      completedCount === s.totalTasks ? 'won' : completedCount > 0 ? 'partial' : 'lost';
    const endings = {
      won: 'Everything done.',
      partial: 'Time is up. Some things happened.',
      lost: 'Time is up. Nothing finished.',
    };
    lines.push(endings[result]);
    return { ...s, log: [...s.log, ...lines], result };
  }

  // Draw up to 4, reset energy, advance turn
  const drawCount = Math.max(0, 4 - s.hand.length);
  let { drawPile, discardPile } = s;
  if (drawPile.length < drawCount) {
    drawPile = [...drawPile, ...shuffle([...discardPile])];
    discardPile = [];
  }
  const drawn = drawPile.slice(0, drawCount);

  return {
    ...s,
    hand: [...s.hand, ...drawn],
    drawPile: drawPile.slice(drawCount),
    discardPile,
    energy: s.maxEnergy,
    turn: s.turn + 1,
    log: [...s.log, ...lines, `── Turn ${s.turn + 1} ──`],
  };
}

export function pqAbandon(state: PriorityQueueState): PriorityQueueState {
  return {
    ...state,
    result: 'lost',
    selectedCard: null,
    log: [...state.log, 'You push back from the desk. The tasks remain.'],
  };
}

export function pqResolve(state: PriorityQueueState): MiniGameResolution {
  switch (state.result) {
    case 'won':
      return {
        focusDelta: 15, timeDelta: -10, chaosDelta: -10,
        message: 'You cleared the board. Everything got done. This is not how most days go.',
        completesAction: state.completesAction,
      };
    case 'partial': {
      const completed = state.activeTasks.filter(t => t.progress >= t.effort).length;
      return {
        focusDelta: 5, timeDelta: -10, chaosDelta: 5,
        message: `${completed} task${completed !== 1 ? 's' : ''} done. The rest are still there. You resurface.`,
        completesAction: state.completesAction,
      };
    }
    case 'lost':
    default:
      return {
        focusDelta: -15, timeDelta: -10, chaosDelta: 20,
        message: 'You sat at the desk for a while. The tasks watched you sit there. Nothing is different.',
        completesAction: undefined,
      };
  }
}

// ─── Doom Scroll ─────────────────────────────────────────────────────────────

export function createDoomScrollState(completesAction?: string): DoomScrollState {
  return {
    id: 'doom-scroll',
    scrollCount: 0,
    timeCost: 0,
    chaosCost: 0,
    buttonScale: 1.0,
    contentIndex: Math.floor(Math.random() * DOOM_SCROLL_CONTENTS.length),
    done: false,
    completesAction,
  };
}

export function dsScroll(state: DoomScrollState): DoomScrollState {
  const newCount = state.scrollCount + 1;
  const newIndex = (state.contentIndex + 1) % DOOM_SCROLL_CONTENTS.length;
  const newScale = Math.max(0.2, 1.0 - newCount * 0.09);
  return {
    ...state,
    scrollCount: newCount,
    timeCost: state.timeCost + 3,
    chaosCost: state.chaosCost + 3,
    buttonScale: newScale,
    contentIndex: newIndex,
    done: newCount >= 10,
  };
}

export function dsPutDown(state: DoomScrollState): DoomScrollState {
  return { ...state, done: true };
}

export function dsResolve(state: DoomScrollState): MiniGameResolution {
  const { scrollCount } = state;
  const timeDelta = -Math.min(25, state.timeCost);
  const chaosDelta = Math.min(25, state.chaosCost);

  if (scrollCount === 0) {
    return {
      focusDelta: 5, timeDelta: -2, chaosDelta: 2,
      message: 'You looked at it. You put it down. Remarkable restraint.',
    };
  } else if (scrollCount <= 2) {
    return {
      focusDelta: 3, timeDelta, chaosDelta: Math.floor(chaosDelta / 2),
      message: 'You put it down. A minor miracle.',
    };
  } else if (scrollCount <= 5) {
    return {
      focusDelta: 0, timeDelta, chaosDelta,
      message: 'Eventually you resurfaced. The phone was warm.',
    };
  } else if (scrollCount <= 8) {
    return {
      focusDelta: -8, timeDelta, chaosDelta,
      message: "The phone was warm. You don't know how long that took.",
    };
  } else {
    return {
      focusDelta: -15, timeDelta: -25, chaosDelta: 25,
      message: 'Your thumb is still moving. You stop it deliberately. You have been here a while.',
    };
  }
}

// ─── Shared resolver ──────────────────────────────────────────────────────────

export function resolveMiniGame(mg: PendingMiniGame): MiniGameResolution {
  if (mg.id === 'priority-queue') return pqResolve(mg);
  return dsResolve(mg as DoomScrollState);
}
